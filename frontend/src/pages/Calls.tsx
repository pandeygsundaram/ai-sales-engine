import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Lead } from "@/lib/types";
import { Phone, RefreshCw, ChevronDown, ChevronUp, ExternalLink, PhoneOff, StopCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "motion/react";

export function Calls() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activeCalls, setActiveCalls] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [stopping, setStopping] = useState<string | null>(null);
  const [stoppingAll, setStoppingAll] = useState(false);

  const fetchData = () => {
    api.getLeads().then((data) => {
      setLeads(data.filter(l => l.last_called_at !== null || l.state === 'calling'));
    });
    api.getActiveCalls().then(setActiveCalls);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => api.getActiveCalls().then(setActiveCalls), 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRetry = async (id: string) => {
    setRetrying(id);
    await api.retryCall(id);
    setRetrying(null);
  };

  const handleStopCall = async (callSid: string) => {
    setStopping(callSid);
    await api.stopCall(callSid);
    setActiveCalls(prev => prev.filter(c => c.call_sid !== callSid));
    setStopping(null);
  };

  const handleStopAll = async () => {
    setStoppingAll(true);
    await api.stopAllCalls();
    setActiveCalls([]);
    setStoppingAll(false);
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case "hot": return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
      case "warm": return "text-amber-400 bg-amber-400/10 border-amber-400/20";
      case "cold": return "text-blue-400 bg-blue-400/10 border-blue-400/20";
      case "lost": return "text-red-400 bg-red-400/10 border-red-400/20";
      case "calling": return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20 animate-pulse";
      default: return "text-zinc-400 bg-zinc-800 border-zinc-700";
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Call Logs</h1>
          <p className="text-sm text-zinc-400 mt-1">Monitor live calls and review past transcripts.</p>
        </div>
        <button onClick={fetchData} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
          <RefreshCw className="size-4" />
        </button>
      </div>

      {/* Live Calls Panel */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-sm font-semibold text-white">Live Calls</h2>
            <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">{activeCalls.length} active</span>
          </div>
          {activeCalls.length > 0 && (
            <button
              onClick={handleStopAll}
              disabled={stoppingAll}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg hover:bg-red-400/20 transition-colors disabled:opacity-50"
            >
              <StopCircle className="size-3.5" />
              {stoppingAll ? "Stopping..." : "Stop All"}
            </button>
          )}
        </div>

        {activeCalls.length === 0 ? (
          <p className="text-sm text-zinc-500 text-center py-4">No active calls right now.</p>
        ) : (
          <div className="space-y-2">
            {activeCalls.map((call) => (
              <div key={call.call_sid} className="flex items-center justify-between bg-zinc-800/50 rounded-lg px-4 py-3 border border-zinc-700/50">
                <div className="flex items-center gap-3">
                  <Phone className="size-4 text-yellow-400 animate-pulse" />
                  <div>
                    <div className="text-sm font-medium text-white">{call.lead_name || call.to}</div>
                    <div className="text-xs text-zinc-500">{call.lead_company || call.to} · {call.call_sid}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-zinc-400">{call.status}</span>
                  <button
                    onClick={() => handleStopCall(call.call_sid)}
                    disabled={stopping === call.call_sid}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg hover:bg-red-400/20 transition-colors disabled:opacity-50"
                  >
                    <PhoneOff className="size-3" />
                    {stopping === call.call_sid ? "..." : "End"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-400">
            <thead className="bg-zinc-900/80 text-xs uppercase text-zinc-500 border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-medium">Lead</th>
                <th className="px-6 py-4 font-medium">Phone</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Outcome</th>
                <th className="px-6 py-4 font-medium">Attempts</th>
                <th className="px-6 py-4 font-medium">Last Called</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {leads.map((lead) => (
                <React.Fragment key={lead.id}>
                  <tr className="hover:bg-zinc-800/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{lead.name || "Unknown"}</div>
                      <div className="text-xs text-zinc-500">{lead.company || "-"}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">{lead.phone}</td>
                    <td className="px-6 py-4">
                      {lead.state === "calling" ? (
                        <span className="flex items-center gap-1.5 text-yellow-400 text-xs font-medium">
                          <Phone className="size-3 animate-pulse" /> Ringing
                        </span>
                      ) : (
                        <span className="text-emerald-400 text-xs font-medium">Completed</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStateColor(lead.state)}`}>
                        {lead.state.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">{lead.call_attempts}</td>
                    <td className="px-6 py-4 text-xs">
                      {lead.last_called_at ? formatDistanceToNow(new Date(lead.last_called_at), { addSuffix: true }) : "-"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleRetry(lead.id)}
                          disabled={retrying === lead.id || lead.state === "calling"}
                          className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded disabled:opacity-50 transition-colors"
                          title="Retry Call"
                        >
                          <RefreshCw className={`size-4 ${retrying === lead.id ? "animate-spin" : ""}`} />
                        </button>
                        <button
                          onClick={() => setExpandedId(expandedId === lead.id ? null : lead.id)}
                          className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                        >
                          {expandedId === lead.id ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                  <AnimatePresence>
                    {expandedId === lead.id && (
                      <tr>
                        <td colSpan={7} className="p-0">
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden bg-zinc-950/50 border-b border-zinc-800"
                          >
                            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                              <div className="lg:col-span-2 space-y-4">
                                <div>
                                  <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Transcript</h4>
                                  <div className="bg-zinc-900 rounded-md p-4 text-sm text-zinc-300 font-mono whitespace-pre-wrap h-48 overflow-y-auto border border-zinc-800">
                                    {lead.call_transcript || "No transcript available."}
                                  </div>
                                </div>
                                <div>
                                  <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Summary</h4>
                                  <p className="text-sm text-zinc-300 bg-zinc-900/50 p-3 rounded-md border border-zinc-800/50">
                                    {lead.call_summary || "No summary available."}
                                  </p>
                                </div>
                              </div>
                              <div className="space-y-4">
                                <div>
                                  <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Structured Data</h4>
                                  <div className="bg-zinc-900 rounded-md p-4 border border-zinc-800 space-y-3 text-sm">
                                    <div>
                                      <span className="text-zinc-500 block text-xs mb-1">State Reason</span>
                                      <span className="text-zinc-200">{lead.state_reason || "-"}</span>
                                    </div>
                                    <div>
                                      <span className="text-zinc-500 block text-xs mb-1">Preferred Time</span>
                                      <span className="text-zinc-200">{lead.preferred_time || "-"}</span>
                                    </div>
                                    <div>
                                      <span className="text-zinc-500 block text-xs mb-1">Notes</span>
                                      <span className="text-zinc-200">{lead.notes || "-"}</span>
                                    </div>
                                  </div>
                                </div>
                                {lead.vapi_call_id && (
                                  <div>
                                    <a href={`https://dashboard.vapi.ai/calls/${lead.vapi_call_id}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
                                      View in Vapi <ExternalLink className="size-3" />
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              ))}
              {leads.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-zinc-500">
                    No calls found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
