import {
  Box3,
  Group,
  Object3D,
  SkinnedMesh,
  Vector3Tuple,
  Vector3,
} from "three";
import { Collidable, CollidableType, Projectile } from "./types";
import { PartnerTanksProjectile } from "./projectile";

const _v0 = new Vector3();
const _v1 = new Vector3();
const _v2 = new Vector3();

export class PartnerTank implements Collidable {
  tank: Group;
  cannon: Object3D;
  desiredPosition: Vector3Tuple;
  boundingBox: Box3;
  desiredRotation: number;
  desiredCannonDirection: Vector3Tuple;
  type: CollidableType;
  projectiles: Map<number, PartnerTanksProjectile>;

  constructor(obj: Group) {
    this.tank = obj;
    const skinnedMesh = obj.children[0].children[0] as SkinnedMesh;
    this.cannon = skinnedMesh.skeleton.bones[1];
    this.boundingBox = new Box3();
    this.type = "partnerTank";
    this.projectiles = new Map();
  }

  // TODO: do we need this?
  getBoundingBox(): Box3 {
    this.boundingBox.setFromObject(this.tank);
    return this.boundingBox;
  }

  handleCollision(obj: Collidable) {}

  lerpRotateCannonToDirection(dir: Vector3) {
    // angle to rotate cannon is found using dot product
    // of _v2 and the current direction vec of the cannon
    this.cannon.getWorldDirection(_v1);
    _v1.normalize();
    const rotation = Math.acos(dir.dot(_v1));

    if (!isNaN(rotation)) {
      // calculate cross product of the same vectors
      // to find the direction to rotate
      _v0.crossVectors(_v1, dir);
      if (_v0.z >= 0) {
        this.cannon.rotateY(rotation * 0.05);
      } else {
        this.cannon.rotateY(-1 * rotation * 0.05);
      }
    }
  }

  updateProjectiles(projectiles: Projectile[]) {
    const currentIds = new Set(this.projectiles.keys());
    projectiles.forEach((p) => {
      if (currentIds.has(p.id)) {
        currentIds.delete(p.id);
        const tanksProjectile = this.projectiles.get(p.id);
        if (tanksProjectile) {
          tanksProjectile.desiredPosition = p.position;
          tanksProjectile.desiredDirection = p.direction;
          tanksProjectile.desiredRotationX = p.rotation[0];
          tanksProjectile.desiredRotationY = p.rotation[1];
        }
      } else {
        const newProjectile = new PartnerTanksProjectile(p.id);
        newProjectile.desiredPosition = p.position;
        newProjectile.desiredDirection = p.direction;
        newProjectile.desiredRotationX = p.rotation[0];
        newProjectile.desiredRotationY = p.rotation[1];
        this.projectiles.set(p.id, newProjectile);
      }
    });
    currentIds.forEach((id) => {
      this.projectiles.delete(id);
    });
  }

  step() {
    if (this.desiredPosition) {
      _v0.set(...this.desiredPosition);
      this.tank.position.lerp(_v0, 0.05);
    }

    if (this.desiredRotation) {
      let currentRotation = this.tank.rotation.z;
      let rotationDiff = this.desiredRotation - currentRotation;

      // simulate "lerp" for rotation
      let newRotation = currentRotation + rotationDiff * 0.05;
      if (rotationDiff < -Math.PI) {
        rotationDiff = this.desiredRotation + 2 * Math.PI - currentRotation;
        newRotation = currentRotation + rotationDiff * 0.05 - 2 * Math.PI;
      } else if (rotationDiff >= Math.PI) {
        rotationDiff = currentRotation + 2 * Math.PI - this.desiredRotation;
        newRotation = currentRotation + 2 * Math.PI - rotationDiff * 0.05;
      }
      this.tank.rotation.z = newRotation;
    }

    if (this.desiredCannonDirection) {
      _v2.set(...this.desiredCannonDirection);
      this.lerpRotateCannonToDirection(_v2);
    }

    for (const projectile of this.projectiles.values()) {
      projectile.step();
    }
  }
}
