export function BrandMark() {
  return (
    <div className="flex items-center gap-2.5">
      <svg viewBox="0 0 32 32" className="h-8 w-8 text-neutral-950" aria-hidden="true">
        <rect x="2" y="2" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M11.3 2v28M20.7 2v28M2 11.3h28M2 20.7h28" stroke="currentColor" strokeWidth="1.6" />
        <rect x="11.3" y="11.3" width="9.4" height="9.4" fill="#f4a03c" />
      </svg>
      <div>
        <p className="font-display text-[40px] font-medium leading-none tracking-tight text-neutral-950">quill</p>
      </div>
    </div>
  );
}
