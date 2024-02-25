import { Canvas, useLoader, useThree, useFrame } from "@react-three/fiber";
import { createRoot } from "react-dom/client";
import { forwardRef } from "react";
import { TextureLoader } from "three/src/loaders/TextureLoader";
import { Mesh, Object3D, Vector3Tuple } from "three";
import React, { useEffect, useState, useRef } from "react";
import {
  Action,
  ClientAction,
  ClientActions,
  GameState,
  TankState,
} from "./types";

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
  const movementSpeed = 0.05;
  const rotationSpeed = 0.03;

  const meshRef = useRef<Mesh>(null);

  // a list of unacknowledged actions?
  const actions = useRef<ClientAction[]>([]);
  const sequence = useRef<number>(0);
  const keysPressed = useMovement();

  // initialize sequence number
  // if (actions.current === null) {
  // actions.current = { actions: [], sequence: 0 };
  // actions.current = [];
  //}
  function processGameState(gameState: GameState): any {
    // console.log("processing game state");
    for (const [clientId, tankState] of Object.entries(gameState)) {
      if (clientId === props.clientId) {
        // this current client
        // reconcile this tanks position
        // compute theoretical state of this tank
        // get position from tank state
        // get sequence from tank state
        // purge client actions array
        const dummyObj = new Object3D();
        const serverPosition = tankState.position;
        // dummyObj.position.x = tankState.position.x;
        dummyObj.position.set(
          serverPosition[0],
          serverPosition[1],
          serverPosition[2]
        );
        const serverSequence = tankState.sequence;
        console.log(tankState);
        console.log(actions.current);
        actions.current = actions.current.filter(
          (clientAction) => clientAction.sequence > serverSequence
        );
        actions.current.forEach((clientAction) => {
          if (clientAction.action === "w") {
            dummyObj.translateY(movementSpeed);
          }
          if (clientAction.action === "s") {
            dummyObj.translateY(-1 * movementSpeed);
          }
          if (clientAction.action === "a") {
            dummyObj.rotateZ(rotationSpeed);
          }
          if (clientAction.action === "d") {
            dummyObj.rotateZ(-1 * rotationSpeed);
          }
          // literally update position to theoretical position
          // meshRef.position.set
          // meshRef.current.position.
          if (meshRef.current) {
            meshRef.current.position.set(
              dummyObj.position.x,
              dummyObj.position.y,
              dummyObj.position.z
            );
          }
        });
      } else {
        // this is another client
        setOtherTank(tankState);
      }
    }
  }
  const sendMessage = useSocket(processGameState);

  function sendToClient(action: Action) {
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
        actions.current.push({ action: action, sequence: sequence.current });
      }
    );
  }

  useFrame((state, delta, xrFrame) => {
    // This function runs at the native refresh rate inside of a shared render-loop
    const mesh = meshRef.current;
    if (mesh) {
      if (keysPressed.has("w")) {
        mesh.translateY(movementSpeed);
        sendToClient("w");
      }
      if (keysPressed.has("s")) {
        mesh.translateY(-1 * movementSpeed);
        sendToClient("s");
      }
      if (keysPressed.has("a")) {
        mesh.rotateZ(rotationSpeed);
        sendToClient("a");
      }
      if (keysPressed.has("d")) {
        mesh.rotateZ(-1 * rotationSpeed);
        sendToClient("d");
      }
    }
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

//interface TankProps {
//  send: (action: Action) => void;
//  gameId: string;
//  clientId: string;
//}

function OtherTank(props: { position: Vector3Tuple; rotation: number }) {
  const meshRef = useRef<Mesh>(null);

  return (
    <mesh
      ref={meshRef}
      position={props.position}
      rotation={[
        meshRef.current?.rotation.x || 0,
        meshRef.current?.rotation.y || 0,
        props.rotation,
      ]}
    >
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

function useMovement() {
  const [keysPressed, setKeysPressed] = useState(new Set());
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
    console.log("handling");
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
