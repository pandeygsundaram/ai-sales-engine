import React, { useEffect, useState, useRef, useCallback } from "react";
import { api } from "@/lib/api";
import { Lead } from "@/lib/types";
import { MessageCircle, Send, CheckCheck, Clock, RefreshCw, Phone, Sparkles } from "lucide-react";
import { format } from "date-fns";

interface WhatsAppMessage {
  sid: string;
  direction: "outbound" | "inbound";
  from: string;
  to: string;
  body: string;
  status: string;
  date_sent: string;
  timestamp: string;
}

export function WhatsApp() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchLeads = useCallback(async () => {
    const data = await api.getLeads();
    setLeads(data);
    if (data.length > 0 && !selectedLead) {
      setSelectedLead(data[0]);
    }
  }, [selectedLead]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const loadMessages = useCallback(async (phone: string) => {
    setLoadingMessages(true);
    try {
      const msgs = await api.getWhatsAppMessages(phone);
      setMessages(msgs);
    } catch (err) {
      console.error("Failed to load WhatsApp messages:", err);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // When selected lead changes, load their real messages
  useEffect(() => {
    if (selectedLead?.phone) {
      loadMessages(selectedLead.phone);
    } else {
      setMessages([]);
    }
  }, [selectedLead, loadMessages]);

  // Auto-refresh chat history every 4 seconds
  useEffect(() => {
    if (!selectedLead?.phone) return;
    const interval = setInterval(() => {
      api.getWhatsAppMessages(selectedLead.phone).then((msgs) => {
        setMessages((prev) => {
          if (msgs.length !== prev.length || (msgs.length > 0 && msgs[msgs.length - 1].sid !== prev[prev.length - 1]?.sid)) {
            return msgs;
          }
          return prev;
        });
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [selectedLead]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedLead) return;
    const text = inputText.trim();
    setInputText("");
    setSending(true);

    try {
      await api.sendWhatsAppMessage(selectedLead.phone, text);
      // Immediately refresh messages
      await loadMessages(selectedLead.phone);
    } catch (err) {
      alert("Failed to send WhatsApp message");
    } finally {
      setSending(false);
    }
  };

  const handleTrigger = async (sequence: "hot" | "warm" | "cold") => {
    if (!selectedLead) return;
    setTriggering(true);
    try {
      await api.triggerWhatsApp(selectedLead.id, sequence);
      setTimeout(() => {
        loadMessages(selectedLead.phone);
      }, 1500);
    } finally {
      setTriggering(false);
    }
  };

  const formatMessageTime = (isoString?: string) => {
    if (!isoString) return "";
    try {
      return format(new Date(isoString), "h:mm a");
    } catch {
      return "";
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">WhatsApp Conversations</h1>
          <p className="text-sm text-zinc-400 mt-1">Live, bidirectional WhatsApp conversations powered by Twilio & Groq AI.</p>
        </div>
        {selectedLead && (
          <button
            onClick={() => loadMessages(selectedLead.phone)}
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-lg transition-colors border border-zinc-700"
          >
            <RefreshCw className={`size-3.5 ${loadingMessages ? 'animate-spin' : ''}`} /> Refresh Chat
          </button>
        )}
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
        {/* Leads Conversation List */}
        <div className="col-span-1 rounded-xl border border-zinc-800 bg-zinc-900/50 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-zinc-800 bg-zinc-900/80 flex items-center justify-between">
            <h2 className="font-semibold text-white">Conversations</h2>
            <span className="text-xs text-zinc-500">{leads.length} contacts</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {leads.map((lead) => (
              <button
                key={lead.id}
                onClick={() => setSelectedLead(lead)}
                className={`w-full text-left p-3 rounded-lg transition-colors flex items-start gap-3 ${
                  selectedLead?.id === lead.id ? "bg-zinc-800 border border-zinc-700" : "hover:bg-zinc-800/50 border border-transparent"
                }`}
              >
                <div className="size-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-emerald-400">
                    {(lead.name || lead.phone).slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-sm font-medium text-white truncate">{lead.name || lead.phone}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase ${
                      lead.state === 'hot' ? 'bg-emerald-500/10 text-emerald-400' :
                      lead.state === 'warm' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-zinc-800 text-zinc-400'
                    }`}>
                      {lead.state || 'lead'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 font-mono truncate">{lead.phone}</p>
                  {lead.company && <p className="text-[11px] text-zinc-500 truncate">{lead.company}</p>}
                </div>
              </button>
            ))}
            {leads.length === 0 && (
              <div className="p-8 text-center text-zinc-500 text-sm">
                No leads found. Ingest or place a demo call first.
              </div>
            )}
          </div>
        </div>

        {/* Real-time WhatsApp Chat Window */}
        <div className="col-span-1 md:col-span-2 rounded-xl border border-zinc-800 bg-zinc-900/50 flex flex-col overflow-hidden">
          {selectedLead ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-zinc-800 bg-zinc-900/90 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                    <span className="text-sm font-bold text-emerald-400">
                      {(selectedLead.name || selectedLead.phone).slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h2 className="font-semibold text-white flex items-center gap-2">
                      {selectedLead.name || selectedLead.phone}
                      {selectedLead.company && <span className="text-xs font-normal text-zinc-400">({selectedLead.company})</span>}
                    </h2>
                    <p className="text-xs text-zinc-400 font-mono flex items-center gap-1.5">
                      <Phone className="size-3 text-emerald-400" /> {selectedLead.phone}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTrigger("hot")}
                    disabled={triggering}
                    className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5"
                  >
                    <Sparkles className="size-3" /> Send Demo Link
                  </button>
                </div>
              </div>

              {/* Chat Message Bubble Feed */}
              <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-[#0b141a]">
                {messages.map((m) => {
                  const isOutbound = m.direction === "outbound";
                  return (
                    <div
                      key={m.sid}
                      className={`flex flex-col max-w-[78%] ${isOutbound ? "ml-auto items-end" : "mr-auto items-start"}`}
                    >
                      <div
                        className={`p-3 rounded-2xl text-sm shadow-md whitespace-pre-wrap break-words ${
                          isOutbound
                            ? "bg-[#005c4b] text-[#e9edef] rounded-tr-xs"
                            : "bg-[#202c33] text-[#e9edef] rounded-tl-xs"
                        }`}
                      >
                        <p className="leading-relaxed text-[13px]">{m.body}</p>
                        <div className={`flex items-center gap-1 mt-1.5 ${isOutbound ? "justify-end" : "justify-start"}`}>
                          <span className="text-[10px] text-zinc-400">
                            {formatMessageTime(m.timestamp)}
                          </span>
                          {isOutbound && (
                            <CheckCheck className="size-3.5 text-[#53bdeb]" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {messages.length === 0 && !loadingMessages && (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-500 py-12 space-y-2">
                    <MessageCircle className="size-10 text-zinc-600" />
                    <p className="text-sm">No WhatsApp messages exchanged with {selectedLead.name || selectedLead.phone} yet.</p>
                    <p className="text-xs text-zinc-600">Messages will appear here as soon as the post-call sequence sends or when you type below.</p>
                  </div>
                )}

                {loadingMessages && messages.length === 0 && (
                  <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
                    Loading conversation...
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleSendMessage} className="p-3 bg-zinc-900 border-t border-zinc-800 flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Message ${selectedLead.name || selectedLead.phone} on WhatsApp...`}
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  disabled={sending || !inputText.trim()}
                  className="p-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-zinc-950 rounded-lg transition-colors flex items-center justify-center shrink-0"
                >
                  <Send className="size-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
              <MessageCircle className="size-12 mb-4 opacity-20" />
              <p className="text-sm font-medium">Select a contact to view live WhatsApp messages</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
