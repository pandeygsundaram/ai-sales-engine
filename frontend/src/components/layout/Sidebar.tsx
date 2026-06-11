import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, PhoneCall, MessageSquare, Users, Megaphone, CalendarCheck, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Calls", href: "/calls", icon: PhoneCall },
  { name: "WhatsApp", href: "/whatsapp", icon: MessageSquare },
  { name: "Leads", href: "/leads", icon: Users },
  { name: "Campaigns", href: "/campaigns", icon: Megaphone },
  { name: "Bookings", href: "/bookings", icon: CalendarCheck },
  { name: "Activity", href: "/activity", icon: Activity },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <div className="flex h-full w-64 flex-col border-r border-zinc-800 bg-zinc-950 text-zinc-300">
      <div className="flex h-16 items-center px-6 border-b border-zinc-800">
        <div className="flex items-center gap-2 font-bold text-white tracking-tight text-lg">
          <div className="size-6 rounded bg-emerald-500 flex items-center justify-center">
            <span className="text-zinc-950 text-xs font-black">AI</span>
          </div>
          SalesAgent
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
              )}
            >
              <item.icon className={cn("size-4", isActive ? "text-emerald-400" : "text-zinc-500")} />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-medium text-white">
            JD
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-white">John Doe</span>
            <span className="text-xs text-zinc-500">Admin</span>
          </div>
        </div>
      </div>
    </div>
  );
}
