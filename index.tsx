import { Canvas, useLoader, useThree, useFrame } from "@react-three/fiber";
import { createRoot } from "react-dom/client";
import { TextureLoader } from "three/src/loaders/TextureLoader";
import { Mesh } from "three";
import React, { useEffect, useState, useRef } from "react";

function App() {
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
        <Scene />
      </Canvas>
    </div>
  );
}

function Scene() {
  return (
    <>
      <Light />
      <Box />
      <Tank />
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

function Tank() {
  const movementSpeed = 0.05;
  const rotationSpeed = 0.03;
  const keysPressed = useMovement();
  const meshRef = useRef<Mesh>(null);
  useFrame((state, delta, xrFrame) => {
    // This function runs at the native refresh rate inside of a shared render-loop
    const mesh = meshRef.current;
    if (mesh) {
      if (keysPressed.has("w")) {
        mesh.translateY(movementSpeed);
      }
      if (keysPressed.has("s")) {
        mesh.translateY(-1 * movementSpeed);
      }
      if (keysPressed.has("a")) {
        mesh.rotateZ(rotationSpeed);
      }
      if (keysPressed.has("d")) {
        mesh.rotateZ(-1 * rotationSpeed);
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
