"use client";

// STUB for the day-zero build smoke test — replaced by the full experience
// (Lenis + master ScrollTrigger timeline + PlaneScene) in the build pass.
import { Canvas } from "@react-three/fiber";

export default function LandingExperience() {
  return (
    <div
      aria-hidden
      style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1 }}
    >
      <Canvas dpr={[1, 1.75]} gl={{ antialias: true, alpha: true }}>
        <mesh>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshBasicMaterial color="#7C3AED" wireframe />
        </mesh>
      </Canvas>
    </div>
  );
}
