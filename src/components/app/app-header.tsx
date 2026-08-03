import { Search, Bell, Plus, ChevronDown, PanelsTopLeft } from "lucide-react";

export function AppHeader({
  title,
  breadcrumb,
  action,
}: {
  title: string;
  breadcrumb: string[];
  action?: string;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-[#D2D2D7] bg-[rgba(255,255,255,0.80)] backdrop-blur-[20px]">
      <div className="flex h-[64px] items-center gap-4 px-6">
        {/* Title / breadcrumb */}
        <div className="min-w-0 flex-1">
          <nav className="flex items-center gap-1.5 text-[11px] tracking-[0.01em] text-[#6E6E73]">
            {breadcrumb.map((c, i) => (
              <span key={c} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-[#D2D2D7]">/</span>}
                <span className={i === breadcrumb.length - 1 ? "text-[#1D1D1F]/60" : ""}>
                  {c}
                </span>
              </span>
            ))}
          </nav>
          <h1 className="mt-0.5 truncate text-[18px] font-semibold tracking-[-0.02em] text-[#1D1D1F]">
            {title}
          </h1>
        </div>

        {/* Search */}
        <div className="relative hidden w-64 xl:block">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-[16px] w-[16px] -translate-y-1/2 text-[#6E6E73]"
            strokeWidth={1.5}
          />
          <input
            placeholder="Search…"
            className="input-field pl-9 pr-12 text-[14px]"
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-[6px] border border-[#D2D2D7] bg-[#F5F5F7] px-1.5 py-0.5 text-[10px] font-medium text-[#6E6E73]">
            ⌘K
          </kbd>
        </div>

        {/* Bell */}
        <button className="btn-icon relative">
          <Bell className="h-[17px] w-[17px]" strokeWidth={1.5} />
          <span className="absolute right-2.5 top-2.5 h-[7px] w-[7px] rounded-full bg-[#ff3b30]" />
        </button>

        {/* Primary CTA */}
        <button className="btn-primary hidden sm:inline-flex">
          <Plus className="h-4 w-4" strokeWidth={1.75} />
          {action ?? "New intake"}
        </button>

        {/* Mobile menu toggle */}
        <button className="btn-icon lg:hidden">
          <PanelsTopLeft className="h-[17px] w-[17px]" strokeWidth={1.5} />
        </button>

        {/* User pill */}
        <button className="hidden h-[44px] shrink-0 items-center gap-2 rounded-[12px] border border-[#D2D2D7] bg-[#F5F5F7] pl-1.5 pr-3 transition-colors duration-200 hover:bg-[rgba(0,113,227,0.08)] lg:flex">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-[#0071E3] text-[10px] font-semibold text-white">
            RV
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-[#6E6E73]" strokeWidth={1.75} />
        </button>
      </div>
    </header>
  );
}
