import {
  Group,
  Object3D,
  Mesh,
  BoxGeometry,
  Box3,
  Vector3,
  SkinnedMesh,
  Vector3Tuple,
  CapsuleGeometry,
  Matrix4,
  MeshBasicMaterial,
} from "three";
import { Action, Collidable, TanksMap } from "./types";

export const CAPSULE_RADIUS = 0.1;
export const CAPSULE_LENGTH = 0.2;
export const CAPSULE_SEGMENTS = 4;
export const CAPSULE_RADIAL_SEGMENTS = 8;

const _v0 = new Vector3();
const _v1 = new Vector3();
const _v2 = new Vector3();
const _m0 = new Matrix4();
const _b0 = new Box3();

export class TanksProjectile implements Collidable {
  projectile: Mesh;
  geometry: CapsuleGeometry;
  boundingBox: Box3;
  target: Vector3Tuple;
  initialMovement: boolean;

  constructor(position: Vector3Tuple, target: Vector3Tuple) {
    //this.projectile = projectile;
    //this.geometry = geometry;
    this.geometry = new CapsuleGeometry(
      CAPSULE_RADIUS,
      CAPSULE_LENGTH,
      CAPSULE_SEGMENTS,
      CAPSULE_RADIAL_SEGMENTS
    );
    // TODO: do we need this?
    this.geometry.applyMatrix4(_m0.makeRotationX(Math.PI / 2));
    this.projectile = new Mesh(this.geometry);
    this.boundingBox = new Box3();

    this.target = target;
    this.projectile.position.set(...position);
    this.initialMovement = true;
  }

  getBoundingBox(): Box3 {
    this.boundingBox.setFromObject(this.projectile);
    return this.boundingBox;
  }

  move(units: number) {
    // when created, point in direction of target
    // and move slightly away from tank
    if (this.initialMovement) {
      this.projectile.lookAt(...this.target);
      this.projectile.translateZ(1);
      this.initialMovement = false;
    }
    this.projectile.translateZ(units);
  }
}
