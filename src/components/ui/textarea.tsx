import * as React from "react";
import { cn } from "@/lib/utils";

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full rounded-xl border border-slate-200/90 bg-white/88 px-3.5 py-3 text-sm leading-6 text-slate-900 shadow-sm shadow-slate-200/35 outline-none backdrop-blur transition-all duration-200 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100/75",
        className,
      )}
      {...props}
    />
  );
}
