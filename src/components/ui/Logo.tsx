export function Logo({ withText = true }: { withText?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg viewBox="0 0 64 64" className="size-9" aria-hidden>
        <rect width="64" height="64" rx="16" className="fill-primary" />
        <path d="M20 18h22v6H27v5h13v6H27v5h15v6H20z" fill="#fff" />
        <circle cx="48" cy="44" r="5" className="fill-secondary" />
      </svg>
      {withText && <span className="text-lg font-bold tracking-tight">English Mastery</span>}
    </span>
  );
}
