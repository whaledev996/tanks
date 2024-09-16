import { Group } from "three";
import { TanksMap } from "./map";
import { Collidable } from "./types";

export class PartnerTank implements Collidable {
  tank: Group; // store the actual tank model, not needed on the server
  map: TanksMap;

  constructor(obj: Group, map: TanksMap) {
    this.tank = obj;
    this.map = map;
  }
}
