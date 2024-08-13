import { Vector3Tuple } from "three";

export interface GameState {
  [clientId: string]: TankState;
}

export interface TankState {
  position: Vector3Tuple;
  rotation: number;
  sequence: number;
}

export type Action = "w" | "a" | "s" | "d";
export type BoxGeometryTuple = [number, number, number];

export interface Client {
  clientId: string;
  gameId: string;
}

export interface ClientAction {
  action: string[];
  sequence: number;
}

export interface ClientActions {
  actions: Action[];
  sequence: number;
}

export interface Projectile {
  direction: number;
  target: Vector3Tuple;
  position: Vector3Tuple;
  id: string;
}

export interface TanksMap {
  startingPosition: Vector3Tuple;
  objects: TanksMapObject[];
}

export interface TanksMapObject {
  position: Vector3Tuple;
  geometry: BoxGeometryTuple;
  texture: string;
}

// each Game, Tank has an id
//
