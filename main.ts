import * as THREE from "three";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

class Tank {
  geometry: THREE.BoxGeometry;
  material: THREE.MeshBasicMaterial;
  mesh: THREE.Mesh;
  movementSpeed: number;
  rotationSpeed: number;
  boundingBox: THREE.Box3;

  constructor(
    width = 1,
    height = 1,
    depth = 0.5,
    color = 0x4287f5,
    movementSpeed = 0.05,
    rotationSpeed = 0.03,
  ) {
    this.geometry = new THREE.BoxGeometry(width, height, depth);
    this.material = new THREE.MeshBasicMaterial({ color: color });
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.movementSpeed = movementSpeed;
    this.rotationSpeed = rotationSpeed;
    this.boundingBox = new THREE.Box3().setFromObject(this.mesh);
  }

  moveForward() {
    this.mesh.translateY(this.movementSpeed);
    this.boundingBox.setFromObject(this.mesh);
  }

  moveBackward() {
    this.mesh.translateY(-1 * this.movementSpeed);
    this.boundingBox.setFromObject(this.mesh);
  }

  rotateLeft() {
    this.mesh.rotateZ(this.rotationSpeed);
  }

  rotateRight() {
    this.mesh.rotateZ(-1 * this.rotationSpeed);
  }

  intersects(other: THREE.Box3) {
    return this.boundingBox.intersectsBox(other);
  }
}

class Client {
  websocket: WebSocket;
  id: string;

  constructor() {
    this.websocket = new WebSocket("ws://localhost:8765/");
    this.id = crypto.randomUUID();
  }

  send(message, callback) {
    this.waitForConnection(() => {
      this.websocket.send(message);
      if (typeof callback !== "undefined") {
        callback();
      }
    }, 1000);
  }

  waitForConnection(callback, interval) {
    if (this.websocket.readyState === 1) {
      callback();
    } else {
      var that = this;
      // optional: implement backoff for interval here
      setTimeout(function () {
        that.waitForConnection(callback, interval);
      }, interval);
    }
  }

  connect() {
    const event = { type: "init" };
    this.send(JSON.stringify(event), undefined);
  }

  sendMovement() {
    const ts = Date.now();
    const projectilePositions: Array<Array<Number>> = [];
    for (const p of projectiles) {
      const projectile = p[0];
      const projectileBox = p[1];
      const direction = p[2];
      projectilePositions.push([projectile.position.x, projectile.position.y]);
    }
    const data = {
      id: this.id,
      ts: ts,
      position: [player.mesh.position.x, player.mesh.position.y],
      projectiles: projectilePositions,
    };
    const event = { type: "position", data: data };
    this.send(JSON.stringify(event), undefined);
  }
}

const player = new Tank();

scene.add(player.mesh);

camera.position.z = 25;
camera.position.y = -10;
camera.lookAt(0, 0, 0);

var vec = new THREE.Vector3(); // create once and reuse
var pos = new THREE.Vector3(); // create once and reuse

const projectileGeometry = new THREE.CapsuleGeometry(0.2, 0.3, 4, 8);
projectileGeometry.applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI / 2));
let projectiles: Array<Object> = [];
const client = new Client();

window.addEventListener("mousedown", (event) => {
  const projectileMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial);
  const projectileBox = new THREE.Box3().setFromObject(projectile);
  vec.set(
    (event.clientX / window.innerWidth) * 2 - 1,
    -(event.clientY / window.innerHeight) * 2 + 1,
    0.5,
  );
  console.log(vec);

  vec.unproject(camera);

  vec.sub(camera.position).normalize();

  var distance = -camera.position.z / vec.z;

  pos.copy(camera.position).add(vec.multiplyScalar(distance));
  console.log(`CAMERA`);
  console.log(camera.position);
  console.log(`VECTOR`);
  console.log(vec);
  console.log(`DISTANCE`);
  console.log(distance);
  console.log(`POS`);
  console.log(pos);
  projectile.position.x = player.mesh.position.x;
  projectile.position.y = player.mesh.position.y;
  projectile.position.z = player.mesh.position.z;

  projectile.lookAt(pos);

  console.log(projectile.rotation);
  scene.add(projectile);
  projectiles.push([projectile, projectileBox, 1]);
  client.sendMovement();
});

const keys = new Set();
const arrowKeys = new Set(["w", "a", "s", "d", "y"]);
window.addEventListener("keyup", (e) => {
  const key = e.key;
  if (arrowKeys.has(key)) {
    keys.delete(key);
  }
});
window.addEventListener("keydown", (e) => {
  const key = e.key;
  if (arrowKeys.has(key)) {
    keys.add(key);
  }
});

// # window.addEventListener("keydown", (

const boxGeometry = new THREE.BoxGeometry(20, 2, 4);
const loader = new THREE.TextureLoader();
const boxMesh = new THREE.MeshStandardMaterial({
  map: loader.load("compressed-but-large-wood-texture.jpg"),
});
boxMesh.color.convertSRGBToLinear();
const standardBox = new THREE.Mesh(boxGeometry, boxMesh);
standardBox.position.set(0, 8, 2);
scene.add(standardBox);

const light = new THREE.HemisphereLight(0xddeeff, 0x202020, 5);
light.position.set(0, 0, 0);
scene.add(light);

const boundingBox2 = new THREE.Box3().setFromObject(standardBox);

/* WebSocket code */
window.addEventListener("DOMContentLoaded", () => {
  console.log("connecting");
  client.connect();
});

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  //const event = {type: "position", position: player.mesh.position}
  //websocket.send(JSON.stringify(event))
  //player.

  if (keys.has("a")) {
    player.rotateLeft();
  }

  if (keys.has("w")) {
    player.moveForward();
    if (player.intersects(boundingBox2)) {
      player.moveBackward();
    }
    client.sendMovement();
  }

  if (keys.has("d")) {
    player.rotateRight();
  }

  if (keys.has("s")) {
    player.moveBackward();
    if (player.intersects(boundingBox2)) {
      player.moveForward();
    }
    client.sendMovement();
  }
  if (projectiles.length) {
    camera.updateMatrix();
    camera.updateMatrixWorld();
    var frustum = new THREE.Frustum();
    frustum.setFromProjectionMatrix(
      new THREE.Matrix4().multiplyMatrices(
        camera.projectionMatrix,
        camera.matrixWorldInverse,
      ),
    );
    const newProjectiles: Array<Object> = [];
    for (const p of projectiles) {
      const projectile = p[0];
      if (frustum.containsPoint(p[0].position)) {
        newProjectiles.push(p);
      } else {
        console.log("removing");
        scene.remove(projectile.mesh);
      }
    }
    projectiles = newProjectiles;
    for (const p of projectiles) {
      const projectile = p[0];
      const projectileBox = p[1];
      const direction = p[2];
      projectile.translateZ(direction * 0.03);
      projectileBox.setFromObject(projectile);
      if (projectileBox.intersectsBox(boundingBox2)) {
        p[2] *= -1;
        projectile.rotation.y *= -1;
      }
    }
    client.sendMovement();
  }
}
animate();
