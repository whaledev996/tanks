import { Canvas, useLoader, useThree, useFrame } from "@react-three/fiber";
import { createRoot } from "react-dom/client";
import { forwardRef } from "react";
import { TextureLoader } from "three/src/loaders/TextureLoader";
import {
  Box3,
  CapsuleGeometry,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Vector3,
  Vector3Tuple,
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

function generateUniqueId() {
  const timestamp = Date.now().toString(36); // Convert timestamp to base36 string
  const randomString = Math.random().toString(36).substr(2, 5); // Generate random string
  return timestamp + randomString; // Concatenate timestamp and random string
}

function App() {
  const [gameId, setGameId] = useState("");
  const [clientId, setClientId] = useState("");
  return (
    <div>
      <button
        onClick={async () => {
          try {
            const response = await fetch("http://127.0.0.1:5173/create", {
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
            const response = await fetch("http://127.0.0.1:5173/join", {
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
        <div style={{ width: window.innerWidth, height: window.innerHeight }}>
          <Canvas
            camera={{
              fov: 50,
              aspect: window.innerWidth / window.innerHeight,
              near: 0.1,
              far: 1000,
              position: [0, -10, 25],
            }}
          >
            <Game gameId={gameId} clientId={clientId} />
          </Canvas>
        </div>
      )}
    </div>
  );
}

interface GameProps {
  gameId: string;
  clientId: string;
}

function Game(props: GameProps) {
  const [otherTank, setOtherTank] = useState<TankState>({
    position: [0, 0, 0],
    rotation: 0,
    sequence: 0,
  });
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const movementSpeed = 2;
  const rotationSpeed = 2;

  const meshRef = useRef<Mesh>(null);

  // a list of unacknowledged actions?
  const clientActions = useRef<ClientAction[]>([]);
  const serverState = useRef<TankState>({
    position: [0, 0, 0],
    sequence: 0,
    rotation: 0,
  });

  const state = useThree();

  const sequence = useRef<number>(0);
  //const vec = useRef<Vector3>(new Vector3(0, 0, 0));
  //const pos = useRef<Vector3>(new Vector3(0, 0, 0));
  const keysPressed = useMovement();

  function handleMouseDown(e: MouseEvent) {
    console.log(state.pointer);
    var vec = new Vector3(); // create once and reuse
    var pos = new Vector3(); // create once and reuse
    const projectileGeometry = new CapsuleGeometry(0.2, 0.3, 4, 8);
    projectileGeometry.applyMatrix4(new Matrix4().makeRotationX(Math.PI / 2));
    const projectileMaterial = new MeshBasicMaterial({ color: 0xffffff });
    const projectile = new Mesh(projectileGeometry, projectileMaterial);
    //const projectileBox = new Box3().setFromObject(projectile);
    vec.set(state.pointer.x, state.pointer.y, 0.5);
    console.log(vec);
    vec.unproject(state.camera);
    vec.sub(state.camera.position).normalize();
    var distance = -state.camera.position.z / vec.z;
    pos.copy(state.camera.position).add(vec.multiplyScalar(distance));
    //console.log(`CAMERA`);
    //console.log(state.camera.position);
    //console.log(`VECTOR`);
    //console.log(vec);
    //console.log(`DISTANCE`);
    //console.log(distance);
    //console.log(`POS`);
    //console.log(pos);
    const mesh = meshRef.current;
    projectile.position.x = mesh?.position.x || 0;
    projectile.position.y = mesh?.position.y || 0;
    projectile.position.z = mesh?.position.z || 0;
    projectile.lookAt(pos);
    console.log("ADDING OBJ");
    //state.scene.add(projectile);
    //console.log(projectiles);
    setProjectiles([
      ...projectiles,
      {
        target: [pos.x, pos.y, pos.z],
        position: [
          mesh?.position.x || 0,
          mesh?.position.y || 0,
          mesh?.position.z || 0,
        ],
        id: generateUniqueId(),
      },
    ]);
  }

  useEffect(() => {
    state.camera.lookAt(0, 0, 0);
  });

  useEffect(() => {
    window.addEventListener("mousedown", handleMouseDown);

    return () => {
      console.log("removing something");
      window.removeEventListener("mousedown", handleMouseDown);
    };
  }, [state.scene, projectiles]);

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

  useFrame((state, delta, xrFrame) => {
    // This function runs at the native refresh rate inside of a shared render-loop
    //console.log(`delta: ${delta}`);
    // movement speed
    const mesh = meshRef.current;
    if (mesh) {
      if (keysPressed.has("w")) {
        mesh.translateY(movementSpeed * delta);
        //sendToClient("w");
      }
      if (keysPressed.has("s")) {
        mesh.translateY(-1 * movementSpeed * delta);
        //sendToClient("s");
      }
      if (keysPressed.has("a")) {
        mesh.rotateZ(rotationSpeed * delta);
        //sendToClient("a");
      }
      if (keysPressed.has("d")) {
        mesh.rotateZ(-1 * rotationSpeed * delta);
        //sendToClient("d");
      }
      sendToClient(Array.from(keysPressed));
      serverReconcilation(delta);
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
      />
    );
  });

  return (
    <>
      <Light />
      <Box />
      {otherTank && (
        <OtherTank
          rotation={otherTank.rotation}
          position={otherTank.position}
        />
      )}
      {projectileList}
      <mesh ref={meshRef}>
        <boxGeometry args={[1, 1, 0.5]} />
        <meshBasicMaterial args={[{ color: 0x4287f5 }]} />
      </mesh>
    </>
  );
}

function Light() {
  return (
    <hemisphereLight position={[0, 0, 0]} args={[0xffffff, 0xffffff, 1]} />
  );
}

function Box() {
  const woodMap = useLoader(
    TextureLoader,
    "compressed-but-large-wood-texture.jpg"
  );
  return (
    <mesh position={[0, 8, 2]}>
      <boxGeometry args={[20, 2, 4]} />
      <meshStandardMaterial map={woodMap} />
    </mesh>
  );
}

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
    }
  }, []);

  useFrame((state, delta, xrFrame) => {
    if (meshRef.current) {
      meshRef.current.translateZ(2 * delta);
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
  const allowedKeys = new Set(["w", "a", "s", "d"]);

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
