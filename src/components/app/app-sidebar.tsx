import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  ScanBarcode,
  Truck,
  ClipboardCheck,
  GaugeCircle,
  Droplets,
  PaintRoller,
  Wrench,
  RotateCcw,
  Undo2,
  PackageCheck,
  FileBarChart,
  Users,
  Settings,
  ChevronRight,
} from "lucide-react";
import logo from "@/assets/ccb-logo.png.asset.json";
import { cn } from "@/lib/utils";

const groups: { label: string; items: { to: string; label: string; icon: typeof Truck; badge?: string }[] }[] = [
  {
    label: "Overview",
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard },
      { to: "/tracking", label: "Cylinder Tracking", icon: ScanBarcode },
    ],
  },
  {
    label: "Production",
    items: [
      { to: "/receiving", label: "Receiving", icon: Truck },
      { to: "/inspection", label: "Inspection", icon: ClipboardCheck, badge: "61" },
      { to: "/requalification", label: "Requalification", icon: GaugeCircle },
      { to: "/leak-testing", label: "Leak Testing", icon: Droplets },
      { to: "/painting", label: "Painting", icon: PaintRoller },
      { to: "/valve-installation", label: "Valve Installation", icon: Wrench },
    ],
  },
  {
    label: "Exceptions",
    items: [
      { to: "/rework", label: "Rework", icon: RotateCcw, badge: "17" },
      { to: "/customer-returns", label: "Customer Returns", icon: Undo2 },
    ],
  },
  {
    label: "Outbound",
    items: [
      { to: "/dispatch", label: "Dispatch", icon: PackageCheck },
      { to: "/reports", label: "Reports", icon: FileBarChart },
    ],
  },
  {
    label: "Administration",
    items: [
      { to: "/users", label: "Users", icon: Users },
      { to: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function AppSidebar({ activePath = "/" }: { activePath?: string }) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
        <img src={logo.url} alt="CCB" className="h-8 w-8 rounded-md bg-white/95 p-0.5" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-sidebar-accent-foreground">CCB Cylinder</p>
          <p className="truncate text-[11px] text-sidebar-foreground/60">Tracking System</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        {groups.map((group) => (
          <div key={group.label} className="mb-6">
            <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/45">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = activePath === item.to;
                return (
                  <li key={item.to}>
                    <a
                      href={item.to === "/" ? "#/" : `#${item.to}`}
                      className={cn(
                        "group relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        active && "bg-sidebar-accent text-sidebar-accent-foreground",
                      )}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-yellow" />
                      )}
                      <item.icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span className="ml-auto rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold tabular">
                          {item.badge}
                        </span>
                      )}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <button className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-sidebar-accent">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            RV
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-medium text-sidebar-accent-foreground">
              R. Villanueva
            </span>
            <span className="block truncate text-[11px] text-sidebar-foreground/55">Plant Supervisor</span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-sidebar-foreground/50" strokeWidth={1.75} />
        </button>
      </div>
    </aside>
  );
}
