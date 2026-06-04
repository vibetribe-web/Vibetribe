"use client";

import { useEffect, useState } from "react";

export function useDelayedLoading(isLoading: boolean, delay = 250) {
  const [showSkeleton, setShowSkeleton] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      const timeoutId = window.setTimeout(() => setShowSkeleton(false), 0);
      return () => window.clearTimeout(timeoutId);
    }

    const timeoutId = window.setTimeout(() => setShowSkeleton(true), delay);
    return () => window.clearTimeout(timeoutId);
  }, [delay, isLoading]);

  return isLoading && showSkeleton;
}
