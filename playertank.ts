import {
  Group,
  Object3D,
  Mesh,
  BoxGeometry,
  Box3,
  Vector3,
  SkinnedMesh,
  Vector3Tuple,
} from "three";
import { Action, Collidable, KeyInput } from "./types";
import { TanksProjectile } from "./projectile";
import { TanksMap, TanksMapObject } from "./map";

export const TANK_WIDTH = 0.95;
export const TANK_HEIGHT = 0.95;
export const TANK_DEPTH = 0.57;
export const TANK_MOVEMENT_SPEED = 3;
export const TANK_ROTATION_SPEED = 2;
export const TANK_PROJECTILE_SPEED = 4;

const _v0 = new Vector3();
const _v1 = new Vector3();
const _v2 = new Vector3();
const _b0 = new Box3();

// WE WANT ALL THIS CODE TO WORK ON CLIENT+SERVER with no changes!!!!!!!
//
// Y IS UP!!!!!!!!!

/*
 * class Game
 *    act(input), given an input to the game, do something
 *      eg. move tank, shoot bullet, etc..
 *
 * In client, we can initalize this at the start of app, same with server
 * all we do is process inputs and do other things
 *
 * subobjects will have "views" (Mesh/Group/Object3D) passed in
 *
 * some sort of map object to store positions of all obstacles?
 */

// a shared Tank that can be used on the Client and the Server
export class PlayerTank implements Collidable {
  tank: Group; // store the actual tank model, not needed on the server
  map: TanksMap;
  ghostTank: Mesh; // invisible object to help handle collisions
  boundingBox: Box3;
  cannon: Object3D | null;
  projectiles: TanksProjectile[];
  dispose: () => void;

  constructor(obj: Group, map: TanksMap) {
    this.ghostTank = new Mesh(
      new BoxGeometry(TANK_WIDTH, TANK_HEIGHT, TANK_DEPTH)
    );
    // if we are running on the browser we shoud have
    // full access to the tank model
    try {
      const skinnedMesh = obj.children[0].children[0] as SkinnedMesh;
      this.cannon = skinnedMesh.skeleton.bones[1];
    } catch (e) {
      this.cannon = null;
    }
    this.boundingBox = new Box3();
    this.map = map;
    this.tank = obj;
    this.projectiles = [];
    this.dispose = () => {};
  }

  getBoundingBox(): Box3 {
    this.boundingBox.setFromObject(this.ghostTank);
    return this.boundingBox;
  }

  move(units: number) {
    this.ghostTank.translateY(units);
    if (this.isIntersectingMap()) {
      this.ghostTank.position.set(...this.tank.position.toArray());
    } else {
      this.tank.translateY(units);
    }
  }

  rotate(units: number) {
    this.ghostTank.rotateZ(units);
    this.tank.rotateZ(units);
  }

  handleMouseMove(position: Vector3Tuple) {
    if (this.cannon) {
      // let _v2 be a vector from the tank to mouse position
      this.tank.getWorldPosition(_v0);
      _v2.set(...position);
      _v2.x = _v2.x + -1 * _v0.x;
      _v2.y = _v2.y + -1 * _v0.y;
      _v2.normalize();

      // angle to rotate cannon is found using dot product
      // of _v2 and the current direction vec of the cannon
      this.cannon.getWorldDirection(_v1);
      _v1.normalize();
      const rotation = Math.acos(_v2.dot(_v1));

      if (!isNaN(rotation)) {
        // calculate cross product of the same vectors
        // to find the direction to rotate
        _v0.crossVectors(_v1, _v2);
        if (_v0.z >= 0) {
          this.cannon.rotateY(rotation);
        } else {
          this.cannon.rotateY(-1 * rotation);
        }
      }
    }
  }

  serverPositionAdjustment(position: Vector3Tuple, rotation: number) {
    this.ghostTank.position.set(...position);
    this.ghostTank.rotation.z = rotation;
    this.tank.position.set(...position);
    this.tank.rotation.z = rotation;
  }

  handleMouseDown(target: Vector3Tuple) {
    this.projectiles.push(
      new TanksProjectile(this.tank.position.toArray(), target)
    );
  }

  isIntersectingMap(): boolean {
    for (let i = 0; i < this.map.objects.length; i += 1) {
      const mapObj = this.map.objects[i];
      const isColliding = this.getBoundingBox().intersectsBox(
        mapObj.getBoundingBox()
      );
      if (isColliding) {
        return true;
      }
    }
    return false;
  }

  // TODO: not sure if this is the correct design
  moveProjectiles(delta: number) {
    this.projectiles.forEach((p) => {
      p.move(TANK_PROJECTILE_SPEED * delta);
    });
  }

  handleCollision(obj: Collidable) {}

  step(keysPressed: KeyInput[], delta: number) {
    keysPressed.forEach((input) => {
      this.handleInput(input, delta);
    });
    this.projectiles = this.projectiles.filter((p) => {
      if (p.bounces < 2) {
        return true;
      }
      this.dispose();
      return false;
    });
    this.moveProjectiles(delta);
  }

  handleInput(action: Action, delta: number) {
    if (action === "w") {
      this.move(TANK_MOVEMENT_SPEED * delta);
    } else if (action === "a") {
      this.rotate(TANK_ROTATION_SPEED * delta);
    } else if (action === "s") {
      this.move(-1 * TANK_MOVEMENT_SPEED * delta);
    } else if (action === "d") {
      this.rotate(-1 * TANK_ROTATION_SPEED * delta);
    } else if (action.eventType === "mousemove") {
      this.handleMouseMove(action.position);
    } else if (action.eventType === "mousedown") {
      this.handleMouseDown(action.position);
    }
  }
}
