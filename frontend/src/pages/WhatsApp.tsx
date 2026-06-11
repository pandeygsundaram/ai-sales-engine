import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Lead } from "@/lib/types";
import { MessageCircle, Send, Check, CheckCheck, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const SEQUENCE_STEPS = [
  { step: 0, label: "Day 0 — Intro Message" },
  { step: 1, label: "Day 3 — Follow up" },
  { step: 2, label: "Day 7 — Case study" },
  { step: 3, label: "Day 14 — Last touch" },
];

export function WhatsApp() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [triggering, setTriggering] = useState(false);

  useEffect(() => {
    api.getLeads().then((data) => {
      // Fetch warm leads or leads that opted in
      setLeads(data.filter(l => l.state === "warm" || l.whatsapp_opted_in));
    });
  }, []);

  const handleTrigger = async (sequence: "hot" | "warm" | "cold") => {
    if (!selectedLead) return;
    setTriggering(true);
    await api.triggerWhatsApp(selectedLead.id, sequence);
    // Optimistic update
    setSelectedLead({ ...selectedLead, whatsapp_sequence_step: Math.min(selectedLead.whatsapp_sequence_step + 1, 3) });
    setTriggering(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">WhatsApp Automation</h1>
        <p className="text-sm text-zinc-400 mt-1">Manage drip campaigns and monitor conversations.</p>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
        {/* Leads List */}
        <div className="col-span-1 rounded-xl border border-zinc-800 bg-zinc-900/50 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-zinc-800 bg-zinc-900/80">
            <h2 className="font-semibold text-white">Active Campaigns</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {leads.map((lead) => (
              <button
                key={lead.id}
                onClick={() => setSelectedLead(lead)}
                className={`w-full text-left p-3 rounded-lg transition-colors flex items-start gap-3 ${
                  selectedLead?.id === lead.id ? "bg-zinc-800" : "hover:bg-zinc-800/50"
                }`}
              >
                <div className="mt-0.5">
                  <div className={`size-2.5 rounded-full ${lead.whatsapp_opted_in ? 'bg-emerald-500' : 'bg-zinc-600'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{lead.name || lead.phone}</p>
                  <p className="text-xs text-zinc-400 truncate">Step {lead.whatsapp_sequence_step}: {SEQUENCE_STEPS[lead.whatsapp_sequence_step]?.label}</p>
                </div>
              </button>
            ))}
            {leads.length === 0 && (
              <p className="text-sm text-zinc-500 text-center py-8">No active WhatsApp campaigns.</p>
            )}
          </div>
        </div>

        {/* Chat/Sequence View */}
        <div className="col-span-1 md:col-span-2 rounded-xl border border-zinc-800 bg-zinc-900/50 flex flex-col overflow-hidden">
          {selectedLead ? (
            <>
              <div className="p-4 border-b border-zinc-800 bg-zinc-900/80 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-white">{selectedLead.name || selectedLead.phone}</h2>
                  <p className="text-xs text-zinc-400 flex items-center gap-1">
                    {selectedLead.whatsapp_opted_in ? (
                      <><CheckCheck className="size-3 text-emerald-400" /> Opted In</>
                    ) : (
                      <><Clock className="size-3" /> Pending Opt-in</>
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleTrigger("warm")}
                    disabled={triggering}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 text-xs font-semibold rounded-md transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Send className="size-3" /> Trigger Next Step
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#0b141a]">
                {/* Simulated Chat History based on sequence step */}
                {SEQUENCE_STEPS.slice(0, selectedLead.whatsapp_sequence_step + 1).map((step, idx) => (
                  <div key={step.step} className="flex flex-col gap-1 max-w-[80%] ml-auto">
                    <div className="bg-[#005c4b] text-[#e9edef] p-3 rounded-lg rounded-tr-none text-sm shadow-sm">
                      <p className="mb-1 text-xs text-emerald-200/70 font-mono">{step.label}</p>
                      <p>Hi {selectedLead.name?.split(' ')[0] || 'there'}, this is an automated message for {step.label.toLowerCase()}.</p>
                      <div className="flex items-center justify-end gap-1 mt-1">
                        <span className="text-[10px] text-emerald-200/50">
                          {idx === selectedLead.whatsapp_sequence_step && selectedLead.whatsapp_last_message_at 
                            ? formatDistanceToNow(new Date(selectedLead.whatsapp_last_message_at), { addSuffix: true })
                            : "Sent"}
                        </span>
                        <CheckCheck className={`size-3 ${selectedLead.whatsapp_opted_in ? 'text-[#53bdeb]' : 'text-emerald-200/50'}`} />
                      </div>
                    </div>
                  </div>
                ))}
                {selectedLead.whatsapp_opted_in && selectedLead.whatsapp_sequence_step > 0 && (
                  <div className="flex flex-col gap-1 max-w-[80%] mr-auto">
                    <div className="bg-[#202c33] text-[#e9edef] p-3 rounded-lg rounded-tl-none text-sm shadow-sm">
                      <p>Thanks for the information. Let's schedule a call.</p>
                      <div className="flex items-center justify-end gap-1 mt-1">
                        <span className="text-[10px] text-zinc-500">Replied</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
              <MessageCircle className="size-12 mb-4 opacity-20" />
              <p>Select a lead to view WhatsApp sequence</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
