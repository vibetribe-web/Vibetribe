"use client";

import { useEffect } from "react";
import { healthCheck } from "@/services/api";

let warmupStarted = false;

export function AppWarmup() {
  useEffect(() => {
    if (warmupStarted) return;
    warmupStarted = true;
    void healthCheck();
  }, []);

  return null;
}
