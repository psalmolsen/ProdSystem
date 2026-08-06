import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/app/app-sidebar";
import { Dashboard } from "@/pages/Dashboard";
import { DeptEntryPage } from "@/pages/DeptEntryPage";
import { LogEntryPage } from "@/pages/LogEntryPage";
import { JobOrdersPage } from "@/pages/JobOrdersPage";
import { AuthPage } from "@/pages/AuthPage";
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
  const hash = useHashRoute();

  // If visiting #/auth, render full-screen Auth Page
  if (hash === "#/auth") {
    return <AuthPage />;
  }

  // Derive activePath for the sidebar highlight
  const activePath = hash.replace(/^#/, "") || "/";

  // Render the correct page
  let page: React.ReactNode;
  if (hash === "#/" || hash === "#") {
    page = <Dashboard />;
  } else if (hash === "#/entry") {
    page = <LogEntryPage />;
  } else if (hash === "#/job-orders") {
    page = <JobOrdersPage />;
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
    <div className="flex h-screen w-screen overflow-hidden">
      <AppSidebar activePath={activePath} />
      <main className="flex flex-1 flex-col overflow-y-auto bg-[#F5F5F7]">
        {page}
      </main>
    </div>
  );
}
