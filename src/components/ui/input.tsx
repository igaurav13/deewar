import { cn } from "@/lib/utils";
import { type InputHTMLAttributes, forwardRef } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-sm text-ink/80 font-medium">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            "w-full rounded-sm border border-sand bg-canvas px-4 py-2.5 text-ink placeholder:text-taupe/70 transition-colors focus:border-clay",
            error && "border-error",
            className
          )}
          {...props}
        />
        {error && <p className="text-sm text-error">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
