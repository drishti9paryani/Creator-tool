"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store/project";

/**
 * True once the persisted store has finished loading from IndexedDB.
 *
 * IndexedDB has no synchronous read, so on a hard refresh or a direct link the
 * store is EMPTY for the first render or two. Without this gate every workspace
 * page rendered "This project doesn't exist on this device" before the data
 * arrived — telling a tester their work was gone, milliseconds before it
 * reappeared. Starts false on both server and client so there's no hydration
 * mismatch.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (useStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    return useStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  return hydrated;
}
