"use client";

import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, PerformanceMonitor } from "@react-three/drei";
import * as THREE from "three";
import { scrollState } from "../scroll/scrollState";
import PaperPlane from "./PaperPlane";
import TipJar from "./TipJar";

/**
 * The R3F canvas: warm paper-light rig, the paper-bill dart, and the glass
 * tip jar. Everything is local — Lightformer-built environment (no CDN HDRI
 * fetches), no shadow pipeline, DPR degraded via PerformanceMonitor.
 *
 * Camera contract: subtle dolly only (z 8 → 6.5) plus a slight downward y
 * drift — the PLANE does the acting.
 */

function CameraRig() {
  const pRef = useRef(0);

  useFrame((state, delta) => {
    pRef.current = THREE.MathUtils.damp(
      pRef.current,
      scrollState.progress,
      5.5,
      delta
    );
    const p = pRef.current;
    state.camera.position.z = 8 - 1.5 * p;
    state.camera.position.y = -0.35 * p;
  });

  return null;
}

export default function PlaneScene({
  onContextLost,
}: {
  onContextLost?: () => void;
}) {
  const [dpr, setDpr] = useState<number | [number, number]>([1, 1.75]);
  const [degraded, setDegraded] = useState(false);

  // Latest-callback ref so the (once) contextlost listener never goes stale.
  const lostRef = useRef(onContextLost);
  lostRef.current = onContextLost;

  return (
    <Canvas
      dpr={dpr}
      camera={{ position: [0, 0, 8], fov: 40 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener(
          "webglcontextlost",
          () => lostRef.current?.(),
          { once: true }
        );
      }}
    >
      <PerformanceMonitor
        onDecline={() => {
          setDpr(1);
          setDegraded(true);
        }}
      />

      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 4, 5]} intensity={1.2} color="#fff5e6" />

      <Environment resolution={64}>
        <Lightformer
          intensity={1.1}
          position={[0, 3, 4]}
          scale={[6, 3, 1]}
          color="#fff3e0"
        />
        <Lightformer
          intensity={0.7}
          position={[-4, 1, 2]}
          scale={[3, 4, 1]}
          color="#efe7ff"
        />
        <Lightformer
          intensity={0.5}
          position={[4, -2, 3]}
          scale={[4, 2, 1]}
          color="#e4f6ee"
        />
      </Environment>

      <CameraRig />
      <PaperPlane />
      <TipJar degraded={degraded} />
    </Canvas>
  );
}
