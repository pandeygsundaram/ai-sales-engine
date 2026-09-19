import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, PhoneCall, MessageSquare, Users, CalendarCheck, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Calls", href: "/calls", icon: PhoneCall },
  { name: "WhatsApp", href: "/whatsapp", icon: MessageSquare },
  { name: "Leads", href: "/leads", icon: Users },
  { name: "Bookings", href: "/bookings", icon: CalendarCheck },
];

export function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();

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

      {/* User Profile Footer */}
      <div className="p-3 border-t border-zinc-800 bg-zinc-900/40">
        {user ? (
          <div className="flex items-center justify-between gap-2 p-1.5 rounded-lg">
            <div className="flex items-center gap-2.5 min-w-0">
              {user.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="size-8 rounded-full border border-zinc-700 object-cover shrink-0"
                />
              ) : (
                <div className="size-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-xs font-bold text-emerald-400 shrink-0">
                  {user.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-white truncate">{user.name}</span>
                <span className="text-[10px] text-zinc-400 truncate">{user.email}</span>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-md transition-colors shrink-0"
            >
              <LogOut className="size-3.5" />
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-emerald-400 hover:bg-zinc-800 rounded-md transition-colors"
          >
            <User className="size-4" /> Sign In
          </Link>
        )}
      </div>
    </div>
  );
}
