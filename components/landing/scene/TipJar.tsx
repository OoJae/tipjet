"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshTransmissionMaterial } from "@react-three/drei";
import * as THREE from "three";
import { scrollState } from "../scroll/scrollState";
import { makeBillTexture } from "./billTexture";

/**
 * The glass tip jar the plane lands in: a lathed jar with a transmission
 * "glass" material (auto-downgraded to MeshPhysicalMaterial when the
 * PerformanceMonitor declines), a paper "TIPS ♥" label, and a few folded bill
 * slips resting at the bottom. Fades/scales in from scroll progress ~0.62,
 * fully present by ~0.82 — all driven in useFrame, no React state.
 */

const PAPER = "#F7F5F0";

// Lathe profile (r, y): cylindrical body, shoulder, neck, rolled lip.
const JAR_PROFILE: THREE.Vector2[] = [
  [0.01, 0.02],
  [0.34, 0.0],
  [0.55, 0.03],
  [0.62, 0.18],
  [0.64, 0.6],
  [0.62, 0.95],
  [0.55, 1.08],
  [0.52, 1.14],
  [0.6, 1.2],
  [0.62, 1.26],
  [0.57, 1.3],
].map(([r, y]) => new THREE.Vector2(r, y));

// Render the paper world into the transmission buffer's backdrop so the glass
// reads warm on the transparent canvas instead of refracting darkness.
const GLASS_BG = new THREE.Color(PAPER);

interface Slip {
  position: [number, number, number];
  rotation: [number, number, number];
}

const SLIPS: Slip[] = [
  { position: [0.12, 0.1, 0.08], rotation: [-Math.PI / 2 + 0.25, 0.4, 0] },
  { position: [-0.18, 0.12, -0.06], rotation: [-Math.PI / 2 - 0.2, 1.9, 0] },
  { position: [0.02, 0.2, -0.15], rotation: [-Math.PI / 2 + 0.4, 3.4, 0] },
  { position: [-0.05, 0.16, 0.18], rotation: [-Math.PI / 2 - 0.3, 5.0, 0] },
];

function makeLabelTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, 256, 128);
    ctx.strokeStyle = "rgba(20, 18, 14, 0.75)";
    ctx.lineWidth = 3;
    ctx.strokeRect(8.5, 8.5, 239, 111);
    ctx.fillStyle = "#14120E";
    ctx.font = "700 44px 'Courier New', Courier, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("TIPS", 108, 68);
    // little violet heart
    const cx = 198;
    const cy = 64;
    const s = 34;
    ctx.fillStyle = "#7C3AED";
    ctx.beginPath();
    ctx.moveTo(cx, cy + s * 0.35);
    ctx.bezierCurveTo(
      cx - s * 0.55,
      cy - s * 0.05,
      cx - s * 0.35,
      cy - s * 0.45,
      cx,
      cy - s * 0.15
    );
    ctx.bezierCurveTo(
      cx + s * 0.35,
      cy - s * 0.45,
      cx + s * 0.55,
      cy - s * 0.05,
      cx,
      cy + s * 0.35
    );
    ctx.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export default function TipJar({ degraded }: { degraded: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const tRef = useRef(0);
  const matsRef = useRef<THREE.Material[]>([]);

  const billTexture = useMemo(() => makeBillTexture(), []);
  const labelTexture = useMemo(() => makeLabelTexture(), []);
  useEffect(
    () => () => {
      billTexture.dispose();
      labelTexture.dispose();
    },
    [billTexture, labelTexture]
  );

  // Cache the materials once per material-set (re-collected on downgrade) so
  // the per-frame opacity write never traverses or allocates.
  useEffect(() => {
    const mats: THREE.Material[] = [];
    groupRef.current?.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) {
        if (Array.isArray(mesh.material)) mats.push(...mesh.material);
        else mats.push(mesh.material);
      }
    });
    matsRef.current = mats;
  }, [degraded]);

  useFrame((state, delta) => {
    const g = groupRef.current;
    if (!g) return;

    const target = THREE.MathUtils.smoothstep(scrollState.progress, 0.62, 0.82);
    tRef.current = THREE.MathUtils.damp(tRef.current, target, 6, delta);
    const t = tRef.current;

    g.visible = t > 0.003; // skip the transmission pass entirely until needed
    g.scale.setScalar(0.7 + 0.3 * t);
    // same x-compression factor as PaperPlane so the landing stays aligned
    const xFactor = THREE.MathUtils.clamp(state.viewport.width / 9.6, 0.3, 1);
    g.position.set(2.15 * xFactor, -2.85, 0);
    for (const m of matsRef.current) m.opacity = t;
  });

  return (
    <group ref={groupRef} visible={false}>
      {/* glass body */}
      <mesh>
        <latheGeometry args={[JAR_PROFILE, 48]} />
        {degraded ? (
          <meshPhysicalMaterial
            transmission={1}
            transparent
            thickness={0.35}
            roughness={0.15}
            ior={1.45}
            color="#f2f6f2"
          />
        ) : (
          <MeshTransmissionMaterial
            samples={6}
            resolution={256}
            thickness={0.35}
            roughness={0.15}
            chromaticAberration={0.02}
            ior={1.45}
            transparent
            color="#f2f6f2"
            background={GLASS_BG}
          />
        )}
      </mesh>

      {/* paper label, wrapped to the jar's curve */}
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.655, 0.655, 0.34, 24, 1, true, -0.35, 0.7]} />
        <meshStandardMaterial
          map={labelTexture}
          transparent
          roughness={0.9}
          metalness={0}
        />
      </mesh>

      {/* folded bill slips resting at the bottom */}
      {SLIPS.map((slip, i) => (
        <mesh key={i} position={slip.position} rotation={slip.rotation}>
          <circleGeometry args={[0.17, 3]} />
          <meshStandardMaterial
            map={billTexture}
            transparent
            roughness={0.9}
            metalness={0}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}
