"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      richColors
      position="top-right"
      toastOptions={{
        className: "rounded-2xl border border-white/70 shadow-2xl backdrop-blur-xl",
      }}
    />
  );
}
