import { Group, Object3D, Mesh, BoxGeometry, Box3, Vector3 } from "three";
import { Action, TanksMap } from "./types";

export const TANK_WIDTH = 1.005;
export const TANK_HEIGHT = 1.005;
export const TANK_DEPTH = 0.57;
export const TANK_MOVEMENT_SPEED = 3;
export const TANK_ROTATION_SPEED = 2;

const _v0 = new Vector3();
const _v1 = new Vector3();
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
export class PlayerTank {
  tank: Group; // store the actual tank model, not needed on the server
  map: TanksMap;
  ghostTank: Mesh; // invisible object to help handle collisions
  boundingBox: Box3;

  constructor(obj: Group, map: TanksMap) {
    this.ghostTank = new Mesh(
      new BoxGeometry(TANK_WIDTH, TANK_HEIGHT, TANK_DEPTH)
    );
    this.boundingBox = new Box3();
    this.map = map;
    this.tank = obj;
  }

  isCollision(): boolean {
    this.boundingBox.setFromObject(this.ghostTank);
    for (
      let mapObjIdx = 0;
      mapObjIdx < this.map.objects.length;
      mapObjIdx += 1
    ) {
      let mapObj = this.map.objects[mapObjIdx];

      // TODO: speed this up, should probably pre-calculate this
      _v0.set(...mapObj.position);
      _v1.set(...mapObj.geometry);
      _b0.setFromCenterAndSize(_v0, _v1);

      const doesIntersect = this.boundingBox.intersectsBox(_b0);
      if (doesIntersect) {
        return true;
      }
    }
    return false;
  }

  move(units: number) {
    this.ghostTank.translateY(units);
    if (this.isCollision()) {
      this.ghostTank.position.set(...this.tank.position.toArray());
    } else {
      this.tank.translateY(units);
    }
  }

  rotate(units: number) {
    this.ghostTank.rotateZ(units);
    this.tank.rotateZ(units);
  }

  handleInput(action: Action, delta: number) {
    if (action === "w") {
      this.move(TANK_MOVEMENT_SPEED * delta);
    }
    if (action === "a") {
      this.rotate(TANK_ROTATION_SPEED * delta);
    }
    if (action === "s") {
      this.move(-1 * TANK_MOVEMENT_SPEED * delta);
    }
    if (action === "d") {
      this.rotate(-1 * TANK_ROTATION_SPEED * delta);
    }
  }
}
