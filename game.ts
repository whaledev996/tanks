// what does a Game object consist of?
//
// a current "currentMap"
// an array of player tanks
// an array of enemy tanks?
// should send events to server and reconcile
//
import { Group, Vector3Tuple } from "three";
import { PlayerTank } from "./playerTank";
import { Action, Collidable, KeyInput, TankState } from "./types";
import { TanksMap } from "./map";
import { PartnerTank } from "./partnerTank";

export type Tank = PlayerTank | PartnerTank;

export function isPartnerTank(tank: Tank): tank is PartnerTank {
  return tank.type === "partnerTank";
}

export class Game {
  currentMap: TanksMap;
  playerTank: PlayerTank;
  otherTanks: { [clientId: string]: PartnerTank | PlayerTank };
  gameId: string;
  clientId: string;

  constructor(obj: Group, map: TanksMap, gameId: string, clientId: string) {
    this.currentMap = map;
    this.playerTank = new PlayerTank(obj, map);
    this.gameId = gameId;
    this.clientId = clientId;
    this.otherTanks = {};
  }

  checkCollisions() {
    // compute the collision matrix
    const collidableObjects: Collidable[] = [
      this.playerTank,
      ...this.playerTank.projectiles,
      ...Object.values(this.otherTanks),
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

  isIntersectingMapOrTank(): boolean {
    for (let i = 0; i < this.currentMap.objects.length; i += 1) {
      const mapObj = this.currentMap.objects[i];
      const isColliding = this.playerTank
        .getBoundingBox()
        .intersectsBox(mapObj.getBoundingBox());
      if (isColliding) {
        return true;
      }
    }
    for (const otherTank of Object.values(this.otherTanks)) {
      const isColliding = this.playerTank
        .getBoundingBox()
        .intersectsBox(otherTank.getBoundingBox());
      if (isColliding) {
        return true;
      }
    }
    return false;
  }

  joinGame(clientId: string, tank: PartnerTank | PlayerTank) {
    this.otherTanks[clientId] = tank;
    this.playerTank.addTank(tank);
  }

  updateClient(clientId: string, state: TankState) {
    if (clientId in this.otherTanks) {
      const tank = this.otherTanks[clientId];
      if (isPartnerTank(tank)) {
        tank.desiredPosition = state.position;
        tank.desiredRotation = state.rotation;
        tank.desiredCannonDirection = state.cannonDirection;
        tank.updateProjectiles(state.projectiles);
      }
    }
  }

  // game loop goes here, call this with delta=1/FPS
  step(keysPressed: KeyInput[], delta: number) {
    this.playerTank.step(keysPressed, delta);
    Object.values(this.otherTanks).forEach((tank) => {
      if (isPartnerTank(tank)) {
        tank.step();
      }
    });
    this.checkCollisions();
  }

  // TODO: need to refactor this
  handleInput(action: Action, delta: number) {
    this.playerTank.handleInput(action, delta);
  }
}
