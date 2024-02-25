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

export interface Client {
  clientId: string;
  gameId: string;
}

export interface ClientAction {
  action: Action;
  sequence: number;
}

export interface ClientActions {
  actions: Action[];
  sequence: number;
}

// each Game, Tank has an id
// 
