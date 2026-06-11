import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { ActivityEvent } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "motion/react";
import { Phone, MessageSquare, CalendarCheck, UserPlus, CheckCircle2 } from "lucide-react";

export function Activity() {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);

  useEffect(() => {
    // Initial fetch
    api.getActivities().then(setActivities);

    // Polling simulation (every 5s)
    const interval = setInterval(() => {
      api.getActivities().then(setActivities);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getEventIcon = (type: string) => {
    switch (type) {
      case "ingested": return <UserPlus className="size-4 text-zinc-400" />;
      case "call_placed": return <Phone className="size-4 text-amber-400" />;
      case "call_completed": return <CheckCircle2 className="size-4 text-blue-400" />;
      case "whatsapp_sent": return <MessageSquare className="size-4 text-emerald-400" />;
      case "meeting_booked": return <CalendarCheck className="size-4 text-emerald-500" />;
      default: return <div className="size-2 rounded-full bg-zinc-500" />;
    }
  };

  const getEventBg = (type: string) => {
    switch (type) {
      case "ingested": return "bg-zinc-800/50 border-zinc-700/50";
      case "call_placed": return "bg-amber-500/10 border-amber-500/20";
      case "call_completed": return "bg-blue-500/10 border-blue-500/20";
      case "whatsapp_sent": return "bg-emerald-500/10 border-emerald-500/20";
      case "meeting_booked": return "bg-emerald-500/20 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]";
      default: return "bg-zinc-800/50 border-zinc-700/50";
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Live Activity</h1>
          <p className="text-sm text-zinc-400 mt-1">Real-time feed of AI agent operations.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
          <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Live</span>
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence initial={false}>
          {activities.map((activity) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className={`p-4 rounded-xl border flex items-start gap-4 ${getEventBg(activity.type)}`}
            >
              <div className="mt-1 bg-zinc-950 p-2 rounded-full border border-zinc-800 shadow-sm">
                {getEventIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-sm font-medium text-white truncate">
                    {activity.lead_name || activity.lead_phone}
                  </p>
                  <span className="text-xs text-zinc-500 whitespace-nowrap">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-zinc-300">{activity.description}</p>
                <p className="text-xs text-zinc-500 font-mono mt-2">{activity.lead_phone}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {activities.length === 0 && (
          <div className="text-center py-12 text-zinc-500">
            Waiting for activity...
          </div>
        )}
      </div>
    </div>
  );
}
