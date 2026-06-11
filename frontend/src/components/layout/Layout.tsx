import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function Layout() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-zinc-950 text-zinc-50 font-sans selection:bg-emerald-500/30">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto bg-zinc-950/50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
