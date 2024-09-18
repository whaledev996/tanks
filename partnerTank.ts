import { Box3, Group } from "three";
import { TanksMap } from "./map";
import { Collidable } from "./types";

export class PartnerTank implements Collidable {
  tank: Group; // store the actual tank model, not needed on the server
  map: TanksMap;
  boundingBox: Box3;

  constructor(obj: Group, map: TanksMap) {
    this.tank = obj;
    this.map = map;
  }

  getBoundingBox(): Box3 {
    this.boundingBox.setFromObject(this.tank);
    return this.boundingBox;
  }

  handleCollision(obj: Collidable) {}
}
