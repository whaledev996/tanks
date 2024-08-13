// what does a Game object consist of?
//
// a current "map"
// an array of player tanks
// an array of enemy tanks?
// should send events to server and reconcile

import { Bone, Group, SkinnedMesh } from "three";
import { PlayerTank } from "./playertank";
import { Action, TanksMap } from "./types";

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

  // addPlayer(obj: Group) {
  //   const playerTank = new PlayerTank(obj, this.currentMap, this.delta);
  //   this.playerTanks.push(playerTank);
  // }

  handleInput(action: Action, delta: number) {
    this.playerTank.handleInput(action, delta);
  }
}
