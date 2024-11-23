import { Canvas, useLoader, useThree, useFrame } from "@react-three/fiber";
import { createRoot } from "react-dom/client";
import { TextureLoader } from "three/src/loaders/TextureLoader";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { Start } from "./start";
import {
  DirectionalLight,
  Group,
  Mesh,
  Object3D,
  Vector3,
  Vector3Tuple,
  RepeatWrapping,
  SpotLight,
  OrthographicCamera,
  HemisphereLight,
  AmbientLight,
  SRGBColorSpace,
  LinearSRGBColorSpace,
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
import { Game as TankGame, isPartnerTank } from "./game";
import { TANK_MOVEMENT_SPEED, TANK_ROTATION_SPEED } from "./playerTank";
import { PartnerTank } from "./partnerTank";
import { GUI } from "dat.gui";

function App() {
  const [gameId, setGameId] = useState("");
  const [clientId, setClientId] = useState("");
  const aspectRatio = window.innerWidth / window.innerHeight;
  console.log(aspectRatio);
  const viewSize = 20;
  // const woodMap = useLoader(TextureLoader, "wood/wood_6.jpg");
  return (
    <>
      <button
        style={{ position: "absolute", zIndex: 1 }}
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
      {/* const woodMap = useLoader(TextureLoader, props.texture); woodMap.wrapS = */}
      {/* RepeatWrapping; woodMap.wrapT = RepeatWrapping; woodMap.colorSpace = */}
      {/* SRGBColorSpace; woodMap.repeat.set(3, 3); // Adjust the repeat values as */}
      {/* needed return ( */}
      {/* <mesh position={props.position}> */}
      {/*   <boxGeometry args={props.geometry} /> */}
      {/*   <meshStandardMaterial map={woodMap} /> */}
      {/* </mesh> */}
      {/* ); */}
      {/* <div style={{ position: "absolute" }}> {gameId}</div> */}
      {/* <button */}
      {/*   style={{ position: "absolute" }} */}
      {/*   onClick={async () => { */}
      {/*     try { */}
      {/*       let promptedGameId = prompt("Enter game id"); */}
      {/*       const response = await fetch("http://localhost:5173/join", { */}
      {/*         method: "POST", */}
      {/*         body: JSON.stringify({ gameId: promptedGameId }), */}
      {/*         headers: { */}
      {/*           "Content-Type": "application/json", */}
      {/*         }, */}
      {/*       }); */}
      {/*       const result = await response.json(); */}
      {/*       console.log("Success:", result); */}
      {/*       setGameId(result.gameId); */}
      {/*       setClientId(result.clientId); */}
      {/*     } catch (error) { */}
      {/*       console.error("Error:", error); */}
      {/*     } */}
      {/*   }} */}
      {/* > */}
      {/*   {" "} */}
      {/*   join game{" "} */}
      {/* </button> */}
      {gameId && clientId && (
        <Canvas
          style={{
            width: "100vw",
            height: "100vh",
          }}
          orthographic={true}
          // camera={{
          //   fov: 50,
          //   aspect: window.innerWidth / window.innerHeight,
          //   near: 0.1,
          //   far: 1000,
          //   position: [0, -10, 18],
          // }}
          camera={{
            left: (-viewSize * aspectRatio) / 2,
            right: (viewSize * aspectRatio) / 2,
            top: viewSize / 2,
            bottom: -viewSize / 2,
            near: 0.1,
            far: 1000,
            rotation: [0.3, 0, 0],
          }}
        >
          <Game gameId={gameId} clientId={clientId} />
        </Canvas>
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

  useEffect(() => {
    const gui = new GUI();
    const aspectRatio = 2;
    const viewSize = 50;
    if (state.camera) {
      console.log(state.camera.position);
      console.log(state.camera.type);
      console.log(state.camera.left);
      console.log(state.camera.right);
      console.log(state.camera.top);
      console.log(state.camera.bottom);
      const x = gui.add(state.camera.position, "x", -20, 20);
      const y = gui.add(state.camera.position, "y", -20, 20);
      const z = gui.add(state.camera.position, "z", -20, 20);
      const x_r = gui.add(state.camera.rotation, "x", 0, Math.PI * 2);
      const y_r = gui.add(state.camera.rotation, "y", 0, Math.PI * 2);
      const z_r = gui.add(state.camera.rotation, "z", 0, Math.PI * 2);
      // gui.add(state.camera.rotation, "x", -20, 20);
      // gui.add(state.camera.rotation, "y", -20, 20);
      // gui.add(state.camera.rotation, "z", -20, 20);
      const near = gui.add(state.camera, "near", 0.1, 100);
      const far = gui.add(state.camera, "far", 0.1, 5000);
      const zoom = gui.add(state.camera, "zoom", 0, 100);
      near.onChange(() => state.camera?.updateProjectionMatrix());
      far.onChange(() => state.camera?.updateProjectionMatrix());
      zoom.onChange(() => state.camera?.updateProjectionMatrix());
      x.onChange(() => state.camera?.updateProjectionMatrix());
      y.onChange(() => state.camera?.updateProjectionMatrix());
      z.onChange(() => state.camera?.updateProjectionMatrix());
      x_r.onChange(() => state.camera?.updateProjectionMatrix());
      y_r.onChange(() => state.camera?.updateProjectionMatrix());
      z_r.onChange(() => state.camera?.updateProjectionMatrix());
      // state.camera.left = (-viewSize * aspectRatio) / 2;
      // state.camera.right = (-viewSize * aspectRatio) / 2;
      // state.camera.top = viewSize / 2;
      // state.camera.bottom = -viewSize / 2;
      // state.camera.near = 0.1;
      // state.camera.far = 1000;
      // state.camera.updateProjectionMatrix();
      // left: (-viewSize * aspectRatio) / 2,
      // right: (viewSize * aspectRatio) / 2,
      // top: viewSize / 2,
      // bottom: -viewSize / 2,
      // near: 0.1,
      // far: 1000,
      // gui.add(state.camera, "zoom", 0, 100);
    }
    return () => {
      gui.destroy();
    };
  }, []);

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
    const aspectRatio = window.innerWidth / window.innerHeight;
    console.log(aspectRatio);
    const viewSize = 20;
    console.log("resizing");
    // const canvas = document.getElementById("haritest");
    let newWidth = window.innerWidth;
    let newHeight = window.innerHeight;

    // if (newWidth / newHeight > 1.777) {
    //   // need to lower width
    //   newWidth = (16 * newHeight) / 9;
    // }
    //
    // if (newWidth / newHeight < 1.777) {
    //   // need to lower height
    //   newHeight = (9 * newWidth) / 16;
    // }
    //
    // canvas.style.width = `${newWidth}px`;
    // canvas.style.height = `${newHeight}px`;
    // camera={{
    //   left: (-viewSize * aspectRatio) / 2,
    //   right: (viewSize * aspectRatio) / 2,
    //   top: viewSize / 2,
    //   bottom: -viewSize / 2,
    //   near: 0.1,
    //   far: 1000,
    // }}
    // state.camera.aspect = aspect;
    state.camera.left = (-viewSize * aspectRatio) / 2;
    state.camera.right = (viewSize * aspectRatio) / 2;
    state.camera.top = viewSize / 2;
    state.camera.bottom = -viewSize / 2;
    state.camera.updateProjectionMatrix();
    state.gl.setSize(newWidth, newHeight);
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
                TANK_MOVEMENT_SPEED * secondsPerFrame.current,
              );
            }
            if (inputs.includes("s")) {
              dummyObj.translateY(
                -1 * TANK_MOVEMENT_SPEED * secondsPerFrame.current,
              );
            }
            if (inputs.includes("a")) {
              dummyObj.rotateZ(TANK_ROTATION_SPEED * secondsPerFrame.current);
            }
            if (inputs.includes("d")) {
              dummyObj.rotateZ(
                -1 * TANK_ROTATION_SPEED * secondsPerFrame.current,
              );
            }
            newClientActions.push(clientAction);
          }
        });
        if (game.current) {
          console.log(
            `adjusting client cannon direction [${game.current.playerTank.cannonDirection.x}, ${game.current.playerTank.cannonDirection.y}, ${game.current.playerTank.cannonDirection.z}] to [${tankState.cannonDirection[0]}, ${tankState.cannonDirection[1]}, ${tankState.cannonDirection[2]}]`,
          );
          game.current.playerTank.serverAdjustment(
            dummyObj.position.toArray(),
            dummyObj.rotation.z,
            tankState.cannonDirection,
          );
        }
        clientActions.current = newClientActions;
      } else {
        if (game.current) {
          if (!(clientId in game.current.otherTanks)) {
            // TODO: do we need to re-create this obj every time?
            const loader = new GLTFLoader();
            loader.load("Tanks/player_tank_red.glb", (collada) => {
              const scene = collada.scene;
              scene.scale.set(5, 5, 5);
              scene.position.set(...map1.secondStartingPosition);
              if (game.current) {
                game.current.joinGame(clientId, new PartnerTank(scene));
                setNumPartnerTanks((numPartnerTanks) => numPartnerTanks + 1);
              }
            });
          }
          game.current.updateClient(clientId, tankState);
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
      },
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

  function getOtherTankProjectiles() {
    if (game.current) {
      return Object.values(game.current.otherTanks).map((otherTank) => {
        if (isPartnerTank(otherTank)) {
          otherTank.projectiles.values;
          const projectiles = Array.from(otherTank.projectiles.values());
          return projectiles.map((p) => {
            return <primitive key={p.projectile.uuid} object={p.projectile} />;
          });
        }
      });
    }
  }

  return (
    <>
      {/* <Light /> */}
      {/* <Light2 /> */}
      <Light3 />
      <Plane />
      {map1.objects.map((box) => (
        <Box
          position={box.position}
          geometry={box.geometry}
          texture={box.texture}
          type="map"
        />
      ))}
      {getOtherTankProjectiles()}
      {game.current &&
        Object.values(game.current.otherTanks).map((p) => {
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
  const ref = useRef<SpotLight>(null);
  useEffect(() => {
    const gui = new GUI();
    if (ref.current) {
      gui.add(ref.current, "intensity", 0, 100);
      gui.add(ref.current, "distance", 0, 20);
      gui.add(ref.current, "angle", 0, Math.PI * 2);
      gui.add(ref.current.position, "x", -20, 20);
      gui.add(ref.current.position, "y", -20, 20);
      gui.add(ref.current.position, "z", -20, 20);
    }
    return () => {
      gui.destroy();
    };
  }, []);
  return <spotLight ref={ref} args={[0xffffff, 100]} />;
}

function Light2() {
  const ref = useRef<HemisphereLight>(null);
  // useEffect(() => {
  //   if (ref.current) {
  //     ref.current.target.position.set(0, 8, 0);
  //   }
  // }, []);
  return <hemisphereLight intensity={1.2} />;
}

function Light3() {
  // const ref = useRef<AmbientLight>(null);
  // useEffect(() => {
  //   if (ref.current) {
  //     ref.current.target.position.set(0, 8, 0);
  //   }
  // }, []);
  return <ambientLight args={[0xffffff, 2.5]} />;
}

const Plane = function () {
  const woodMap = useLoader(TextureLoader, "wood/wood6.jpg");
  woodMap.colorSpace = SRGBColorSpace;
  woodMap.wrapS = RepeatWrapping;
  woodMap.wrapT = RepeatWrapping;
  woodMap.repeat.set(4, 4); // Adjust the repeat values as needed
  return (
    <mesh position={[0, 0, -1]}>
      <planeGeometry args={[40, 25]} />
      <meshStandardMaterial map={woodMap} />
    </mesh>
  );
};
const Box = function (props: {
  // TODO: lol... we can change this later
  [k in keyof TanksMapObject as Exclude<
    k,
    "getBoundingBox" | "handleCollision"
  >]: TanksMapObject[k];
}) {
  const woodMap = useLoader(TextureLoader, props.texture);
  woodMap.wrapS = RepeatWrapping;
  woodMap.wrapT = RepeatWrapping;
  woodMap.colorSpace = SRGBColorSpace;
  woodMap.rotation = Math.PI / 4;
  woodMap.repeat.set(2, 2); // Adjust the repeat values as needed
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
