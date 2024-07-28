import { Canvas, useLoader, useThree, useFrame } from "@react-three/fiber";
import { createRoot } from "react-dom/client";
import { forwardRef } from "react";
import { TextureLoader } from "three/src/loaders/TextureLoader";
//import { GLTFLoader } from "three/src/loaders/GLTF
import { ColladaLoader } from "three/examples/jsm/loaders/ColladaLoader";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { GUI } from "dat.gui";
import THREE, {
  Box3,
  Box3Helper,
  BoxGeometry,
  CapsuleGeometry,
  DirectionalLight,
  Euler,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MirroredRepeatWrapping,
  Object3D,
  PlaneGeometry,
  Quaternion,
  Raycaster,
  SpotLight,
  Texture,
  Vector2,
  Vector3,
  Vector3Tuple,
  sRGBEncoding,
} from "three";
import React, { useEffect, useState, useRef } from "react";
import {
  Action,
  ClientAction,
  ClientActions,
  GameState,
  Projectile,
  TankState,
} from "./types";
import { map1 } from "./maps/map1";

// const backgroundBoxes = [
//   {position: [0, 12, 0],
//   geometry: [
//
//
//
// ]

function generateUniqueId() {
  const timestamp = Date.now().toString(36); // Convert timestamp to base36 string
  const randomString = Math.random().toString(36).substr(2, 5); // Generate random string
  return timestamp + randomString; // Concatenate timestamp and random string
}

function App() {
  const [gameId, setGameId] = useState("");
  const [clientId, setClientId] = useState("");
  return (
    <>
      <button
        onClick={async () => {
          try {
            const response = await fetch("http://localhost:5173/create", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
            });
            const result = await response.json();
            console.log("Success:", result);
            setGameId(result.gameId);
            setClientId(result.clientId);
          } catch (error) {
            console.error("Error:", error);
          }
        }}
      >
        create game
      </button>
      <div> {gameId}</div>
      <button
        onClick={async () => {
          try {
            let promptedGameId = prompt("Enter game id");
            const response = await fetch("http://localhost:5173/join", {
              method: "POST",
              body: JSON.stringify({ gameId: promptedGameId }),
              headers: {
                "Content-Type": "application/json",
              },
            });
            const result = await response.json();
            console.log("Success:", result);
            setGameId(result.gameId);
            setClientId(result.clientId);
          } catch (error) {
            console.error("Error:", error);
          }
        }}
      >
        {" "}
        join game{" "}
      </button>
      {gameId && clientId && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            margin: "auto",
            width: "100vw",
            height: "100vh",
            backgroundImage: `url(${"wood/wood.png"})`,
            backgroundRepeat: "repeat",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              margin: "auto",
              width: "100vw",
              height: "100vh",
            }}
            id="haritest"
          >
            <Canvas
              camera={{
                fov: 50,
                aspect: window.innerWidth / window.innerHeight,
                near: 0.1,
                far: 1000,
                position: [0, -5, 25],
              }}
            >
              <Game gameId={gameId} clientId={clientId} />
            </Canvas>
          </div>
        </div>
      )}
    </>
  );
}

interface GameProps {
  gameId: string;
  clientId: string;
}

function Game(props: GameProps) {
  const modelRef = useRef();
  const baseRef = useRef();
  const turretRef = useRef();
  const something = new Vector3();
  const fakeRef = useRef();
  // Load Collada model
  useEffect(() => {
    const loader = new GLTFLoader();
    loader.load("Tanks/tank6.glb", (collada) => {
      console.log(collada);
      modelRef.current = collada.scene;
      const polygon = collada.scene.children[0].children[0];
      console.log(modelRef.current);
      modelRef.current.scale.set(5, 5, 5);
      // const bufferGeo = collada
      // modelRef.current.rotation.reorder("XYZ");
      // modelRef.current.rotation.set(0, Math.PI, 0);
      //modelRef.current.up.set(0, 1, 0);
      // baseRef.current =
      //   modelRef.current.children[0].children[0].skeleton.bones[0];
      // baseRef.current.rotation.set(Math.PI / 2, 0, 0);
      // turretRef.current =
      //   modelRef.current.children[0].children[0].skeleton.bones[1];
      baseRef.current = polygon.skeleton.bones[0];
      turretRef.current = polygon.skeleton.bones[1];
      console.log(turretRef.current);
      // turretRef.current.up.set(0, 0, 1);
      //baseRef.current.rotation.set(0, 0, Math.PI / 2);
      // baseRef.current.applyMatrix4(new Matrix4().makeRotationZ(Math.PI / 2));
      // baseRef.current.rotation.reorder("YXZ");
      let measure = new Box3().setFromObject(modelRef.current);
      measure.getSize(something);
      console.log(something);
      console.log(baseRef.current);
      //baseRef.current.applyMatrix4(new Matrix4().makeRotationX(Math.PI));
      //baseRef.current.applyMatrix4(new Matrix4().makeRotationY(Math.PI));
      console.log(turretRef.current);
      //modelRef.current.position.set(0, 0, 2);
      // fakeRef.current = modelRef.current.clone();
      let geo = new BoxGeometry(1.005, 1.005, 0.57);
      //let mat = new MeshBasicMaterial({ color: 0x00ff00 });
      fakeRef.current = new Mesh(geo);
      //fakeRef.current.scale.set(0.1, 0.1, 0.1);
      console.log(fakeRef.current);
      // Calculate the bounding box of the model (but no a single Mesh) so that the whole model is centered
      let box3 = new Box3();
      box3.expandByObject(modelRef.current);
      console.log(box3);

      // Assign the center point of the bounding box to the vector
      let center = new Vector3();
      box3.getCenter(center);
      console.log(center);

      // Reposition the model so that it is centered.
      // modelRef.current.position.x = modelRef.current.position.x - center.x;
      // modelRef.current.position.y = modelRef.current.position.y - center.y;
      // modelRef.current.position.z = modelRef.current.position.z - center.z;
      // Access vertex groups
      //modelRef.current.traverse((child) => {
      //  if (child instanceof Mesh) {
      //    // Assuming the vertex groups are stored in userData
      //    const vertexGroups = child.userData.vertexGroups;
      //    if (vertexGroups) {
      //      console.log("Vertex groups:", vertexGroups);
      //    }
      //  }
      //});
    });
  }, []);

  const [otherTank, setOtherTank] = useState<TankState>({
    position: [0, 0, 0],
    rotation: 0,
    sequence: 0,
  });
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const movementSpeed = 3;
  const rotationSpeed = 2;
  const woodMap = useLoader(TextureLoader, "wood/wood.png");

  const meshRef = useRef<Mesh>(null);
  const boxRef = useRef<Mesh>(null);

  // a list of unacknowledged actions?
  const clientActions = useRef<ClientAction[]>([]);
  const serverState = useRef<TankState>({
    position: [0, 0, 0],
    sequence: 0,
    rotation: 0,
  });

  const state = useThree();

  const sequence = useRef<number>(0);
  const vec = useRef<Vector3>(new Vector3(0, 0, 0));
  const pos = useRef<Vector3>(new Vector3(0, 0, 0));
  const keysPressed = useMovement();

  const test1 = useRef<Box3>(new Box3());
  const test2 = useRef<Box3>(new Box3());
  const test3 = useRef<Mesh | null>(null);

  function handleMouseMove(e: MouseEvent) {
    vec.current.set(state.pointer.x, state.pointer.y, 0.5);
    vec.current.unproject(state.camera);
    vec.current.sub(state.camera.position).normalize();
    var distance = -state.camera.position.z / vec.current.z;
    pos.current
      .copy(state.camera.position)
      .add(vec.current.multiplyScalar(distance));
    const other = new Vector3();
    const another = new Vector3();
    // const q = new Quaternion();
    modelRef.current.getWorldDirection(other);
    //console.log("CURRENT POS");
    //console.log(pos.current);
    turretRef.current.getWorldDirection(another);
    // test.normalize();
    // console.log("turret current world rotation");
    // console.log(another);
    // console.log("model current y rotation");
    //console.log(modelRef.current.rotation);
    // console.log(other);

    //console.log("turret updated y rotation");
    //turretRef.current.setRotationFromAxisAngle(
    //  new Vector3(0, 1, 0),
    //  modelRef.current.rotation.y
    //);
    //console.log(turretRef.current.rotation.y);

    if (turretRef.current) {
      // temporary hack to prevent cannon from flipping over
      const old = turretRef.current.rotation.z;
      const old2 = turretRef.current.rotation.x;
      const newPos = pos.current.clone();
      const worldPos = new Vector3();
      modelRef.current.getWorldPosition(worldPos);
      // console.log(worldPos);
      newPos.x = newPos.x + -1 * worldPos.x;
      newPos.y = newPos.y + -1 * worldPos.y;
      another.normalize();
      newPos.normalize();
      // // pos.current.normalize();
      const newR = Math.acos(newPos.dot(another));
      // console.log("current angle between mouse and turret arm");
      // console.log(newR);

      const crossVector = new Vector3();
      crossVector.crossVectors(
        new Vector3(another.x, another.y, 0),
        new Vector3(newPos.x, newPos.y, 0)
      );
      if (!isNaN(newR)) {
        if (crossVector.z >= 0) {
          // console.log("left");
          turretRef.current.rotateY(newR);
        } else {
          // console.log("right");
          turretRef.current.rotateY(-1 * newR);
        }
      }

      // const angle = Math.atan(pos.current.x, pos.current.y);
      // const qx = 0;
      // const qy = Math.sin(angle / 2);
      // const qz = 0;
      // const w = Math.cos(angle / 2);
      //const q = new Quaternion();
      // turretRef.current.setRotationFromQuaternion(q);
      // q.setFromEuler(new Euler(0, newR + Math.PI / 2, 0));
      // if (pos.current.y >= 0) {
      //q.setFromAxisAngle(new Vector3(0, 1, 0), newR);
      // turretRef.current.quaternion.premultiply(q);
      //}
      // console.log(newR);
      //console.log(turretRef.current.rotation.y);
      //turretRef.current.rotation.y = newR;
      //turretRef.current.rotation.y = 2 * Math.PI;
      // if (pos.x < 0) {
      //   turretRef.current.rotation.y = newR - Math.PI / 2;
      // } else {
      //   turretRef.current.rotation.y = newR;
      // }
      // turretRef.current.lookAt(pos.current.x, pos.current.y, 0);
      // turretRef.current.rotation.z = old;
      //turretRef.current.rotation.x = old2;
      // turretRef.current.matrixWorld.elements[8] = newPos.x;
      // turretRef.current.matrixWorld.elements[9] = newPos.y;
      // turretRef.current.updateWorldMatrix();
      //turretRef.current.rotation.set(old2, turretRef.current.rotation.y, 0);
    }
  }

  function handleMouseDown(e: MouseEvent) {
    vec.current.set(state.pointer.x, state.pointer.y, 0.5);
    vec.current.unproject(state.camera);
    vec.current.sub(state.camera.position).normalize();
    var distance = -state.camera.position.z / vec.current.z;
    pos.current
      .copy(state.camera.position)
      .add(vec.current.multiplyScalar(distance));
    const mesh = meshRef.current;
    const test = new Vector3();
    turretRef.current.getWorldPosition(test);
    setProjectiles([
      ...projectiles,
      {
        target: [pos.current.x, pos.current.y, pos.current.z],
        position: [
          test.x || 0,
          test.y || 0,
          // test.z || 0,
          0,
        ],
        id: generateUniqueId(),
        direction: 1,
      },
    ]);
  }

  function handleWindowResize() {
    //var tanFOV = Math.tan(((Math.PI / 180) * state.camera.fov) / 2);
    //var windowHeight = window.innerHeight;
    //state.camera.aspect = window.innerWidth / window.innerHeight;
    //state.camera.fov =
    //(360 / Math.PI) * Math.atan(tanFOV * (window.innerHeight / windowHeight));
    //state.camera.updateProjectionMatrix();
    //state.gl.setSize(window.innerWidth, window.innerHeight);
    // let newWidth = window.innerWidth;
    // let newHeight = window.innerHeight;
    // if (window.innerWidth > window.innerHeight) {
    //   newWidth = (window.innerHeight * 16) / 9;
    // }
    // console.log(newWidth);

    //     if (window.innerHeight > window.innerWidth) {
    //       newHeight = ()
    //
    //     }
    //
    const canvas = document.getElementById("haritest");
    let newWidth = window.innerWidth;
    let newHeight = window.innerHeight;

    if (newWidth / newHeight > 1.777) {
      // need to lower width
      newWidth = (16 * newHeight) / 9;
    }

    if (newWidth / newHeight < 1.777) {
      // need to lower height
      newHeight = (9 * newWidth) / 16;
    }

    canvas.style.width = `${newWidth}px`;
    canvas.style.height = `${newHeight}px`;
    state.camera.aspect = newWidth / newHeight;
    // Adjust either FOV or zoom based on your chosen method
    //const initialFOV = state.camera.fov;
    //state.camera.fov = 50 / state.camera.aspect;
    state.gl.setSize(newWidth, newHeight);
    state.camera.updateProjectionMatrix();
    // console.log(state.camera.fov);
    //state.camera.updateProjectionMatrix();
  }

  useEffect(() => {
    state.camera.lookAt(0, 0, 0);
    //state.scene.background = woodMap;
    if (boxRef.current) {
      test2.current.setFromObject(boxRef.current);
      test3.current = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
      // test3.current = modelRef.current.clone();
      test3.current.rotateZ(Math.PI);
    }
  }, []);

  useEffect(() => {
    const gui = new GUI();
    if (state.camera) {
      //gui.addColor(ref.current, "color");
      gui.add(state.camera.position, "x", -100, 100).name("X Position");
      gui.add(state.camera.position, "y", -100, 100).name("Y Position");
      gui.add(state.camera.position, "z", -100, 100).name("Z Position");
      const zoomControl = gui.add(state.camera, "zoom", -100, 100).name("zoom");
      const fovControl = gui.add(state.camera, "fov", -100, 100).name("fov");
      fovControl.onChange(() => {
        state.camera.updateProjectionMatrix();
      });
      zoomControl.onChange(() => {
        state.camera.updateProjectionMatrix();
      });
    }
    return () => {
      gui.destroy();
    };
  }, []);

  useEffect(() => {
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", handleWindowResize);

    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [projectiles]);

  // initialize sequence number
  // if (actions.current === null) {
  // actions.current = { actions: [], sequence: 0 };
  // actions.current = [];
  //}
  function processGameState(gameState: GameState): any {
    // console.log("processing game state");
    for (const [clientId, tankState] of Object.entries(gameState)) {
      if (clientId === props.clientId) {
        serverState.current = tankState;
        // this current client
        // reconcile this tanks position
        // compute theoretical state of this tank
        // get position from tank state
        // get sequence from tank state
        // purge client actions array
        //const dummyObj = new Object3D();
        //const serverPosition = tankState.position;
        // dummyObj.position.x = tankState.position.x;
        //dummyObj.position.set(
        //  serverPosition[0],
        //  serverPosition[1],
        //  serverPosition[2]
        //);
        //const serverSequence = tankState.sequence;
        //console.log(tankState);
        //console.log(actions.current);
        //actions.current = actions.current.filter(
        //  (clientAction) => clientAction.sequence > serverSequence
        //);
        //actions.current.forEach((clientAction) => {
        //  if (clientAction.action.includes("w")) {
        //    dummyObj.translateY(movementSpeed);
        //  }
        //  if (clientAction.action.includes("s")) {
        //    dummyObj.translateY(-1 * movementSpeed);
        //  }
        //  if (clientAction.action === "a") {
        //    dummyObj.rotateZ(rotationSpeed);
        //  }
        //  if (clientAction.action === "d") {
        //    dummyObj.rotateZ(-1 * rotationSpeed);
        //  }
        //  // literally update position to theoretical position
        //  // meshRef.position.set
        //  // meshRef.current.position.
        //  //if (meshRef.current) {
        //  //  meshRef.current.position.set(
        //  //    dummyObj.position.x,
        //  //    dummyObj.position.y,
        //  //    dummyObj.position.z
        //  //  );
        //  //}
        //});
      } else {
        // this is another client
        setOtherTank(tankState);
      }
    }
  }
  const sendMessage = useSocket(processGameState);

  function sendToClient(action: string[]) {
    //const sequence = actions.current.length
    //  ? actions.current[actions.current.length - 1].sequence + 1
    //  : 1;
    sequence.current += 1;
    sendMessage(
      JSON.stringify({
        action: action,
        clientId: props.clientId,
        gameId: props.gameId,
        sequence: sequence.current,
      }),
      () => {
        //const sequence = actions.current[actions.current.length
        //actions.current.push({ action: action, sequence: sequence.current });
        if (action.length) {
          clientActions.current.push({ action: action, sequence: Date.now() });
        }
      }
    );
  }

  function serverReconcilation(delta) {
    if (serverState.current && clientActions.current.length) {
      // filter out all client actions that occurred before
      // clientActions.current = clientActions.current.filter(
      //   (clientAction) => clientAction.sequence > serverState.current?.sequence
      // );
      // play back all existing clientActions on the serverState to get the new state
      //console.log(`received ${serverState.current.position} as server object`);
      const dummyObj = new Object3D();
      dummyObj.position.x = serverState.current.position[0];
      dummyObj.position.y = serverState.current.position[1];
      dummyObj.position.z = serverState.current.position[2];
      dummyObj.rotation.z = serverState.current.rotation;
      const newClientActions: ClientAction[] = [];
      clientActions.current.forEach((clientAction) => {
        if (clientAction.sequence > serverState.current.sequence) {
          const inputs = clientAction.action;
          if (inputs.includes("w")) {
            dummyObj.translateY(movementSpeed * delta);
          }
          if (inputs.includes("s")) {
            dummyObj.translateY(-1 * movementSpeed * delta);
          }
          if (inputs.includes("a")) {
            dummyObj.rotateZ(rotationSpeed * delta);
          }
          if (inputs.includes("d")) {
            dummyObj.rotateZ(-1 * rotationSpeed * delta);
          }
          newClientActions.push(clientAction);
        }
      });
      if (meshRef.current) {
        console.log(
          `adjusting client position [${meshRef.current.position.x}, ${meshRef.current.position.y}, ${meshRef.current.position.z}] to [${dummyObj.position.x}, ${dummyObj.position.y}, ${dummyObj.position.z}]`
        );
        //meshRef.current.position.x = dummyObj.position.x;
        //meshRef.current.position.y = dummyObj.position.y;
        //meshRef.current.position.z = dummyObj.position.z;
        meshRef.current.position.set(
          dummyObj.position.x,
          dummyObj.position.y,
          dummyObj.position.z
        );
        meshRef.current.rotation.set(
          meshRef.current.rotation.x,
          meshRef.current.rotation.y,
          dummyObj.rotation.z
        );
      }
      clientActions.current = newClientActions;
    }
  }

  const checkIntersection = function (player: Object3D): boolean {
    console.log("running checkIntersection");
    //console.log(player);
    //console.log(player.boundingBox);
    //console.log(player.geometry);
    // player.scale.set(1, 1, 1);
    const pos = new Vector3();
    turretRef.current.getWorldPosition(pos);
    //console.log("turret Pos");
    //console.log(pos);

    const pos2 = new Vector3();
    baseRef.current.getWorldPosition(pos2);
    //console.log("base Pos");
    //console.log(pos2);
    test1.current.setFromObject(player);
    // test1.current.expandByScalar(10);
    const another = new Box3();
    const another2 = new Vector3();
    // meshRef.current.getSize(another);
    // another.setFromObject(meshRef.current);
    //another.getSize(another2);
    const hello = new Vector3();
    test1.current.getSize(hello);
    let box3 = new Box3();
    box3.expandByObject(modelRef.current);
    console.log(box3);
    // console.log(another);
    //console.log(hello);
    // const another = new Box3(
    //   new Vector3(
    //     test1.current.min.x,
    //     test1.current.min.z,
    //     test1.current.min.y
    //   ),
    //   new Vector3(test1.current.max.x, test1.current.max.z, test1.current.max.y)
    // );
    // test1.current.expandByScalar(0.1);
    // console.log(meshRef);
    // console.log(test1.current);
    // console.log(test2.current);
    return test1.current.intersectsBox(test2.current);
    //console.log(test1.current);
    //return mesh.some((o) => {
    //  //test2.current.setFromObject(o);
    //  test2.current = new Box3().setFromObject(o);
    //  console.log(test2.current);
    //  return (
    //    o !== player &&
    //    o.geometry.type === "BoxGeometry" &&
    //    test1.current.intersectsBox(test2.current)
    //  );
    //});
    //test1.current.setFromObject(player);
    //console.log(test1.current);
  };

  useFrame((state, delta, xrFrame) => {
    // This function runs at the native refresh rate inside of a shared render-loop
    //console.log(`delta: ${delta}`);
    // movement speed
    // const mesh = meshRef.current;
    const fake = fakeRef.current;
    if (modelRef.current && fake) {
      // const fake = modelRef.current.clone();
      //handle collisions
      //console.log(state.scene.children);
      //console.log(fake.position.y);
      //console.log(boxRef.current?.position.y);
      //console.log(baseRef.current.position);
      // console.log(fake.position);
      // console.log(modelRef.current.position);
      if (keysPressed.has("w")) {
        fake.translateY(movementSpeed * delta);
        // if we intersect
        const doesIntersect = checkIntersection(fake);
        console.log(doesIntersect);
        if (doesIntersect) {
          //console.log(intersects);
          //mesh.translateY(-1 * movementSpeed * delta);
          fake.position.set(
            modelRef.current.position.x,
            modelRef.current.position.y,
            modelRef.current.position.z
          );
        } else {
          modelRef.current.translateY(movementSpeed * delta);
          // mesh.translateY(movementSpeed * delta);
        }
        //const intersects = checkIntersection(
        //  mesh,
        //  state.scene.children.filter((c) => c.type === "Mesh") as Mesh[]
        //);
        //sendToClient("w");
      }
      if (keysPressed.has("s")) {
        fake.translateY(-1 * movementSpeed * delta);
        // if we intersect
        const doesIntersect = checkIntersection(fake);
        console.log(doesIntersect);
        if (doesIntersect) {
          fake.position.set(
            modelRef.current.position.x,
            modelRef.current.position.y,
            modelRef.current.position.z
          );
          //console.log(intersects);
          //mesh.translateY(-1 * movementSpeed * delta);
          // fake.position.set(mesh.position.x, mesh.position.y, mesh.position.z);
        } else {
          modelRef.current.translateY(-1 * movementSpeed * delta);
          // mesh.translateY(-1 * movementSpeed * delta);
        }
        // mesh.translateY(-1 * movementSpeed * delta);
        // const intersects = checkIntersection(
        //   mesh,
        //   state.scene.children.filter((c) => c.type === "Mesh") as Mesh[]
        // );
        // if (intersects) {
        //   mesh.translateY(movementSpeed * delta);
        //   modelRef.current.translateZ(movementSpeed * delta);
        // }
        //sendToClient("s");
      }
      if (keysPressed.has("a")) {
        fake.rotateZ(rotationSpeed * delta);
        // mesh.rotateZ(rotationSpeed * delta);
        //sendToClient("a");
        modelRef.current.rotateZ(rotationSpeed * delta);
        // turretRef.current.rotateY(rotationSpeed * delta);
        // turretRef.current.rotateX(rotationSpeed * delta);
      }
      if (keysPressed.has("d")) {
        fake.rotateZ(-1 * rotationSpeed * delta);
        // mesh.rotateZ(-1 * rotationSpeed * delta);
        //sendToClient("d");
        modelRef.current.rotateZ(-1 * rotationSpeed * delta);
        //turretRef.current.rotateY(-1 * rotationSpeed * delta);
      }
      if (keysPressed.has("v")) {
        let newMin = new Vector3();
        let newMax = new Vector3();
        let box3 = new Box3();
        box3.expandByObject(modelRef.current);
        console.log(box3);
        const center = new Vector3();
        box3.getCenter(center);
        console.log(center);
        newMax.x = box3.max.x;
        newMin.x = box3.min.x;
        newMax.y = center.y + (box3.max.z - center.z);
        newMin.y = center.y - (box3.max.z - center.z);
        newMax.z = center.z + (box3.max.y - center.y);
        newMin.z = center.z - (box3.max.y - center.y);
        const bbox = new Box3Helper(new Box3(newMin, newMax));
        state.scene.add(bbox);

        //turretRef.current.rotateX(0.02);
        // turretRef.current.rotateOnWorldAxis(new Vector3(0, 1, 0), Math.PI / 2);
        // turretRef.current.rotation.x += 0.02;
        // console.log(turretRef.current.rotation);
        // const q = new Quaternion(
        //   0,
        //   Math.sin(Math.PI / 4),
        //   0,
        //   Math.cos(Math.PI / 4)
        // );
        // turretRef.current.applyQuaternion(q);
        //baseRef.current.translateY(5);
        //modelRef.current.translateZ(0.1);
      }
      sendToClient(Array.from(keysPressed));
      //serverReconcilation(delta);
    }
  });

  const projectileList = projectiles.map((p) => {
    console.log(projectiles);
    return (
      <Projectile
        key={p.id}
        target={p.target}
        id={p.id}
        position={p.position}
        direction={p.direction}
      />
    );
  });

  return (
    <>
      <Light />
      {map1.boxes.map((box) => (
        <Box
          position={box.position}
          geometry={box.geometry}
          texture={"wood/wood4.jpg"}
        />
      ))}
      {otherTank.sequence !== 0 && (
        <OtherTank
          rotation={otherTank.rotation}
          position={otherTank.position}
        />
      )}
      {modelRef.current && <primitive object={modelRef.current} />}
      {projectileList}
      <mesh position={[0, 0, 0]} ref={meshRef}>
        <boxGeometry args={[1.005, 1.005, 0.57]} />
        <meshBasicMaterial args={[{ color: "red" }]} />
      </mesh>
      {/*<mesh ref={meshRef}>*/}
      {/*<boxGeometry args={[1, 1, 0.5]} />*/}
      {/*<meshBasicMaterial args={[{ color: 0x4287f5 }]} />*/}
      {/*</mesh>*/}
    </>
  );
}

const Background = () => {
  const ref = useRef<PlaneGeometry>(null);
  const texture = useLoader(TextureLoader, "wood/wood.png");
  texture.encoding = sRGBEncoding;
  texture.wrapS = MirroredRepeatWrapping;
  texture.wrapT = MirroredRepeatWrapping;
  texture.repeat.set(window.innerWidth / 15, window.innerHeight / 15);

  return (
    <mesh position={[0, 0, 0]}>
      <planeGeometry args={[window.innerWidth, window.innerHeight, 1]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  );
};

function Light() {
  const ref = useRef<DirectionalLight>(null);
  useEffect(() => {
    const gui = new GUI();
    if (ref.current) {
      gui.add(ref.current, "intensity", 0, 1000);
      //gui.addColor(ref.current, "color");
      gui.add(ref.current.position, "x", -100, 100).name("X Position");
      gui.add(ref.current.position, "y", -100, 100).name("Y Position");
      gui.add(ref.current.position, "z", -100, 100).name("Z Position");
    }
    return () => {
      gui.destroy();
    };
  }, []);
  return (
    <directionalLight ref={ref} position={[0, -3, 10]} args={[0xffffff, 2]} />
  );
}

//function Light() {
//  return <ambientLight args={[0x404040, 5]} />;
//}

//function Light() {
//  return (
//    <hemisphereLight position={[0, 0, 0]} args={[0xffffff, 0xffffff, 1]} />
//  );
//}

function Projectile(props: Projectile) {
  const meshRef = useRef<Mesh>(null);
  const capsuleRef = useRef<CapsuleGeometry>(null);

  useEffect(() => {
    if (capsuleRef.current) {
      console.log("running capsule apply matrix on init");
      capsuleRef.current.applyMatrix4(new Matrix4().makeRotationX(Math.PI / 2));
    }
    if (meshRef.current) {
      console.log("running projectile look at on init");
      meshRef.current.lookAt(props.target[0], props.target[1], props.target[2]);
      meshRef.current.translateZ(2);
    }
  }, []);

  useFrame((state, delta, xrFrame) => {
    if (meshRef.current) {
      meshRef.current.translateZ(2 * delta * props.direction);
    }
  });

  return (
    <mesh
      position={[props.position[0], props.position[1], props.position[2]]}
      ref={meshRef}
    >
      <capsuleGeometry ref={capsuleRef} args={[0.2, 0.3, 4, 8]} />
    </mesh>
  );
}

//interface TankProps {
//  send: (action: Action) => void;
//  gameId: string;
//  clientId: string;
//}

function OtherTank(props: { position: Vector3Tuple; rotation: number }) {
  const meshRef = useRef<Mesh>(null);

  // given current ps and future pos, how do we get movement?
  //
  // meshRef.current.trans
  //
  //  useFrame((state, delta, xrFrame) => {
  useFrame((state, delta, xrFrame) => {
    if (meshRef.current) {
      meshRef.current.position.lerp(
        new Vector3(props.position[0], props.position[1], props.position[2]),
        0.05
      );
      const newRotation =
        meshRef.current.rotation.z +
        (props.rotation - meshRef.current.rotation.z) * 0.05;

      meshRef.current.rotation.set(
        meshRef.current.rotation.x,
        meshRef.current.rotation.y,
        newRotation
      );
    }
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1, 0.5]} />
      <meshBasicMaterial args={[{ color: "red" }]} />
    </mesh>
  );
}

const Box = forwardRef<Mesh>(function (props, ref) {
  //const woodMap = useLoader(TextureLoader, "wood/wood4.jpg");
  const woodMap = useLoader(TextureLoader, props.texture);
  //woodMap.wrapS = MirroredRepeatWrapping;
  //woodMap.wrapT = MirroredRepeatWrapping;
  //woodMap.repeat.set(4, 1);
  return (
    <mesh ref={ref} position={props.position}>
      <boxGeometry args={props.geometry} />
      <meshStandardMaterial map={woodMap} />
    </mesh>
  );
});

//const Tank = forwardRef<Mesh, TankProps>(function (props, ref) {
//  const movementSpeed = 0.05;
//  const rotationSpeed = 0.03;
//  const keysPressed = useMovement();
//  // const meshRef = useRef<Mesh>(null);
//
//  useFrame((state, delta, xrFrame) => {
//    // This function runs at the native refresh rate inside of a shared render-loop
//    if (ref) {
//      const mesh = ref.current;
//      if (mesh) {
//        if (keysPressed.has("w")) {
//          mesh.translateY(movementSpeed);
//          props.send("w");
//        }
//        if (keysPressed.has("s")) {
//          mesh.translateY(-1 * movementSpeed);
//          props.send("s");
//        }
//        if (keysPressed.has("a")) {
//          mesh.rotateZ(rotationSpeed);
//          props.send("a");
//        }
//        if (keysPressed.has("d")) {
//          mesh.rotateZ(-1 * rotationSpeed);
//          props.send("d");
//        }
//      }
//    }
//  });
//  return (
//    <mesh ref={ref}>
//      <boxGeometry args={[1, 1, 0.5]} />
//      <meshBasicMaterial args={[{ color: 0x4287f5 }]} />
//    </mesh>
//  );
//});

function useSocket(callback: (obj: any) => void) {
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    ws.current = new WebSocket("ws://localhost:8080");
    ws.current.addEventListener("message", (event) => {
      const obj = JSON.parse(event.data);
      callback(obj);
    });
    return () => ws.current?.close();
  }, []);

  function send(message, callback) {
    waitForConnection(() => {
      ws.current?.send(message);
      if (typeof callback !== "undefined") {
        callback();
      }
    }, 1000);
  }

  function waitForConnection(callback, interval) {
    if (ws.current?.readyState === 1) {
      callback();
    } else {
      // optional: implement backoff for interval here
      setTimeout(function () {
        waitForConnection(callback, interval);
      }, interval);
    }
  }

  return send;
}

function useMovement(): Set<string> {
  const [keysPressed, setKeysPressed] = useState(new Set<string>());
  const allowedKeys = new Set(["w", "a", "s", "d", "v"]);

  function handleKeyUp(e: KeyboardEvent) {
    const key = e.key;
    if (allowedKeys.has(key)) {
      setKeysPressed((keys) => {
        keys.delete(key);
        return new Set(keys);
      });
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    const key = e.key;
    if (allowedKeys.has(key)) {
      setKeysPressed((keys) => {
        keys.add(key);
        return new Set(keys);
      });
    }
  }

  useEffect(() => {
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return keysPressed;
}

createRoot(document.getElementById("root")).render(<App />);
