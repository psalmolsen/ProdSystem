import {
  LayoutDashboard,
  ScanBarcode,
  ClipboardList,
  FileText,
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
      { to: "/",          label: "Dashboard",         icon: LayoutDashboard },
      { to: "/job-orders",label: "Job Orders",        icon: FileText },
      { to: "/entry",     label: "Production Entry",  icon: ClipboardList },
      { to: "/tracking",  label: "Cylinder Tracking", icon: ScanBarcode },
    ],
  },
  {
    label: "Production",
    items: [
      { to: "/receiving",   label: "Receiving",    icon: Truck },
      { to: "/ctc1",        label: "CTC 1",        icon: ClipboardCheck },
      { to: "/ctc2",        label: "CTC 2",        icon: GaugeCircle },
      { to: "/hotworks",    label: "Hotworks",     icon: Wrench },
      { to: "/painting",    label: "Painting",     icon: PaintRoller },
      { to: "/cosmetics",   label: "Cosmetics",    icon: Droplets },
    ],
  },
  {
    label: "Exceptions",
    items: [
      { to: "/rework",           label: "Rework",           icon: RotateCcw, badge: "17" },
      { to: "/customer-returns",  label: "Customer Returns",  icon: Undo2 },
    ],
  },
  {
    label: "Outbound",
    items: [
      { to: "/dispatch", label: "Dispatch", icon: PackageCheck },
      { to: "/reports",  label: "Reports",  icon: FileBarChart },
    ],
  },
  {
    label: "Administration",
    items: [
      { to: "/users",    label: "Users",    icon: Users },
      { to: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function AppSidebar({ activePath = "/" }: { activePath?: string }) {
  return (
    <aside className="hidden w-[240px] shrink-0 flex-col border-r border-[#D2D2D7] bg-[#FFFFFF] lg:flex">
      {/* Logo lockup */}
      <div className="flex h-[64px] items-center gap-3 border-b border-[#D2D2D7] px-5">
        <img
          src={logo.url}
          alt="CCB"
          className="h-8 w-8 rounded-[10px] bg-[#F5F5F7] p-0.5 shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
        />
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-[#1D1D1F] tracking-[-0.01em]">
            CCB Cylinder
          </p>
          <p className="truncate text-[11px] text-[#6E6E73]">Tracking System</p>
        </div>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        {groups.map((group) => (
          <div key={group.label} className="mb-6">
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#6E6E73]">
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
                        "flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[13px] font-medium transition-colors duration-200",
                        active
                          ? "bg-[rgba(0,113,227,0.10)] text-[#0071E3]"
                          : "text-[#1D1D1F]/70 hover:bg-[#F5F5F7] hover:text-[#1D1D1F]",
                      )}
                    >
                      <item.icon
                        className={cn("h-[17px] w-[17px] shrink-0", active ? "text-[#0071E3]" : "text-[#6E6E73]")}
                        strokeWidth={1.5}
                      />
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span
                          className={cn(
                            "ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold tabular",
                            active
                              ? "bg-[#0071E3]/15 text-[#0071E3]"
                              : "bg-[#F5F5F7] text-[#6E6E73]",
                          )}
                        >
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

      {/* User footer */}
      <div className="border-t border-[#D2D2D7] p-3">
        <button className="flex w-full items-center gap-3 rounded-[10px] px-2.5 py-2.5 text-left transition-colors duration-200 hover:bg-[#F5F5F7]">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#0071E3] text-[11px] font-semibold text-white">
            RV
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-medium text-[#1D1D1F] tracking-[-0.01em]">
              R. Villanueva
            </span>
            <span className="block truncate text-[11px] text-[#6E6E73]">Plant Supervisor</span>
          </span>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#6E6E73]" strokeWidth={1.75} />
        </button>
      </div>
    </aside>
  );
}
