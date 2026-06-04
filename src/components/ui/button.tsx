import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold tracking-[0.005em] transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-slate-900 text-white shadow-sm shadow-slate-900/12 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md hover:shadow-slate-900/14 dark:bg-white dark:text-slate-950",
        secondary:
          "bg-white/92 text-slate-900 shadow-sm shadow-slate-200/70 ring-1 ring-slate-200/80 backdrop-blur hover:-translate-y-0.5 hover:bg-white hover:shadow-md hover:shadow-slate-200/80",
        outline:
          "border border-slate-200/90 bg-white/55 text-slate-900 shadow-sm shadow-slate-200/35 backdrop-blur hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white/90 hover:shadow-md",
        ghost: "text-slate-700 hover:bg-slate-100/80 hover:text-slate-950 hover:-translate-y-0.5",
        gradient:
          "bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 bg-size-200 text-white shadow-md shadow-blue-500/22 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/24",
        destructive: "bg-rose-600 text-white shadow-sm shadow-rose-500/18 hover:-translate-y-0.5 hover:bg-rose-700 hover:shadow-md hover:shadow-rose-500/20",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
