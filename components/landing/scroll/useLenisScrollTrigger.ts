import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

export interface LenisScrollSync {
  lenis: Lenis;
  destroy: () => void;
}

/**
 * Wires Lenis smooth scrolling into GSAP's ticker + ScrollTrigger exactly per
 * the recommended integration: Lenis owns the scroll animation, GSAP's ticker
 * owns the rAF, ScrollTrigger updates on every Lenis scroll frame.
 *
 * Call inside a gsap context (useGSAP) and invoke `destroy` from its cleanup.
 */
export function createLenisScrollSync(): LenisScrollSync {
  const lenis = new Lenis({ autoRaf: false });
  lenis.on("scroll", () => ScrollTrigger.update());

  // gsap ticker time is in seconds; lenis.raf expects milliseconds.
  const raf = (time: number): void => {
    lenis.raf(time * 1000);
  };
  gsap.ticker.add(raf);
  gsap.ticker.lagSmoothing(0);

  return {
    lenis,
    destroy: () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
    },
  };
}
