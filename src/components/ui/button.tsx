import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { type ButtonHTMLAttributes, forwardRef } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
};

const variantClasses: Record<string, string> = {
  primary:
    "bg-ink text-paper hover:bg-clay-dark disabled:bg-taupe",
  secondary:
    "bg-clay text-paper hover:bg-clay-dark disabled:bg-taupe",
  outline:
    "border border-ink text-ink hover:bg-ink hover:text-paper disabled:opacity-50",
  ghost: "text-ink hover:bg-sand-light disabled:opacity-50",
};

const sizeClasses: Record<string, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-sm font-medium tracking-wide transition-colors duration-200 cursor-pointer disabled:cursor-not-allowed",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="size-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
