// Single source of truth for the landing's scroll progress (0..1).
// Written by the master ScrollTrigger timeline; read by the R3F scene inside
// useFrame with damping. A module singleton (not React state) so scroll frames
// never cause React re-renders.
export const scrollState = { progress: 0 };
