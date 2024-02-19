import { Vector3Tuple } from "three";

export interface GameState {
  [clientId: string]: TankState;
}

export interface TankState {
  position: Vector3Tuple;
  rotation: number;
}

export type Action = "w" | "a" | "s" | "d";

export interface Client {
  clientId: string;
  gameId: string;
}

// each Game, Tank has an id
// 
