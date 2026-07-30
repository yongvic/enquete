"use client";

import { useEffect, useState } from "react";

/** True when viewport is below the given breakpoint (default: Tailwind `sm`). */
export function useIsNarrow(breakpoint = 640) {
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const update = () => setNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [breakpoint]);

  return narrow;
}

export function truncateLabel(label: string, max: number) {
  const trimmed = label.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, Math.max(1, max - 1))}…`;
}
