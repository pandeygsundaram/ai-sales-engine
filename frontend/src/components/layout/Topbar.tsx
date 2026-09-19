import { Bell, Search } from "lucide-react";

export function Topbar() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-6">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-96">
          <Search className="absolute left-2.5 top-2.5 size-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search leads, calls, or companies..."
            className="h-9 w-full rounded-md border border-zinc-800 bg-zinc-900 pl-9 pr-4 text-sm text-zinc-300 placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-zinc-400 font-medium tracking-tight">System Online</span>
        </div>
      </div>
    </header>
  );
}
