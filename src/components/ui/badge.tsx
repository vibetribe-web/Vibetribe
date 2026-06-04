import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "secondary";
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold shadow-sm transition-colors",
        variant === "default" && "border-indigo-700 bg-indigo-600 text-white shadow-indigo-900/10",
        variant === "secondary" && "border-slate-200/80 bg-white/78 text-slate-700 backdrop-blur hover:bg-white",
        className,
      )}
      {...props}
    />
  );
}
