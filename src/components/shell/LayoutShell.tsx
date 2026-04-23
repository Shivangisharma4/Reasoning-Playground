"use client";

import { m } from "framer-motion";
import type { ReactNode } from "react";
import { RoomsSidebar } from "./RoomsSidebar";
import { ToolPanel } from "./ToolPanel";
import { shellEnter, shellPanel } from "@/components/motion/variants";

export function LayoutShell({ children }: { children: ReactNode }) {
  return (
    <m.div
      variants={shellEnter}
      initial="hidden"
      animate="show"
      className="relative grid min-h-dvh"
      style={{
        gridTemplateColumns:
          "clamp(240px, 22vw, 320px) minmax(0, 1fr) clamp(300px, 26vw, 400px)",
      }}
    >
      <m.div variants={shellPanel} className="relative z-10">
        <RoomsSidebar />
      </m.div>

      <m.main
        variants={shellPanel}
        className="relative z-0 px-shell py-shell -mt-2"
      >
        {children}
      </m.main>

      <m.div
        variants={shellPanel}
        className="relative z-20 mr-3 mt-12 -ml-6 translate-y-10 rotate-[-0.35deg]"
      >
        <ToolPanel />
      </m.div>
    </m.div>
  );
}
