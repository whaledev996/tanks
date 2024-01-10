import { Canvas, useLoader, useThree, useFrame } from "@react-three/fiber";
import { createRoot } from "react-dom/client";
import { TextureLoader } from "three/src/loaders/TextureLoader";
import { Mesh } from "three";
import React, { useEffect, useState, useRef } from "react";

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
      {gameId && clientId && <Game gameId={gameId} clientId={clientId} />}
    </div>
  );
}

interface GameProps {
  gameId: string;
  clientId: string;
}

function Game(props: GameProps) {
  const [otherTank, setOtherTank] = useState<number[]>([]);
  function processGameState(obj: any): any {
    console.log("processing game state");
    console.log(obj);
    for (const [key, value] of Object.entries(obj)) {
      if (key === props.clientId) {
        // reconcile this tanks position
      } else {
        // this is another tank
        setOtherTank(value as number[]);
      }
    }
  }
  const sendMessage = useSocket(processGameState);
  return (
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
        <Light />
        <Box />
        {otherTank && (
          <OtherTank position={otherTank as [number, number, number]} />
        )}
        <Tank
          clientId={props.clientId}
          gameId={props.gameId}
          send={sendMessage}
        />
      </Canvas>
    </div>
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

interface TankProps {
  send: (message: any, callback: any) => void;
  gameId: string;
  clientId: string;
}

function OtherTank(props: { position: [number, number, number] }) {
  const meshRef = useRef<Mesh>(null);

  return (
    <mesh ref={meshRef} position={props.position}>
      <boxGeometry args={[1, 1, 0.5]} />
      <meshBasicMaterial args={[{ color: "red" }]} />
    </mesh>
  );
}

function Tank(props: TankProps) {
  const movementSpeed = 0.05;
  const rotationSpeed = 0.03;
  const keysPressed = useMovement();
  const meshRef = useRef<Mesh>(null);

  useFrame((state, delta, xrFrame) => {
    // This function runs at the native refresh rate inside of a shared render-loop
    const mesh = meshRef.current;
    if (mesh) {
      let state: any = { clientId: props.clientId, gameId: props.gameId };
      if (keysPressed.has("w")) {
        state.action = "w";
        mesh.translateY(movementSpeed);
        props.send(JSON.stringify(state), undefined);
      }
      if (keysPressed.has("s")) {
        mesh.translateY(-1 * movementSpeed);
        state.action = "s";
        props.send(JSON.stringify(state), undefined);
        console.log(mesh.position);
      }
      if (keysPressed.has("a")) {
        mesh.rotateZ(rotationSpeed);
        state.action = "a";
        props.send(JSON.stringify(state), undefined);
      }
      if (keysPressed.has("d")) {
        state.action = "d";
        mesh.rotateZ(-1 * rotationSpeed);
        props.send(JSON.stringify(state), undefined);
      }
    }
  });
  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1, 0.5]} />
      <meshBasicMaterial args={[{ color: 0x4287f5 }]} />
    </mesh>
  );
}

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
