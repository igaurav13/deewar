import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      {eyebrow && (
        <p className="text-xs uppercase tracking-[0.18em] text-clay font-medium mb-3">
          {eyebrow}
        </p>
      )}
      <h2 className="font-display text-3xl sm:text-4xl text-balance">
        {title}
      </h2>
      {description && (
        <p className="mt-3 text-taupe leading-relaxed">{description}</p>
      )}
    </div>
  );
}
