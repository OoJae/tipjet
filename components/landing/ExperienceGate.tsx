"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// The heavy 3D chunk loads ONLY after the gate passes — reduced-motion users,
// WebGL-less browsers, and weak devices never download three.js at all.
const LandingExperience = dynamic(() => import("./LandingExperience"), {
  ssr: false,
});

function canRunExperience(): boolean {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  try {
    const gl = document.createElement("canvas").getContext("webgl2");
    if (!gl) return false;
  } catch {
    return false;
  }
  // Treat undefined (Safari) as capable; block only known-weak devices.
  const nav = navigator as Navigator & { deviceMemory?: number };
  if (nav.deviceMemory !== undefined && nav.deviceMemory <= 4) return false;
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) {
    return false;
  }
  return true;
}

export default function ExperienceGate() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(canRunExperience());
  }, []);

  if (!enabled) return null;
  return <LandingExperience />;
}
