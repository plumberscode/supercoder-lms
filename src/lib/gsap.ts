import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);

  // Global GPU hardware acceleration & ultra-smooth defaults
  gsap.config({
    autoSleep: 60,
  });

  gsap.defaults({
    ease: "power3.out",
    duration: 0.6,
  });

  ScrollTrigger.config({
    autoRefreshEvents: "visibilitychange,DOMContentLoaded,load,resize",
    limitCallbacks: true,
  });
}

export { gsap, ScrollTrigger };
export default gsap;
