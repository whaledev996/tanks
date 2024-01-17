import { Vector3Tuple } from "three";

export interface GameState {
  [clientId: string]: TankState;
}

interface TankState {
  position: Vector3Tuple;
  rotation: number;
}
