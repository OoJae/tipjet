"use client";

/**
 * MagneticCTA — the landing page's primary button.
 *
 * Fine pointers get a subtle magnetic pull (±8px toward the cursor) with an
 * elastic spring back on leave. Click plays a quick press, fades a paper-
 * colored overlay over the page (180ms), then navigates — the marketing
 * template's enter fade picks up on the other side. Reduced motion skips
 * all theatrics and navigates plainly.
 */

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";

const MAGNET_RANGE = 8; // px, max pull in any direction

export default function MagneticCTA({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  const router = useRouter();
  const btnRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const leavingRef = useRef(false);

  // Magnetic hover — fine pointers only, never under reduced motion.
  useEffect(() => {
    const btn = btnRef.current;
    if (!btn) return;

    const finePointer = window.matchMedia("(pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!finePointer.matches || reducedMotion.matches) return;

    const xTo = gsap.quickTo(btn, "x", { duration: 0.3, ease: "power3.out" });
    const yTo = gsap.quickTo(btn, "y", { duration: 0.3, ease: "power3.out" });

    const onPointerMove = (e: PointerEvent) => {
      if (leavingRef.current) return;
      const rect = btn.getBoundingClientRect();
      // Subtract the current transform so the center stays stable while pulled.
      const cx =
        rect.left + rect.width / 2 - Number(gsap.getProperty(btn, "x"));
      const cy =
        rect.top + rect.height / 2 - Number(gsap.getProperty(btn, "y"));
      const pullX = ((e.clientX - cx) / (rect.width / 2)) * MAGNET_RANGE;
      const pullY = ((e.clientY - cy) / (rect.height / 2)) * MAGNET_RANGE;
      xTo(gsap.utils.clamp(-MAGNET_RANGE, MAGNET_RANGE, pullX));
      yTo(gsap.utils.clamp(-MAGNET_RANGE, MAGNET_RANGE, pullY));
    };

    const onPointerLeave = () => {
      if (leavingRef.current) return;
      gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.4)" });
    };

    btn.addEventListener("pointermove", onPointerMove);
    btn.addEventListener("pointerleave", onPointerLeave);

    return () => {
      btn.removeEventListener("pointermove", onPointerMove);
      btn.removeEventListener("pointerleave", onPointerLeave);
      gsap.killTweensOf(btn);
    };
  }, []);

  // Kill any in-flight exit tweens if we unmount mid-transition.
  useEffect(() => {
    const btn = btnRef.current;
    const overlay = overlayRef.current;
    return () => {
      if (btn) gsap.killTweensOf(btn);
      if (overlay) gsap.killTweensOf(overlay);
    };
  }, []);

  const handleClick = () => {
    if (leavingRef.current) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const btn = btnRef.current;
    const overlay = overlayRef.current;

    if (reducedMotion || !btn || !overlay) {
      router.push(href);
      return;
    }

    leavingRef.current = true;
    gsap
      .timeline({ onComplete: () => router.push(href) })
      .to(btn, { scale: 0.97, duration: 0.12, ease: "power2.out" })
      .to(overlay, { autoAlpha: 1, duration: 0.18, ease: "power1.inOut" });
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={handleClick}
        className="cursor-pointer select-none rounded-full bg-brand px-8 py-4 text-lg font-semibold text-white will-change-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#7C3AED]"
      >
        {label}
      </button>
      {/* Exit veil — fades to paper before navigation; the marketing
          template's enter animation fades the next page in. */}
      <div
        ref={overlayRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[90] bg-[#F7F5F0] opacity-0"
      />
    </>
  );
}
