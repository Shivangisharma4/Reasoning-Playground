"use client";

import { useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

type Selection = { start: number; end: number } | undefined;

export function usePresence(roomId: Id<"rooms"> | null) {
  const heartbeat = useMutation(api.presence.heartbeat);
  const goodbye = useMutation(api.presence.goodbye);
  const selectionRef = useRef<Selection>(undefined);

  useEffect(() => {
    if (!roomId) return;
    let cancelled = false;

    const beat = () => {
      if (cancelled) return;
      heartbeat({ roomId, selection: selectionRef.current }).catch(() => {});
    };
    beat();
    const interval = setInterval(beat, 5_000);

    const onUnload = () => {
      goodbye({ roomId }).catch(() => {});
    };
    window.addEventListener("beforeunload", onUnload);
    window.addEventListener("pagehide", onUnload);

    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener("beforeunload", onUnload);
      window.removeEventListener("pagehide", onUnload);
      goodbye({ roomId }).catch(() => {});
    };
  }, [roomId, heartbeat, goodbye]);

  const setSelection = (sel: Selection) => {
    selectionRef.current = sel;
  };
  return { setSelection };
}
