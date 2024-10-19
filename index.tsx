import { Canvas, useLoader, useThree, useFrame } from "@react-three/fiber";
import { createRoot } from "react-dom/client";
import { TextureLoader } from "three/src/loaders/TextureLoader";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import {
  DirectionalLight,
  Group,
  Mesh,
  Object3D,
  Vector3,
  Vector3Tuple,
} from "three";
import React, { useEffect, useState, useRef } from "react";
import {
  ClientAction,
  ClientPayload,
  GameState,
  KeyInput,
  TankMouseEvent,
} from "./types";
import { map1, TanksMapObject } from "./map";
import { Game as TankGame } from "./game";
import { TANK_MOVEMENT_SPEED, TANK_ROTATION_SPEED } from "./playerTank";

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
  const game = useRef<TankGame>();
  const partnerTankModel = useRef<Group | null>(null);

  // Initialize everything:
  // Game obj, current map
  // Load Collada model
  useEffect(() => {
    const loader = new GLTFLoader();
    loader.load("Tanks/player_tank_blue.glb", (collada) => {
      const scene = collada.scene;
      scene.scale.set(5, 5, 5);
      scene.position.set(...map1.startingPosition);
      // console.log(scene);
      game.current = new TankGame(scene, map1, props.gameId, props.clientId);

      // TODO: hack to get screen to update immediately when projectiles explode
      game.current.playerTank.dispose = () => {
        setNumProjectiles((numProjectiles) => (numProjectiles -= 1));
      };
    });
    loader.load("Tanks/player_tank_red.glb", (collada) => {
      const scene = collada.scene;
      scene.scale.set(5, 5, 5);
      partnerTankModel.current = scene;
    });
  }, []);

  // TODO: create a proper type for this
  const [otherTank, setOtherTank] = useState<any>({
    position: null,
    rotation: null,
    cannonDirection: null,
    timestamp: 0,
  });

  const [numProjectiles, setNumProjectiles] = useState(0);

  // TODO: another hack I need to change
  const [numPartnerTanks, setNumPartnerTanks] = useState(0);

  const secondsPerFrame = useRef(0);

  // a list of unacknowledged actions?
  const clientActions = useRef<ClientAction[]>([]);

  const state = useThree();

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
      const event: TankMouseEvent = {
        position: mousePos.current.toArray(),
        eventType: "mousemove",
      };
      // TODO: make passing 0 less ugly here
      game.current.handleInput(event, 0);
      sendToServer(event);
    }
  }

  function handleMouseDown(e: MouseEvent) {
    if (game.current) {
      const event: TankMouseEvent = {
        position: mousePos.current.toArray(),
        eventType: "mousedown",
      };
      // TODO: make passing 0 less ugly here
      game.current.handleInput(event, 0);
      sendToServer(event);
      setNumProjectiles((projectileCount) => (projectileCount += 1));
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
    // console.log(gameState);
    for (const [clientId, tankState] of Object.entries(gameState)) {
      // if we are processing this tank
      if (clientId === props.clientId) {
        // console.log("RUNNING");
        // console.log(gameState);
        const dummyObj = new Object3D();
        dummyObj.position.x = tankState.position[0];
        dummyObj.position.y = tankState.position[1];
        dummyObj.position.z = tankState.position[2];
        dummyObj.rotation.z = tankState.rotation;
        const newClientActions: ClientAction[] = [];
        clientActions.current.forEach((clientAction) => {
          if (clientAction.timestamp > tankState.timestamp) {
            const inputs = clientAction.action;
            if (inputs.includes("w")) {
              dummyObj.translateY(
                TANK_MOVEMENT_SPEED * secondsPerFrame.current
              );
            }
            if (inputs.includes("s")) {
              dummyObj.translateY(
                -1 * TANK_MOVEMENT_SPEED * secondsPerFrame.current
              );
            }
            if (inputs.includes("a")) {
              dummyObj.rotateZ(TANK_ROTATION_SPEED * secondsPerFrame.current);
            }
            if (inputs.includes("d")) {
              dummyObj.rotateZ(
                -1 * TANK_ROTATION_SPEED * secondsPerFrame.current
              );
            }
            newClientActions.push(clientAction);
          }
        });
        if (game.current) {
          console.log(
            `adjusting client cannon direction [${game.current.playerTank.cannonDirection.x}, ${game.current.playerTank.cannonDirection.y}, ${game.current.playerTank.cannonDirection.z}] to [${tankState.cannonDirection[0]}, ${tankState.cannonDirection[1]}, ${tankState.cannonDirection[2]}]`
          );
          game.current.playerTank.serverAdjustment(
            dummyObj.position.toArray(),
            dummyObj.rotation.z,
            tankState.cannonDirection
          );
        }
        clientActions.current = newClientActions;
      } else {
        // this is another client
        //setOtherTank({
        //position: tankState.position,
        //rotation: tankState.rotation,
        //cannonDirection: tankState.cannonDirection,
        //timestamp: tankState.rotation,
        //});
        if (game.current) {
          if (
            !(clientId in game.current.partnerTanks) &&
            partnerTankModel.current
          ) {
            game.current.joinGame(clientId, partnerTankModel.current);
            setNumPartnerTanks((numPartnerTanks) => numPartnerTanks + 1);
          }
          game.current.updateClient(
            clientId,
            tankState.position,
            tankState.rotation,
            tankState.cannonDirection
          );
        }
      }
    }
  }
  const sendMessage = useSocket(processGameState);

  function sendToServer(action: KeyInput[] | TankMouseEvent) {
    const timestamp = Date.now();
    sendMessage(
      {
        action: action,
        clientId: props.clientId,
        gameId: props.gameId,
        timestamp: timestamp,
      },
      () => {
        if (Array.isArray(action) && action.length) {
          clientActions.current.push({ action: action, timestamp: timestamp });
        }
      }
    );
  }

  useFrame((state, delta, xrFrame) => {
    // This function runs at the native refresh rate inside of a shared render-loop
    if (game.current) {
      game.current.step(keysPressed, delta);
      sendToServer(Array.from(keysPressed));
      secondsPerFrame.current = delta;
    }
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
      {game.current &&
        Object.values(game.current.partnerTanks).map((p) => {
          return <primitive object={p.tank} />;
        })}
      {game.current && <primitive object={game.current.playerTank.tank} />}
      {game.current &&
        game.current.playerTank.projectiles.map((p) => {
          return <primitive key={p.projectile.uuid} object={p.projectile} />;
        })}
    </>
  );
}

function Light() {
  const ref = useRef<DirectionalLight>(null);
  return (
    <directionalLight ref={ref} position={[0, -3, 10]} args={[0xffffff, 2]} />
  );
}

const Box = function (props: {
  // TODO: lol... we can change this later
  [k in keyof TanksMapObject as Exclude<
    k,
    "getBoundingBox" | "handleCollision"
  >]: TanksMapObject[k];
}) {
  const woodMap = useLoader(TextureLoader, props.texture);
  return (
    <mesh position={props.position}>
      <boxGeometry args={props.geometry} />
      <meshStandardMaterial map={woodMap} />
    </mesh>
  );
};

function useSocket(callback: (gameState: GameState) => void) {
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    ws.current = new WebSocket("ws://localhost:8080");
    ws.current.addEventListener("message", (event) => {
      const obj = JSON.parse(event.data);
      callback(obj);
    });
    return () => ws.current?.close();
  }, []);

  function send(message: ClientPayload, callback) {
    waitForConnection(() => {
      const encodedMessage = JSON.stringify(message);
      ws.current?.send(encodedMessage);
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
