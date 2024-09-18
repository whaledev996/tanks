// what does a Game object consist of?
//
// a current "currentMap"
// an array of player tanks
// an array of enemy tanks?
// should send events to server and reconcile
//
import { Group } from "three";
import { PlayerTank } from "./playerTank";
import { Action, Collidable, KeyInput } from "./types";
import { TanksMap } from "./map";

export class Game {
  currentMap: TanksMap;
  playerTank: PlayerTank;
  gameId: string;
  clientId: string;

  constructor(obj: Group, map: TanksMap, gameId: string, clientId: string) {
    this.currentMap = map;
    this.playerTank = new PlayerTank(obj, map);
    this.gameId = gameId;
    this.clientId = clientId;
  }

  checkCollisions() {
    const collidableObjects: Collidable[] = [
      this.playerTank,
      ...this.playerTank.projectiles,
      ...this.currentMap.objects,
    ];
    for (let i = 0; i < collidableObjects.length; i += 1) {
      for (let j = i + 1; j < collidableObjects.length; j += 1) {
        const firstObj = collidableObjects[i];
        const secondObj = collidableObjects[j];

        const isColliding = firstObj
          .getBoundingBox()
          .intersectsBox(secondObj.getBoundingBox());
        if (isColliding) {
          firstObj.handleCollision(secondObj);
        }
      }
    }
  }

  joinGame() {}

  // game loop goes here, call this with delta=1/FPS
  step(keysPressed: KeyInput[], delta: number) {
    this.playerTank.step(keysPressed, delta);
    this.checkCollisions();
  }

  // TODO: need to refactor this
  handleInput(action: Action, delta: number) {
    this.playerTank.handleInput(action, delta);
  }
}
