import { Group, Object3D, Mesh, BoxGeometry, Box3 } from "three";
import { Action } from "./types";

export const TANK_WIDTH = 1.005;
export const TANK_HEIGHT = 1.005;
export const TANK_DEPTH = 0.57;
export const TANK_MOVEMENT_SPEED = 3;
export const TANK_ROTATION_SPEED = 2;

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

// a shared Tank to be used between client and server
export class PlayerTank {
  tank: Group; // store the actual tank model, not needed on the server
  ghostTank: Mesh; // invisible object to help handle collisions
  boundingBox: Box3;
  delta: number; // seconds per frame

  constructor(delta: number) {
    const boxGeo = new BoxGeometry(TANK_WIDTH, TANK_HEIGHT, TANK_DEPTH);
    this.ghostTank = new Mesh(boxGeo);
    this.boundingBox = new Box3();
    this.delta = delta;
  }

  setModel(obj: Group) {
    this.tank = obj;
  }

  handleInput(action: Action) {
    if (action === "w") {
      this.tank.translateY(TANK_MOVEMENT_SPEED * this.delta);
    }
    if (action === "a") {
      this.tank.translateY(TANK_ROTATION_SPEED * this.delta);
    }
    if (action === "s") {
      this.tank.translateY(-1 * TANK_MOVEMENT_SPEED * this.delta);
    }
    if (action === "d") {
      this.tank.translateY(-1 * TANK_ROTATION_SPEED * this.delta);
    }
  }
}
