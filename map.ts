import { Box3, Vector3, Vector3Tuple } from "three";
import { BoxGeometryTuple, Collidable, CollidableType } from "./types";

const _v0 = new Vector3();
const _v1 = new Vector3();
const _b0 = new Box3();

export interface TanksMap {
  startingPosition: Vector3Tuple;
  secondStartingPosition: Vector3Tuple;
  objects: TanksMapObject[];
}

export class TanksMapObject implements Collidable {
  position: Vector3Tuple;
  geometry: BoxGeometryTuple;
  texture: string;
  type: CollidableType;

  constructor(params: {
    position: Vector3Tuple;
    geometry: BoxGeometryTuple;
    texture: string;
  }) {
    this.position = params.position;
    this.geometry = params.geometry;
    this.texture = params.texture;
    this.type = "map";
  }

  getBoundingBox(): Box3 {
    _v0.set(...this.position);
    _v1.set(...this.geometry);
    _b0.setFromCenterAndSize(_v0, _v1);
    return _b0;
  }

  handleCollision(obj: Collidable) {}
}

// LEVEL 1!
export const map1: TanksMap = {
  startingPosition: [-10, 0, 0],
  secondStartingPosition: [-10, -5, 0],
  objects: [
    new TanksMapObject({
      position: [0, 5, 0],
      geometry: [2, 1, 2],
      texture: "wood/wood4.jpg",
    }),
    new TanksMapObject({
      position: [1, 4, 0],
      geometry: [2, 1, 2],
      texture: "wood/wood4.jpg",
    }),
    new TanksMapObject({
      position: [2, 3, 0],
      geometry: [2, 1, 2],
      texture: "wood/wood4.jpg",
    }),
    new TanksMapObject({
      position: [3, 2, 0],
      geometry: [2, 1, 2],
      texture: "wood/wood4.jpg",
    }),
    new TanksMapObject({
      position: [4, 1, 0],
      geometry: [2, 1, 2],
      texture: "wood/wood4.jpg",
    }),
    new TanksMapObject({
      position: [5, 0, 0],
      geometry: [2, 1, 2],
      texture: "wood/wood4.jpg",
    }),
    new TanksMapObject({
      position: [0, 10, 0],
      geometry: [40, 0.5, 0.5],
      texture: "wood/wood.png",
    }),
    new TanksMapObject({
      position: [0, -10, 0],
      geometry: [40, 0.5, 0.5],
      texture: "wood/wood.png",
    }),
    new TanksMapObject({
      position: [-20, 0, 0],
      geometry: [0.5, 20.5, 0.5],
      texture: "wood/wood.png",
    }),
    new TanksMapObject({
      position: [20, 0, 0],
      geometry: [0.5, 20.5, 0.5],
      texture: "wood/wood.png",
    }),
  ],
};
