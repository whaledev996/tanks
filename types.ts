import { Box3, Vector3Tuple } from "three";

export interface GameState {
  [clientId: string]: TankState;
}

export interface TankState {
  position: Vector3Tuple;
  rotation: number;
  cannonDirection: Vector3Tuple;
  timestamp: number;
}

export interface ClientPayload {
  action: KeyInput[] | TankMouseEvent;
  clientId: string;
  gameId: string;
  timestamp: number;
}

export type Action = KeyInput | TankMouseEvent;
export type KeyInput = "w" | "a" | "s" | "d";
export type BoxGeometryTuple = [number, number, number];

export type CollidableType =
  | "playerTank"
  | "partnerTank"
  | "projectile"
  | "map";

export interface TankMouseEvent {
  position: Vector3Tuple;
  eventType: "mousedown" | "mousemove";
}

export interface Client {
  clientId: string;
  gameId: string;
}

export interface Collidable {
  getBoundingBox: () => Box3;
  handleCollision: (obj: Collidable) => void;
  type: CollidableType;
}

export interface ClientAction {
  action: string[];
  timestamp: number;
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
