export function AppHeader({
  title,
  breadcrumb,
}: {
  title: string;
  breadcrumb: string[];
  action?: string;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-[#D2D2D7] bg-[rgba(255,255,255,0.85)] backdrop-blur-[20px]">
      <div className="flex min-h-[52px] sm:h-[64px] items-center gap-3 px-4 sm:px-6 py-2">
        {/* Title / breadcrumb */}
        <div className="min-w-0 flex-1">
          <nav className="hidden sm:flex items-center gap-1.5 text-[11px] tracking-[0.01em] text-[#6E6E73] truncate">
            {breadcrumb.map((c, i) => (
              <span key={c} className="flex items-center gap-1.5 shrink-0">
                {i > 0 && <span className="text-[#D2D2D7]">/</span>}
                <span className={i === breadcrumb.length - 1 ? "text-[#1D1D1F]/60" : ""}>
                  {c}
                </span>
              </span>
            ))}
          </nav>
          <h1 className="mt-0.5 truncate text-[16px] sm:text-[18px] font-bold tracking-[-0.02em] text-[#1D1D1F]">
            {title}
          </h1>
        </div>
      </div>
    </header>
  );
}
