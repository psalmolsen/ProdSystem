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
    <header className="sticky top-0 z-20 border-b border-border bg-card/85 backdrop-blur">
      <div className="flex h-16 items-center gap-4 px-6">
        <div className="min-w-0 flex-1">
          <nav className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            {breadcrumb.map((c, i) => (
              <span key={c} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-border">/</span>}
                <span className={i === breadcrumb.length - 1 ? "text-foreground/70" : ""}>{c}</span>
              </span>
            ))}
          </nav>
          <h1 className="truncate text-[19px] font-semibold tracking-[-0.01em]">{title}</h1>
        </div>

        <div className="relative hidden w-72 xl:block">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            strokeWidth={1.75}
          />
          <input
            placeholder="Search serial, barcode, batch\u2026"
            className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-14 text-[13px] outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/15"
          />
          <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            \u2318K
          </kbd>
        </div>

        <button className="relative grid h-9 w-9 shrink-0 place-items-center rounded-md border border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground">
          <Bell className="h-4 w-4" strokeWidth={1.75} />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-brand-red" />
        </button>

        <button className="hidden h-9 shrink-0 items-center gap-2 rounded-md bg-primary px-3 text-[13px] font-medium text-primary-foreground hover:bg-primary-dark sm:flex">
          <Plus className="h-4 w-4" strokeWidth={2} />
          {action ?? "New Intake"}
        </button>

        <button className="flex h-9 shrink-0 items-center gap-2 rounded-md border border-border bg-card px-2 text-[13px] hover:bg-accent lg:hidden">
          <PanelsTopLeft className="h-4 w-4" strokeWidth={1.75} />
        </button>

        <button className="hidden h-9 shrink-0 items-center gap-2 rounded-md border border-border bg-card pl-1.5 pr-2 hover:bg-accent lg:flex">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-primary-dark text-[10px] font-semibold text-primary-foreground">
            RV
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />
        </button>
      </div>
    </header>
  );
}
