"use client";

import { useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { scrollState } from "./scroll/scrollState";
import { createLenisScrollSync } from "./scroll/useLenisScrollTrigger";
import { fireConfetti } from "@/components/tip/confetti";
import PlaneScene from "./scene/PlaneScene";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// One confetti burst per page lifetime, even across remounts/StrictMode.
let confettiFired = false;

/**
 * "The Flight of a Tip" — the full experience layer.
 *
 * Owns: Lenis smooth scroll, the time-based hero intro, ONE scrubbed master
 * timeline over #landing-story (its progress is the single source of truth,
 * mirrored into scrollState for the 3D scene), and the fixed R3F canvas.
 *
 * All DOM content is visible by default (SEO / no-JS parity); hidden initial
 * states are applied here at runtime via gsap.set, and useGSAP's context
 * reverts every set/tween/trigger on unmount.
 */
export default function LandingExperience() {
  const [sceneAlive, setSceneAlive] = useState(true);

  useGSAP(() => {
    const sync = createLenisScrollSync();

    const story = document.getElementById("landing-story");
    const setProgress = (self: ScrollTrigger): void => {
      scrollState.progress = self.progress;
    };
    const onScrub = (self: ScrollTrigger): void => {
      scrollState.progress = self.progress;
      if (!confettiFired && self.progress >= 0.9) {
        confettiFired = true;
        fireConfetti();
      }
    };

    // ------------------------------------------------------------------
    // Hero intro — time-based, runs once on mount (not scrubbed)
    // ------------------------------------------------------------------
    if (document.querySelector("#hero .line-mask .line")) {
      gsap.set("#hero .line-mask", { overflow: "hidden" });
      gsap.set("#hero .line", { yPercent: 110 });
      gsap.set(["#hero .hero-sub", "#hero .hero-cta"], {
        autoAlpha: 0,
        y: 24,
      });
      gsap
        .timeline({ defaults: { ease: "expo.out" }, delay: 0.15 })
        .to("#hero .line", { yPercent: 0, duration: 1.0, stagger: 0.08 })
        .to(
          ["#hero .hero-sub", "#hero .hero-cta"],
          { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.1 },
          0.4
        );
    }

    // ------------------------------------------------------------------
    // Master scrubbed timeline over the whole story
    // ------------------------------------------------------------------
    if (story) {
     try {
      // Initial hidden states (runtime only — markup stays fully visible)
      gsap.set(
        [
          "#write .sec-eyebrow",
          "#write .sec-h",
          "#send .sec-eyebrow",
          "#send .sec-h",
          "#fly .sec-eyebrow",
          "#fly .sec-h",
          "#land .sec-eyebrow",
          "#land .sec-h",
        ],
        { autoAlpha: 0, y: 28 }
      );
      gsap.set("#write .note-card", {
        autoAlpha: 0,
        y: 40,
        rotation: (i: number) => [-6, 4, -3][i % 3],
        transformOrigin: "50% 50%",
      });
      gsap.set("#send .send-bill", {
        autoAlpha: 0,
        scale: 0.9,
        transformOrigin: "50% 50%",
      });
      gsap.set("#send .send-sub", { autoAlpha: 0, y: 16 });
      gsap.set(["#fly .chain-stamp", "#fly .chain-dest"], {
        autoAlpha: 0,
        scale: 0.85,
        transformOrigin: "50% 50%",
      });
      gsap.set("#fly .fly-sub", { autoAlpha: 0, y: 16 });
      gsap.set("#land .receipt", { autoAlpha: 0, y: 30 });
      gsap.set(["#land .receipt-line", "#land .receipt-proof"], {
        autoAlpha: 0,
      });
      const ctaChildren = gsap.utils.toArray<HTMLElement>("#cta > *");
      if (ctaChildren.length > 0) {
        gsap.set(ctaChildren, { autoAlpha: 0, y: 40 });
      }

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: story,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
          onUpdate: onScrub,
          onRefresh: setProgress,
        },
      });

      // Spacer tween pinning totalDuration to exactly 1, so every position
      // below is literally a scroll-progress value.
      tl.to({}, { duration: 1 }, 0);

      // -- 01 WRITE: note-cards fan in (0.15–0.28) --
      tl.to(
        ["#write .sec-eyebrow", "#write .sec-h"],
        { autoAlpha: 1, y: 0, duration: 0.05, stagger: 0.015, ease: "power2.out" },
        0.13
      );
      tl.to(
        "#write .note-card",
        {
          autoAlpha: 1,
          y: 0,
          rotation: (i: number) => [-3, 2, -1][i % 3],
          duration: 0.08,
          stagger: 0.025,
          ease: "power2.out",
        },
        0.16
      );

      // -- 02 SEND: the $5 bill lands, then presses (~0.35) --
      tl.to(
        ["#send .sec-eyebrow", "#send .sec-h"],
        { autoAlpha: 1, y: 0, duration: 0.05, stagger: 0.015, ease: "power2.out" },
        0.31
      );
      tl.to(
        "#send .send-bill",
        { autoAlpha: 1, scale: 1, duration: 0.04, ease: "power2.out" },
        0.33
      );
      tl.to(
        "#send .send-bill",
        { scale: 0.96, duration: 0.015, ease: "power1.in" },
        0.35
      );
      tl.to(
        "#send .send-bill",
        { scale: 1, duration: 0.03, ease: "back.out(3)" },
        0.365
      );
      tl.to(
        "#send .send-sub",
        { autoAlpha: 1, y: 0, duration: 0.04, ease: "power2.out" },
        0.36
      );

      // -- 03 FLY: chain stamps pop sequentially (0.5–0.7) --
      tl.to(
        ["#fly .sec-eyebrow", "#fly .sec-h"],
        { autoAlpha: 1, y: 0, duration: 0.05, stagger: 0.015, ease: "power2.out" },
        0.47
      );
      tl.to(
        "#fly .chain-stamp",
        {
          autoAlpha: 1,
          scale: 1,
          duration: 0.03,
          stagger: 0.035,
          ease: "back.out(2)",
        },
        0.5
      );
      tl.to(
        "#fly .fly-sub",
        { autoAlpha: 1, y: 0, duration: 0.04, ease: "power2.out" },
        0.52
      );
      tl.to(
        "#fly .chain-dest",
        { autoAlpha: 1, scale: 1, duration: 0.03, ease: "back.out(2)" },
        0.68
      );

      // -- 04 LAND: receipt lines type in (0.78–0.9), ✓ line last --
      tl.to(
        ["#land .sec-eyebrow", "#land .sec-h"],
        { autoAlpha: 1, y: 0, duration: 0.05, stagger: 0.015, ease: "power2.out" },
        0.74
      );
      tl.to(
        "#land .receipt",
        { autoAlpha: 1, y: 0, duration: 0.05, ease: "power2.out" },
        0.76
      );
      tl.to(
        "#land .receipt-line",
        { autoAlpha: 1, duration: 0.02, stagger: 0.03 },
        0.78
      );
      tl.to("#land .receipt-proof", { autoAlpha: 1, duration: 0.02 }, 0.9);

      // -- 05 CTA: everything rises (0.92–1) --
      if (ctaChildren.length > 0) {
        tl.to(
          ctaChildren,
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.05,
            stagger: 0.012,
            ease: "power2.out",
          },
          0.92
        );
      }
     } catch {
       // Self-heal: if timeline setup ever throws, never leave content (incl.
       // focusable links/CTA) stuck at visibility:hidden — reveal everything.
       gsap.set("#landing-story [style]", {
         clearProps: "opacity,visibility,transform",
       });
     }
    } else {
      // Interim fallback (story DOM not mounted yet): still fly the plane on
      // whole-page scroll so the scene never sits frozen.
      ScrollTrigger.create({
        start: 0,
        end: "max",
        scrub: true,
        onUpdate: onScrub,
        onRefresh: setProgress,
      });
    }

    // Font swaps change layout heights — re-measure once real faces are in.
    void document.fonts.ready.then(() => ScrollTrigger.refresh());

    // useGSAP's context reverts all sets/tweens/triggers; this handles the
    // non-gsap resources.
    return () => {
      sync.destroy();
    };
  });

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[1]">
      {sceneAlive ? (
        <PlaneScene onContextLost={() => setSceneAlive(false)} />
      ) : null}
    </div>
  );
}
