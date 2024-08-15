// what does a Game object consist of?
//
// a current "currentMap"
// an array of player tanks
// an array of enemy tanks?
// should send events to server and reconcile
//
const _v0 = new Vector3();
const _v1 = new Vector3();
const _b0 = new Box3();

import { Box3, Group, Vector3 } from "three";
import { PlayerTank } from "./playertank";
import { Action, KeyInput, TanksMap } from "./types";

export class Game {
  currentMap: TanksMap;
  playerTank: PlayerTank;
  // playerTanks: PlayerTank[];
  gameId: string;
  clientId: string;

  constructor(map: TanksMap, obj: Group) {
    this.currentMap = map;
    this.playerTank = new PlayerTank(obj, map);
  }

  checkCollisions() {
    for (
      let mapObjIdx = 0;
      mapObjIdx < this.currentMap.objects.length;
      mapObjIdx += 1
    ) {
      let mapObj = this.currentMap.objects[mapObjIdx];

      // TODO: speed this up, should probably pre-calculate this
      _v0.set(...mapObj.position);
      _v1.set(...mapObj.geometry);
      _b0.setFromCenterAndSize(_v0, _v1);

      const playerBoundingBox = this.playerTank.getBoundingBox();

      const isColliding = playerBoundingBox.intersectsBox(_b0);
      if (isColliding) console.log(this.playerTank.isIntersectingMap);
    }
  }

  // game loop goes here, call this with delta=1/FPS
  step(keysPressed: KeyInput[], delta: number) {
    keysPressed.forEach((input) => {
      this.handleInput(input, delta);
    });
    this.playerTank.moveProjectiles(delta);
    this.checkCollisions();
  }

  handleInput(action: Action, delta: number) {
    this.playerTank.handleInput(action, delta);
  }
}
