import React, { useEffect, useState, useRef, useCallback } from "react";
import { api } from "@/lib/api";
import { Lead } from "@/lib/types";
import { Upload, X, Calendar, Phone, Mail, MessageSquare, Clock, FileJson, FileText, Rocket, PhoneCall, Pencil, Trash2, Check } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "motion/react";

export function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [filterState, setFilterState] = useState<string>("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [launching, setLaunching] = useState(false);
  const [launchResult, setLaunchResult] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", email: "", company: "", phone: "", notes: "" });
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchLeads = useCallback(() => {
    api.getLeads(filterState ? { state: filterState } : undefined).then(setLeads);
  }, [filterState]);

  useEffect(() => {
    fetchLeads();
    const interval = setInterval(fetchLeads, 15_000);
    return () => clearInterval(interval);
  }, [fetchLeads]);

  const openDrawer = (lead: Lead) => {
    setSelectedLead(lead);
    setEditing(false);
  };

  const closeDrawer = () => {
    setSelectedLead(null);
    setEditing(false);
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await api.ingestCsv(file);
    setShowUploadModal(false);
    fetchLeads();
  };

  const handleJsonUpload = async () => {
    try {
      const data = JSON.parse(jsonInput);
      await api.ingestJson(data);
      setShowUploadModal(false);
      setJsonInput("");
      fetchLeads();
    } catch {
      alert("Invalid JSON format");
    }
  };

  const handleLaunchCampaign = async () => {
    const pendingCount = leads.filter((l) => l.state === "pending").length;
    if (pendingCount === 0) {
      setLaunchResult("No pending leads to call.");
      setTimeout(() => setLaunchResult(null), 3000);
      return;
    }
    if (!confirm(`Launch campaign and call ${pendingCount} pending leads?`)) return;
    setLaunching(true);
    const result = await api.launchCampaign();
    setLaunchResult(result.message);
    setTimeout(() => setLaunchResult(null), 4000);
    setLaunching(false);
    fetchLeads();
  };

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveEdit = async () => {
    if (!selectedLead) return;
    try {
      const updated = await api.updateLead(selectedLead.id, editForm);
      if (updated?.id) {
        setSelectedLead(updated);
        setEditing(false);
        fetchLeads();
        showToast("Lead updated successfully");
      } else {
        showToast("Failed to save changes", "error");
      }
    } catch {
      showToast("Failed to save changes", "error");
    }
  };

  const handleDelete = async () => {
    if (!selectedLead) return;
    if (!confirm(`Delete ${selectedLead.name || selectedLead.phone}? This cannot be undone.`)) return;
    await api.deleteLead(selectedLead.id);
    closeDrawer();
    fetchLeads();
  };

  const handleRetry = async () => {
    if (!selectedLead) return;
    if (!confirm(`Retry call for ${selectedLead.name || selectedLead.phone}?`)) return;
    setRetrying(true);
    await api.retryCall(selectedLead.id);
    setTimeout(() => {
      fetchLeads();
      setRetrying(false);
    }, 2000);
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case "hot":     return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
      case "warm":    return "text-amber-400 bg-amber-400/10 border-amber-400/20";
      case "cold":    return "text-blue-400 bg-blue-400/10 border-blue-400/20";
      case "lost":    return "text-red-400 bg-red-400/10 border-red-400/20";
      case "booked":  return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
      case "calling": return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20 animate-pulse";
      case "pending": return "text-zinc-400 bg-zinc-800 border-zinc-700";
      case "dnc":     return "text-zinc-500 bg-zinc-900 border-zinc-800";
      default:        return "text-zinc-400 bg-zinc-800 border-zinc-700";
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-sm font-medium shadow-lg ${
              toast.type === "success"
                ? "bg-emerald-500 text-zinc-950"
                : "bg-red-500 text-white"
            }`}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Leads</h1>
          <p className="text-sm text-zinc-400 mt-1">Manage and filter your entire lead database.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filterState}
            onChange={(e) => setFilterState(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 text-sm text-zinc-300 rounded-md px-3 py-2 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="calling">Calling</option>
            <option value="hot">Hot</option>
            <option value="warm">Warm</option>
            <option value="cold">Cold</option>
            <option value="booked">Booked</option>
            <option value="lost">Lost</option>
            <option value="dnc">DNC</option>
          </select>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-md transition-colors border border-zinc-700"
          >
            <Upload className="size-4" /> Import
          </button>
          <button
            onClick={handleLaunchCampaign}
            disabled={launching}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-zinc-950 text-sm font-semibold rounded-md transition-colors"
          >
            <Rocket className="size-4" />
            {launching ? "Launching..." : `Launch Campaign (${leads.filter((l) => l.state === "pending").length} pending)`}
          </button>
        </div>
      </div>

      {launchResult && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm px-4 py-3 rounded-lg shrink-0">
          🚀 {launchResult}
        </div>
      )}

      {/* Table + Drawer */}
      <div className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden flex relative">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-sm text-zinc-400">
            <thead className="bg-zinc-900/80 text-xs uppercase text-zinc-500 border-b border-zinc-800 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Phone</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Company</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Attempts</th>
                <th className="px-6 py-4 font-medium">Source</th>
                <th className="px-6 py-4 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  onClick={() => openDrawer(lead)}
                  className={`hover:bg-zinc-800/40 transition-colors cursor-pointer ${selectedLead?.id === lead.id ? "bg-zinc-800/60" : ""}`}
                >
                  <td className="px-6 py-4 font-medium text-white">{lead.name || "-"}</td>
                  <td className="px-6 py-4 font-mono text-xs">{lead.phone}</td>
                  <td className="px-6 py-4 text-xs text-zinc-400">{lead.email || "-"}</td>
                  <td className="px-6 py-4">{lead.company || "-"}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStateColor(lead.state)}`}>
                      {lead.state?.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">{lead.call_attempts}</td>
                  <td className="px-6 py-4 uppercase text-xs">{lead.source}</td>
                  <td className="px-6 py-4 text-xs">{format(new Date(lead.created_at), "MMM d, yyyy")}</td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-zinc-500">No leads found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Detail Drawer */}
        <AnimatePresence>
          {selectedLead && (
            <motion.div
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-96 border-l border-zinc-800 bg-zinc-950 flex flex-col absolute right-0 top-0 bottom-0 z-20 shadow-2xl"
            >
              {/* Drawer header */}
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50 shrink-0">
                <h3 className="font-semibold text-white">Lead Details</h3>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditForm({
                        name: selectedLead.name || "",
                        email: selectedLead.email || "",
                        company: selectedLead.company || "",
                        phone: selectedLead.phone || "",
                        notes: selectedLead.notes || "",
                      });
                      setEditing(true);
                    }}
                    className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                    title="Edit"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    onClick={handleDelete}
                    className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="size-4" />
                  </button>
                  <button onClick={closeDrawer} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors">
                    <X className="size-4" />
                  </button>
                </div>
              </div>

              {/* Drawer body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {editing ? (
                  /* ── Edit form ── */
                  <div className="space-y-3">
                    {(["name", "email", "company", "phone", "notes"] as const).map((field) => (
                      <div key={field}>
                        <label className="text-xs text-zinc-500 uppercase tracking-wider">{field}</label>
                        <input
                          value={editForm[field]}
                          onChange={(e) => setEditForm({ ...editForm, [field]: e.target.value })}
                          className="mt-1 w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    ))}
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={handleSaveEdit}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 text-sm font-semibold rounded-md"
                      >
                        <Check className="size-4" /> Save
                      </button>
                      <button
                        onClick={() => setEditing(false)}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-md"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── View mode ── */
                  <>
                    <div>
                      <h2 className="text-xl font-bold text-white mb-1">{selectedLead.name || "Unknown Lead"}</h2>
                      <p className="text-sm text-zinc-400">{selectedLead.company || "No Company"}</p>
                      <div className="mt-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStateColor(selectedLead.state)}`}>
                          {selectedLead.state?.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {!["booked", "dnc", "lost"].includes(selectedLead.state) && (
                      <button
                        disabled={retrying}
                        onClick={handleRetry}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-zinc-950 text-sm font-semibold rounded-md transition-colors"
                      >
                        <PhoneCall className="size-4" />
                        {retrying ? "Queuing..." : "Retry Call"}
                      </button>
                    )}

                    <div className="space-y-3 bg-zinc-900/50 p-4 rounded-lg border border-zinc-800/50">
                      <div className="flex items-center gap-3 text-sm">
                        <Phone className="size-4 text-zinc-500" />
                        <span className="text-zinc-300 font-mono">{selectedLead.phone}</span>
                      </div>
                      {selectedLead.email && (
                        <div className="flex items-center gap-3 text-sm">
                          <Mail className="size-4 text-zinc-500" />
                          <span className="text-zinc-300">{selectedLead.email}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-sm">
                        <Clock className="size-4 text-zinc-500" />
                        <span className="text-zinc-300">Created {format(new Date(selectedLead.created_at), "MMM d, yyyy")}</span>
                      </div>
                    </div>

                    {selectedLead.state_reason && (
                      <div>
                        <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">State Reason</h4>
                        <p className="text-sm text-zinc-300 bg-zinc-900 p-3 rounded-md border border-zinc-800">{selectedLead.state_reason}</p>
                      </div>
                    )}

                    <div>
                      <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Timeline</h4>
                      <div className="space-y-3">
                        {selectedLead.last_called_at && (
                          <div className="flex items-center gap-3 p-3 rounded border border-zinc-800 bg-zinc-900/50">
                            <Phone className="size-3.5 text-emerald-500 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium text-zinc-300">Last Called</div>
                              <div className="text-xs text-zinc-500">{format(new Date(selectedLead.last_called_at), "MMM d, h:mm a")} · Attempt {selectedLead.call_attempts}</div>
                            </div>
                          </div>
                        )}
                        {selectedLead.whatsapp_sequence_step > 0 && (
                          <div className="flex items-center gap-3 p-3 rounded border border-zinc-800 bg-zinc-900/50">
                            <MessageSquare className="size-3.5 text-emerald-500 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium text-zinc-300">WhatsApp</div>
                              <div className="text-xs text-zinc-500">Step {selectedLead.whatsapp_sequence_step}</div>
                            </div>
                          </div>
                        )}
                        {selectedLead.meeting_scheduled_at && (
                          <div className="flex items-center gap-3 p-3 rounded border border-zinc-800 bg-zinc-900/50">
                            <Calendar className="size-3.5 text-emerald-500 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium text-zinc-300">Meeting Booked</div>
                              <div className="text-xs text-zinc-500">{format(new Date(selectedLead.meeting_scheduled_at), "MMM d, h:mm a")}</div>
                            </div>
                          </div>
                        )}
                        {!selectedLead.last_called_at && !selectedLead.whatsapp_sequence_step && !selectedLead.meeting_scheduled_at && (
                          <p className="text-xs text-zinc-600 italic">No activity yet.</p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Import Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
                <h3 className="font-semibold text-white">Import Leads</h3>
                <button onClick={() => setShowUploadModal(false)} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors">
                  <X className="size-4" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
                    <FileText className="size-4 text-emerald-400" /> Upload CSV
                  </h4>
                  <div
                    className="border border-dashed border-zinc-700 rounded-lg p-6 text-center hover:bg-zinc-900/50 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="size-6 text-zinc-500 mx-auto mb-2" />
                    <p className="text-sm text-zinc-400">Click to browse or drag and drop</p>
                    <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleCsvUpload} />
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-800" /></div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-zinc-950 px-2 text-zinc-500">Or</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
                    <FileJson className="size-4 text-emerald-400" /> Paste JSON
                  </h4>
                  <textarea
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    placeholder='[{"name": "John", "phone": "+1234567890"}]'
                    className="w-full h-32 bg-zinc-900 border border-zinc-800 rounded-md p-3 text-sm text-zinc-300 font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    onClick={handleJsonUpload}
                    disabled={!jsonInput.trim()}
                    className="mt-3 w-full py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-zinc-950 text-sm font-semibold rounded-md transition-colors"
                  >
                    Import JSON
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
