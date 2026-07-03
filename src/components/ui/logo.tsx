import Link from "next/link";

/**
 * The mark: a gallery frame with a single terracotta "sun" — a nod to the
 * red-circle motif running through the site's own poster art (Japandi /
 * ukiyo-e style prints). Doubles as a favicon source.
 */
export function LogoMark({ className = "size-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="4"
        y="4"
        width="32"
        height="32"
        rx="3"
        stroke="currentColor"
        strokeWidth="2.25"
      />
      <circle cx="25.5" cy="14.5" r="4.5" fill="var(--color-clay)" />
      <path
        d="M4 29.5 L14 20 L20.5 25.5 L27 18.5 L36 27"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({
  className = "",
  markClassName = "size-8",
  wordmark = true,
}: {
  className?: string;
  markClassName?: string;
  wordmark?: boolean;
}) {
  return (
    <Link
      href="/"
      aria-label="Deewars.in — home"
      className={`inline-flex items-center gap-2.5 shrink-0 text-ink ${className}`}
    >
      <LogoMark className={markClassName} />
      {wordmark && (
        <span className="font-display text-xl tracking-tight leading-none">
          deewars
          <span className="text-clay">.in</span>
        </span>
      )}
    </Link>
  );
}
