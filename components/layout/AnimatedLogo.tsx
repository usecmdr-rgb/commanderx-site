"use client";

import Link from "next/link";
import { useEffect } from "react";
import { motion, useAnimationControls } from "framer-motion";

export default function AnimatedLogo() {
  const cControls = useAnimationControls();
  const xControls = useAnimationControls();
  const wordControls = useAnimationControls();

  useEffect(() => {
    let cancelled = false;

    async function run() {
      // Phase 0: Start with C and X together (as "CX")
      await Promise.all([
        cControls.set({ x: 0, scale: 1 }),
        xControls.set({ x: 0, scale: 1 }),
        wordControls.set({ opacity: 0 }),
      ]);

      if (cancelled) return;

      // Phase 1: C and X space out to make room for "ommander"
      await Promise.all([
        cControls.start({
          x: -70,
          transition: { duration: 0.8, ease: "easeOut" },
        }),
        xControls.start({
          x: 70,
          transition: { duration: 0.8, ease: "easeOut" },
        }),
      ]);

      if (cancelled) return;

      // Phase 2: "ommander" fades in between C and X
      await wordControls.start({
        opacity: 1,
        transition: {
          delay: 0.2,
          duration: 0.6,
          ease: "easeOut",
        },
      });

      if (cancelled) return;

      // Phase 3: Hold full "CommanderX" for 1.5s
      await new Promise((resolve) => setTimeout(resolve, 1500));
      if (cancelled) return;

      // Phase 4: Fade out "ommander" while C and X slide together and scale up 40%
      await Promise.all([
        wordControls.start({
          opacity: 0,
          transition: {
            duration: 0.8,
            ease: "easeIn",
          },
        }),
        cControls.start({
          x: -5,
          scale: 1.4,
          transition: { duration: 0.8, ease: "easeInOut" },
        }),
        xControls.start({
          x: 5,
          scale: 1.4,
          transition: { duration: 0.8, ease: "easeInOut" },
        }),
      ]);
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [cControls, xControls, wordControls]);

  return (
    <Link href="/" className="flex items-center">
      <div className="relative inline-flex items-center font-semibold tracking-tight text-[1.755rem] text-brand-accent dark:text-slate-100">
        {/* C */}
        <motion.span
          animate={cControls}
          initial={{ x: 0, scale: 1 }}
          className="tracking-tight text-slate-900 dark:text-slate-100 relative z-20"
        >
          C
        </motion.span>

        {/* "ommander" – absolutely positioned in the middle */}
        <motion.span
          animate={wordControls}
          initial={{ opacity: 0 }}
          className="pointer-events-none absolute left-1/2 -translate-x-1/2 z-10 tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap"
        >
          ommander
        </motion.span>

        {/* X */}
        <motion.span
          animate={xControls}
          initial={{ x: 0, scale: 1 }}
          className="tracking-tight text-orange-700 dark:text-orange-600 relative z-20"
        >
          X
        </motion.span>
      </div>
    </Link>
  );
}

