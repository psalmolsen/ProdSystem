import { AppSidebar } from "@/components/app/app-sidebar";
import { Dashboard } from "@/pages/Dashboard";

export default function App() {
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <AppSidebar activePath="/" />
      <main className="flex flex-1 flex-col overflow-hidden">
        <Dashboard />
      </main>
    </div>
  );
}
