import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import logo from "@/assets/ccb-logo.png";
import { AppSidebar } from "@/components/app/app-sidebar";
import { Dashboard } from "@/pages/Dashboard";
import { DeptEntryPage } from "@/pages/DeptEntryPage";
import { LogEntryPage } from "@/pages/LogEntryPage";
import { JobOrdersPage } from "@/pages/JobOrdersPage";
import { BackjobPage } from "@/pages/BackjobPage";
import { BrandSummaryPage } from "@/pages/BrandSummaryPage";
import { LoginPage } from "@/pages/LoginPage";
import { PendingApprovalPage } from "@/pages/PendingApprovalPage";
import { AdminAccessRequestsPage } from "@/pages/AdminAccessRequestsPage";
import { useAuth } from "@/hooks/useAuth";
import type { StationId } from "@/types/tracker";

// ── Simple hash router ────────────────────────────────────────────────────────
const DEPT_ROUTES: Record<string, StationId> = {
  "#/ctc1":      "CTC1",
  "#/ctc2":      "CTC2",
  "#/hotworks":  "Hotworks",
  "#/painting":  "Painting",
  "#/cosmetics": "Cosmetics",
};

function useHashRoute() {
  const [hash, setHash] = useState(() => window.location.hash || "#/");
  useEffect(() => {
    const handler = () => setHash(window.location.hash || "#/");
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);
  return hash;
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const { user, isApproved, role, loading } = useAuth();
  const hash = useHashRoute();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Close mobile navigation drawer on route change
  useEffect(() => {
    setMobileNavOpen(false);
  }, [hash]);

  // Show loading indicator while checking auth state & user record
  if (loading) {
    return (
      <div className="grid h-screen w-screen place-items-center bg-[#F5F5F7]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0071E3] border-t-transparent"></div>
          <p className="text-[14px] font-medium text-[#6E6E73]">Checking account status...</p>
        </div>
      </div>
    );
  }

  // Protect application: If user is not authenticated, show Login Page
  if (!user) {
    return <LoginPage />;
  }

  // Protect application: If user is authenticated but users/{uid} doc does NOT exist -> PendingApprovalPage
  if (!isApproved) {
    return <PendingApprovalPage />;
  }

  // If authenticated and visiting #/auth or #/login, fallback to dashboard
  if (hash === "#/auth" || hash === "#/login") {
    window.location.hash = "#/";
  }

  // Derive activePath for the sidebar highlight
  const activePath = hash.replace(/^#/, "") || "/";

  // Render the correct page
  let page: React.ReactNode;
  if (hash === "#/" || hash === "#" || hash === "#/auth" || hash === "#/login") {
    page = <Dashboard />;
  } else if (hash === "#/entry") {
    page = <LogEntryPage />;
  } else if (hash === "#/job-orders") {
    page = <JobOrdersPage />;
  } else if (hash === "#/backjob" || hash === "#/backjobs") {
    page = <BackjobPage />;
  } else if (hash === "#/brand-summary" || hash === "#/brands") {
    page = <BrandSummaryPage />;
  } else if (hash === "#/access-requests" || hash === "#/admin/access-requests") {
    page = <AdminAccessRequestsPage />;
  } else if (DEPT_ROUTES[hash]) {
    page = <DeptEntryPage stationId={DEPT_ROUTES[hash]} />;
  } else {
    // Fallback for unbuilt pages (Tracking, Reports, etc.)
    page = (
      <div className="grid h-full place-items-center text-[#6E6E73]">
        <div className="text-center">
          <p className="text-[32px]">🚧</p>
          <p className="mt-2 text-[15px] font-medium text-[#1D1D1F]">Page coming soon</p>
          <p className="mt-1 text-[13px] text-[#6E6E73]">This section is under construction.</p>
          <a href="#/" className="btn-primary mt-6 inline-flex">Go to Dashboard</a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden flex-col lg:flex-row bg-[#F5F5F7]">
      {/* Mobile Top Navigation Header */}
      <header className="flex h-14 w-full items-center justify-between border-b border-[#D2D2D7] bg-white px-4 shrink-0 lg:hidden z-30">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="grid h-9 w-9 place-items-center rounded-lg text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors cursor-pointer"
            aria-label="Open Navigation Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-[#0071E3]/10">
              <img src={logo} alt="CCB Logo" className="h-5 w-5 object-contain" />
            </span>
            <span className="text-[14px] font-bold text-[#1D1D1F] tracking-tight">CCB Management System</span>
          </div>
        </div>
      </header>

      {/* App Sidebar Component */}
      <AppSidebar
        activePath={activePath}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      {/* Main Workspace Area */}
      <main className="flex flex-1 flex-col overflow-y-auto bg-[#F5F5F7]">
        {page}
      </main>
    </div>
  );
}

