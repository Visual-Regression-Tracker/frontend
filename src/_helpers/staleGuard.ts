import { useMemo, useRef } from "react";

export interface StaleGuard {
  isCurrent: () => boolean;
  cancel: () => void;
}

// an answer may land only while the request that asked for it is still the latest one
export function staleGuard(): StaleGuard {
  let stale = false;
  return {
    isCurrent: () => !stale,
    cancel: () => {
      stale = true;
    },
  };
}

export function useRequestGuard() {
  const counter = useRef(0);
  return useMemo(
    () => ({
      start(): () => boolean {
        const id = ++counter.current;
        return () => id === counter.current;
      },
      invalidate() {
        counter.current += 1;
      },
    }),
    [],
  );
}
