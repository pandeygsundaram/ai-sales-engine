import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Lead, ActivityEvent } from "@/lib/types";
import { PhoneCall, Flame, CalendarCheck, Percent, ArrowUpRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "motion/react";

export function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);

  useEffect(() => {
    api.getLeads().then(setLeads);
    api.getActivities().then(setActivities);
  }, []);

  const totalCalls = leads.reduce((acc, lead) => acc + lead.call_attempts, 0);
  const qualifiedLeads = leads.filter((l) => l.state === "hot" || l.state === "warm").length;
  const meetingsBooked = leads.filter((l) => l.state === "booked" || l.meeting_scheduled_at).length;
  const conversionRate = leads.length > 0 ? ((meetingsBooked / leads.length) * 100).toFixed(1) : "0.0";

  const stats = [
    { name: "Total Calls Today", value: totalCalls, icon: PhoneCall, trend: "+12%" },
    { name: "Qualified Leads", value: qualifiedLeads, icon: Flame, trend: "+4%" },
    { name: "Meetings Booked", value: meetingsBooked, icon: CalendarCheck, trend: "+2" },
    { name: "Conversion Rate", value: `${conversionRate}%`, icon: Percent, trend: "+1.2%" },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard</h1>
        <p className="text-sm text-zinc-400 mt-1">Overview of your AI sales agent's performance.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-zinc-400">{stat.name}</p>
              <stat.icon className="size-4 text-zinc-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-3xl font-semibold text-white">{stat.value}</p>
              <span className="flex items-center text-xs font-medium text-emerald-400">
                <ArrowUpRight className="size-3 mr-0.5" />
                {stat.trend}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Qualified Leads</h2>
          <div className="space-y-4">
            {leads.filter(l => l.state === "hot" || l.state === "warm").slice(0, 5).map((lead) => (
              <div key={lead.id} className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/30 border border-zinc-800/50">
                <div>
                  <p className="font-medium text-white">{lead.name || "Unknown"}</p>
                  <p className="text-sm text-zinc-400">{lead.company || "No Company"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    lead.state === 'hot' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {lead.state.toUpperCase()}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {lead.last_called_at ? formatDistanceToNow(new Date(lead.last_called_at), { addSuffix: true }) : 'Never'}
                  </span>
                </div>
              </div>
            ))}
            {leads.filter(l => l.state === "hot" || l.state === "warm").length === 0 && (
              <p className="text-sm text-zinc-500 text-center py-8">No qualified leads yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Live Activity</h2>
            <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {activities.slice(0, 8).map((activity) => (
              <div key={activity.id} className="flex gap-3">
                <div className="mt-1">
                  <div className={`size-2 rounded-full ${
                    activity.type === 'meeting_booked' ? 'bg-emerald-500' :
                    activity.type === 'call_completed' ? 'bg-blue-500' :
                    activity.type === 'whatsapp_sent' ? 'bg-green-500' :
                    activity.type === 'call_placed' ? 'bg-amber-500' :
                    'bg-zinc-500'
                  }`} />
                </div>
                <div>
                  <p className="text-sm text-zinc-300">{activity.description}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
