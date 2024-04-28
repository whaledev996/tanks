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

// each Game, Tank has an id
// 
