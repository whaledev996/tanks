import {
  Mesh,
  Box3,
  Vector3Tuple,
  CapsuleGeometry,
  Matrix4,
  Vector3,
} from "three";
import { Collidable, CollidableType } from "./types";
import { TanksMapObject } from "./map";

export const CAPSULE_RADIUS = 0.1;
export const CAPSULE_LENGTH = 0.2;
export const CAPSULE_SEGMENTS = 4;
export const CAPSULE_RADIAL_SEGMENTS = 8;

const _v0 = new Vector3();
const _v1 = new Vector3();
const _m0 = new Matrix4();

export class TanksProjectile implements Collidable {
  projectile: Mesh;
  geometry: CapsuleGeometry;
  boundingBox: Box3;
  target: Vector3Tuple;
  initialMovement: boolean;
  direction: number;
  bounces: number;
  type: CollidableType;

  constructor(position: Vector3Tuple, target: Vector3Tuple) {
    this.geometry = new CapsuleGeometry(
      CAPSULE_RADIUS,
      CAPSULE_LENGTH,
      CAPSULE_SEGMENTS,
      CAPSULE_RADIAL_SEGMENTS,
    );
    // TODO: do we need this?
    this.geometry.applyMatrix4(_m0.makeRotationX(Math.PI / 2));
    this.projectile = new Mesh(this.geometry);
    this.boundingBox = new Box3();

    this.target = target;
    this.projectile.position.set(...position);
    this.initialMovement = true;
    this.direction = 1;
    this.bounces = 0;
    this.type = "projectile";
  }

  getBoundingBox(): Box3 {
    this.boundingBox.setFromObject(this.projectile);
    return this.boundingBox;
  }

  handleCollision(obj: Collidable) {
    if (obj instanceof TanksMapObject) {
      this.bounces += 1;
      const boundingBox1 = obj.getBoundingBox();
      const boundingBox2 = this.getBoundingBox();
      boundingBox1.getCenter(_v0);
      boundingBox2.getCenter(_v1);

      const objHalfW = _v0.x - boundingBox1.min.x;
      const objHalfH = _v0.y - boundingBox1.min.y;
      const projHalfW = CAPSULE_LENGTH / 2;
      const projHalfH = CAPSULE_RADIUS;

      // if obj is on right side of projectile, diffX is > 0, if on left side, diffX < 0
      const diffX = _v0.x - _v1.x;

      // if obj is on bottom side of projectile, diffY is < 0, if on top side, diffY > 0
      const diffY = _v0.y - _v1.y;

      const minXDist = objHalfW + projHalfW;
      const minYDist = objHalfH + projHalfH;

      var depthX = diffX > 0 ? minXDist - diffX : -minXDist - diffX;
      var depthY = diffY > 0 ? minYDist - diffY : -minYDist - diffY;

      // Now that you have the depth, you can pick the smaller depth and move
      // along that axis.
      if (depthX != 0 && depthY != 0) {
        if (Math.abs(depthX) < Math.abs(depthY)) {
          // Collision along the X axis. React accordingly
          this.projectile.rotation.x *= -1;
          this.direction *= -1;
        } else {
          // Collision along the Y axis.
          this.projectile.rotation.y *= -1;
          this.direction *= -1;
        }
      }
    }
  }

  move(units: number) {
    // when created, point in direction of target
    // and move slightly away from tank
    if (this.initialMovement) {
      this.projectile.lookAt(...this.target);
      this.projectile.translateZ(1);
      this.initialMovement = false;
    }
    // this.projectile.getWorldDirection(_v0);
    // console.log(_v0);
    this.projectile.translateZ(this.direction * units);
  }
}
