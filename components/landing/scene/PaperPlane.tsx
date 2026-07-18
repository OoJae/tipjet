"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { scrollState } from "../scroll/scrollState";
import { makeBillTexture } from "./billTexture";

/**
 * The signature actor: a banknote folded into a paper dart, flown along a
 * Catmull-Rom path driven by the damped scroll progress (FLIGHT CONTRACT).
 *
 * Geometry is a procedural 6-triangle dart (nose at +X): each wing is split
 * into an inner and outer panel along a nose-to-tail fold line so flat shading
 * shows real paper facets, plus two thin keel faces hanging below the crease.
 */

type Vec3Tuple = [number, number, number];

// ---------------------------------------------------------------------------
// Dart geometry (local space, nose at +X, wingspan across Z, dihedral ~12°)
// ---------------------------------------------------------------------------
const NOSE: Vec3Tuple = [0.78, 0, 0];
const TAIL: Vec3Tuple = [-0.55, 0.02, 0];
const FOLD_L: Vec3Tuple = [-0.58, 0.07, -0.26];
const TIP_L: Vec3Tuple = [-0.62, 0.14, -0.52];
const FOLD_R: Vec3Tuple = [-0.58, 0.07, 0.26];
const TIP_R: Vec3Tuple = [-0.62, 0.14, 0.52];
const KEEL_NOSE: Vec3Tuple = [0.78, -0.005, 0];
const KEEL_BOTTOM: Vec3Tuple = [-0.35, -0.26, 0];
const KEEL_TAIL: Vec3Tuple = [-0.5, -0.02, 0];

interface DartFace {
  v: [Vec3Tuple, Vec3Tuple, Vec3Tuple];
  keel?: boolean;
  zOff?: number;
}

const FACES: DartFace[] = [
  // upper wings — inner + outer panel per side (visible fold crease)
  { v: [NOSE, FOLD_L, TAIL] },
  { v: [NOSE, TIP_L, FOLD_L] },
  { v: [NOSE, TAIL, FOLD_R] },
  { v: [NOSE, FOLD_R, TIP_R] },
  // keel faces below the crease, split ±z so both catch light separately
  { v: [KEEL_NOSE, KEEL_BOTTOM, KEEL_TAIL], keel: true, zOff: -0.012 },
  { v: [KEEL_NOSE, KEEL_TAIL, KEEL_BOTTOM], keel: true, zOff: 0.012 },
];

function buildDartGeometry(): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  for (const face of FACES) {
    for (const [x, y, z] of face.v) {
      positions.push(x, y, z + (face.zOff ?? 0));
      // Bill reads across the wings: u along the fuselage, v across the span.
      const u = (x + 0.62) / 1.4;
      const v = face.keel ? 0.5 + y * 0.9 : (z + 0.52) / 1.04;
      uvs.push(u, v);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();
  return geometry;
}

// ---------------------------------------------------------------------------
// Flight path — FLIGHT CONTRACT waypoints, keyed by scroll progress.
// World coords sized for camera at z≈8, fov 40 (x ±4.2, y ±2.6).
// ---------------------------------------------------------------------------
interface Waypoint {
  p: number;
  pos: THREE.Vector3;
}

const WAYPOINTS: Waypoint[] = [
  { p: 0.0, pos: new THREE.Vector3(2.6, 1.55, 0) }, //   hero hover, upper right
  { p: 0.12, pos: new THREE.Vector3(2.15, 1.15, 0.1) }, // tipping over…
  { p: 0.3, pos: new THREE.Vector3(-3.3, -1.9, 0.35) }, // dive past #write, lower left
  { p: 0.45, pos: new THREE.Vector3(3.8, 1.85, -0.45) }, // LAUNCH — sweep up-right (#send)
  { p: 0.6, pos: new THREE.Vector3(0.3, 2.25, -0.6) }, //  banking traverse (#fly)
  { p: 0.75, pos: new THREE.Vector3(-3.6, 1.3, -0.2) }, // …across to the left
  { p: 0.85, pos: new THREE.Vector3(-0.9, -0.5, 0.15) }, // arcing down (#land)
  { p: 0.92, pos: new THREE.Vector3(2.15, -1.55, 0) }, //  at the jar mouth
  { p: 1.0, pos: new THREE.Vector3(2.15, -2.1, 0) }, //    settled inside the jar
];

const CURVE = new THREE.CatmullRomCurve3(
  WAYPOINTS.map((w) => w.pos),
  false,
  "centripetal"
);

/** Piecewise-linear remap: scroll progress -> curve parameter, honoring the
 *  per-phase timing of the flight contract (curve params are uniform per
 *  segment; waypoint progress keys are not). */
function progressToU(p: number): number {
  if (p <= 0) return 0;
  if (p >= 1) return 1;
  let i = 0;
  while (i < WAYPOINTS.length - 2 && p > WAYPOINTS[i + 1].p) i++;
  const span = WAYPOINTS[i + 1].p - WAYPOINTS[i].p;
  const frac = span > 0 ? (p - WAYPOINTS[i].p) / span : 0;
  return (i + frac) / (WAYPOINTS.length - 1);
}

// Per-frame scratch objects (single PaperPlane instance; zero allocation/frame)
const POS = new THREE.Vector3();
const AHEAD = new THREE.Vector3();
const AHEAD2 = new THREE.Vector3();
const FWD = new THREE.Vector3(1, 0, 0);
const FWD2 = new THREE.Vector3();
const LAST_FWD = new THREE.Vector3(1, 0, 0);
const SIDE = new THREE.Vector3();
const UPV = new THREE.Vector3();
const WORLD_UP = new THREE.Vector3(0, 1, 0);
const X_AXIS = new THREE.Vector3(1, 0, 0);
const Z_AXIS = new THREE.Vector3(0, 0, 1);
const BASIS = new THREE.Matrix4();
const QUAT = new THREE.Quaternion();
const Q_ROLL = new THREE.Quaternion();
const Q_PITCH = new THREE.Quaternion();

const AHEAD_EPS = 0.012;
const BANK_FACTOR = 8;
const DAMP_LAMBDA = 5.5;

export default function PaperPlane() {
  const groupRef = useRef<THREE.Group>(null);
  const pRef = useRef(0);

  const geometry = useMemo(() => buildDartGeometry(), []);
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: makeBillTexture(),
        side: THREE.DoubleSide,
        roughness: 0.85,
        metalness: 0,
        flatShading: true,
      }),
    []
  );

  useEffect(
    () => () => {
      geometry.dispose();
      material.map?.dispose();
      material.dispose();
    },
    [geometry, material]
  );

  useFrame((state, delta) => {
    const g = groupRef.current;
    if (!g) return;

    pRef.current = THREE.MathUtils.damp(
      pRef.current,
      scrollState.progress,
      DAMP_LAMBDA,
      delta
    );
    const p = pRef.current;
    const t = state.clock.elapsedTime;
    const u = progressToU(p);

    // --- position along the flight path ---
    CURVE.getPoint(u, POS);

    // idle sine bob, fading out as the flight begins; a smaller bob returns
    // once the plane has settled inside the jar
    const bobAmp = THREE.MathUtils.clamp(1 - p * 4, 0, 1) * 0.08;
    const jarBob = THREE.MathUtils.smoothstep(p, 0.92, 1) * 0.035;
    POS.y += Math.sin(t * 1.5) * bobAmp + Math.sin(t * 1.1) * jarBob;
    POS.x += Math.cos(t * 1.1) * bobAmp * 0.35;

    // keep the choreography on-frame for narrow viewports (x compresses,
    // matching TipJar's identical factor so the landing stays aligned)
    const xFactor = THREE.MathUtils.clamp(state.viewport.width / 9.6, 0.3, 1);
    g.position.set(POS.x * xFactor, POS.y, POS.z);

    // --- orientation: nose along the tangent (look-ahead) ---
    CURVE.getPoint(Math.min(u + AHEAD_EPS, 1), AHEAD);
    FWD.subVectors(AHEAD, POS);
    if (FWD.lengthSq() < 1e-8) {
      FWD.copy(LAST_FWD);
    } else {
      FWD.normalize();
      LAST_FWD.copy(FWD);
    }
    SIDE.crossVectors(FWD, WORLD_UP);
    if (SIDE.lengthSq() < 1e-6) SIDE.set(0, 0, 1);
    SIDE.normalize();
    UPV.crossVectors(SIDE, FWD);
    BASIS.makeBasis(FWD, UPV, SIDE);
    QUAT.setFromRotationMatrix(BASIS);

    // --- banking roll from path curvature (signed heading change) ---
    CURVE.getPoint(Math.min(u + AHEAD_EPS * 2, 1), AHEAD2);
    FWD2.subVectors(AHEAD2, AHEAD);
    let bank = 0;
    if (FWD2.lengthSq() > 1e-8) {
      FWD2.normalize();
      let dA = Math.atan2(FWD2.y, FWD2.x) - Math.atan2(FWD.y, FWD.x);
      if (dA > Math.PI) dA -= Math.PI * 2;
      if (dA < -Math.PI) dA += Math.PI * 2;
      bank = THREE.MathUtils.clamp(dA * BANK_FACTOR, -0.85, 0.85);
    }

    // paper-light wobble noise on top of the bank
    const rollWobble = Math.sin(t * 2.1) * 0.05 + Math.sin(t * 3.4) * 0.02;
    const pitchWobble = Math.sin(t * 1.7 + 1.3) * 0.03;
    Q_ROLL.setFromAxisAngle(X_AXIS, bank + rollWobble);
    QUAT.multiply(Q_ROLL);
    Q_PITCH.setFromAxisAngle(Z_AXIS, pitchWobble);
    QUAT.multiply(Q_PITCH);
    g.quaternion.copy(QUAT);

    // shrink slightly on final approach so the dart nests into the jar
    const s = 0.9 * (1 - 0.45 * THREE.MathUtils.smoothstep(p, 0.8, 0.95));
    g.scale.setScalar(s);
  });

  return (
    <group ref={groupRef}>
      <mesh geometry={geometry} material={material} />
    </group>
  );
}
