import { Canvas, useLoader, useThree, useFrame } from "@react-three/fiber";
import { createRoot } from "react-dom/client";
import { TextureLoader } from "three/src/loaders/TextureLoader";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DirectionalLight, Mesh, Object3D, Vector3, Vector3Tuple } from "three";
import React, { useEffect, useState, useRef } from "react";
import { ClientAction, GameState, KeyInput, TankState } from "./types";
import { map1, TanksMapObject } from "./map";
import { Game as TankGame } from "./game";

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
                position: [0, 0, 25],
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
  const turretRef = useRef();
  const fakeRef = useRef();
  const game = useRef<TankGame>();

  // Initialize everything:
  // Game obj, current map
  // Load Collada model
  useEffect(() => {
    const loader = new GLTFLoader();
    loader.load("Tanks/tank6.glb", (collada) => {
      const scene = collada.scene;
      scene.scale.set(5, 5, 5);
      scene.position.set(...map1.startingPosition);
      game.current = new TankGame(map1, scene);
    });
  }, []);

  const [otherTank, setOtherTank] = useState<TankState>({
    position: [0, 0, 0],
    rotation: 0,
    sequence: 0,
  });
  const [numProjectiles, setNumProjectiles] = useState(0);

  // a list of unacknowledged actions?
  const clientActions = useRef<ClientAction[]>([]);
  const serverState = useRef<TankState>({
    position: [0, 0, 0],
    sequence: 0,
    rotation: 0,
  });

  const state = useThree();

  const sequence = useRef<number>(0);
  const _v0 = useRef<Vector3>(new Vector3());
  const mousePos = useRef<Vector3>(new Vector3());
  const keysPressed = useMovement();

  function calculateMousePosition() {
    // convert mouse click coordinates into game coordinates
    _v0.current.set(state.pointer.x, state.pointer.y, 0);
    _v0.current.unproject(state.camera);
    _v0.current.sub(state.camera.position).normalize();
    var distance = -state.camera.position.z / _v0.current.z;
    mousePos.current
      .copy(state.camera.position)
      .add(_v0.current.multiplyScalar(distance));
  }

  function handleMouseMove(e: MouseEvent) {
    calculateMousePosition();
    if (game.current) {
      // TODO: make passing 0 less ugly here
      game.current.handleInput(
        { eventType: "mousemove", position: mousePos.current.toArray() },
        0
      );
    }
  }

  function handleMouseDown(e: MouseEvent) {
    if (game.current) {
      // TODO: make passing 0 less ugly here
      game.current.handleInput(
        { eventType: "mousedown", position: mousePos.current.toArray() },
        0
      );
    }
  }

  function handleWindowResize() {
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

    // TODO: refactor this
    canvas.style.width = `${newWidth}px`;
    canvas.style.height = `${newHeight}px`;
    state.camera.aspect = newWidth / newHeight;
    state.gl.setSize(newWidth, newHeight);
    state.camera.updateProjectionMatrix();
  }

  useEffect(() => {
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", handleWindowResize);

    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleWindowResize);
    };
  }, []);

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
    if (game.current) {
      if (game.current.playerTank.projectiles.length != numProjectiles) {
        setNumProjectiles(game.current.playerTank.projectiles.length);
      }
      game.current.step(keysPressed, delta);
      //sendToClient(Array.from(keysPressed));
      //serverReconcilation(delta);
    }
  });

  const projectileList = game.current?.playerTank.projectiles.map((p) => {
    return <primitive key={p.projectile.uuid} object={p.projectile} />;
  });

  return (
    <>
      <Light />
      {map1.objects.map((box) => (
        <Box
          position={box.position}
          geometry={box.geometry}
          texture={box.texture}
        />
      ))}
      {otherTank.sequence !== 0 && (
        <OtherTank
          rotation={otherTank.rotation}
          position={otherTank.position}
        />
      )}
      {game.current && <primitive object={game.current.playerTank.tank} />}
      {projectileList}
    </>
  );
}

function Light() {
  const ref = useRef<DirectionalLight>(null);
  return (
    <directionalLight ref={ref} position={[0, -3, 10]} args={[0xffffff, 2]} />
  );
}

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

const Box = function (props: TanksMapObject) {
  const woodMap = useLoader(TextureLoader, props.texture);
  return (
    <mesh position={props.position}>
      <boxGeometry args={props.geometry} />
      <meshStandardMaterial map={woodMap} />
    </mesh>
  );
};

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

function useMovement(): KeyInput[] {
  //TODO: do we need state here?
  const [keysPressed, setKeysPressed] = useState(new Set<KeyInput>());
  const allowedKeys = new Set(["w", "a", "s", "d"]);

  function handleKeyUp(e: KeyboardEvent) {
    const key = e.key;
    if (allowedKeys.has(key)) {
      setKeysPressed((keys) => {
        keys.delete(key as KeyInput);
        return new Set(keys);
      });
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    const key = e.key;
    if (allowedKeys.has(key)) {
      setKeysPressed((keys) => {
        keys.add(key as KeyInput);
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

  return Array.from(keysPressed);
}

createRoot(document.getElementById("root")).render(<App />);
