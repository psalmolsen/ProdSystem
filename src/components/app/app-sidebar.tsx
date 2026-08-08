import {
  LayoutDashboard,
  ClipboardList,
  FileText,
  RotateCcw,
  Users,
  LogOut,
  Tag,
} from "lucide-react";
import logo from "@/assets/ccb-logo.png.asset.json";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { to: "/",              label: "Dashboard",         icon: LayoutDashboard },
  { to: "/brand-summary", label: "Brand Summary",     icon: Tag },
  { to: "/job-orders",    label: "Job Orders",        icon: FileText },
  { to: "/entry",         label: "Production Entry",  icon: ClipboardList },
  { to: "/backjob",       label: "Backjob Management", icon: RotateCcw },
  { to: "/access-requests", label: "User Access & Accounts", icon: Users },
];

export function AppSidebar({ activePath }: { activePath: string }) {
  const { user, role, signOut } = useAuth();

  return (
    <aside className="flex h-full w-[240px] flex-col shrink-0 border-r border-[#D2D2D7] bg-white text-[#1D1D1F]">
      {/* Brand header */}
      <div className="flex h-[72px] items-center gap-3 border-b border-[#D2D2D7] px-6">
        <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[10px] bg-[#0071E3]/10">
          <img src={logo.src} alt="CCB Logo" className="h-[22px] w-[22px] object-contain" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold tracking-[-0.01em] text-[#1D1D1F]">
            CCB Production
          </p>
          <p className="truncate text-[11px] text-[#6E6E73]">Manufacturing System</p>
        </div>
      </div>

      {/* Navigation list */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map((item) => {
          const active = activePath === item.to || (item.to === "/" && activePath === "");
          return (
            <a
              key={item.to}
              href={`#${item.to}`}
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
            </a>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-[#D2D2D7] p-3">
        <div className="flex w-full items-center gap-3 rounded-[10px] px-2.5 py-2.5 text-left">
          {user?.photoURL ? (
            <img src={user.photoURL} alt={user.displayName || "User"} className="h-8 w-8 rounded-full object-cover shrink-0" />
          ) : (
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#0071E3] text-[11px] font-semibold text-white">
              {(user?.displayName || user?.email || "U").substring(0, 2).toUpperCase()}
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-medium text-[#1D1D1F] tracking-[-0.01em]">
              {user?.displayName || "Authenticated User"}
            </span>
            <span className="block truncate text-[11px] text-[#6E6E73]">
              {user?.email || "Signed in"}
            </span>
          </span>
          <button
            type="button"
            onClick={() => signOut()}
            title="Sign out"
            className="grid h-7 w-7 place-items-center rounded-lg text-[#6E6E73] hover:bg-[#E5E5EA] hover:text-[#FF3B30] transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </aside>
  );
}


