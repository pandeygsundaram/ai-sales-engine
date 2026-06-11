import { Lead, ActivityEvent } from "./types";
import { mockLeads, mockActivities } from "./mock-data";

const API_BASE_URL = "http://localhost:8000";
const USE_MOCK = false;

// Helper to simulate network delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const api = {
  async getLeads(params?: { state?: string; skip?: number; limit?: number }): Promise<Lead[]> {
    if (USE_MOCK) {
      await delay(500);
      let filtered = [...mockLeads];
      if (params?.state) {
        const states = params.state.split("|");
        filtered = filtered.filter((l) => states.includes(l.state));
      }
      const skip = params?.skip || 0;
      const limit = params?.limit || 50;
      return filtered.slice(skip, skip + limit);
    }
    
    const url = new URL(`${API_BASE_URL}/api/leads`);
    if (params?.state) url.searchParams.append("state", params.state);
    if (params?.skip) url.searchParams.append("skip", params.skip.toString());
    if (params?.limit) url.searchParams.append("limit", params.limit.toString());
    
    const res = await fetch(url.toString());
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },

  async getLead(id: string): Promise<Lead | null> {
    if (USE_MOCK) {
      await delay(300);
      return mockLeads.find((l) => l.id === id) || null;
    }
    const res = await fetch(`${API_BASE_URL}/api/leads/${id}`);
    if (!res.ok) return null;
    return res.json();
  },

  async getActivities(): Promise<ActivityEvent[]> {
    if (USE_MOCK) {
      await delay(300);
      return [...mockActivities].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
    // In a real app, this might be a dedicated endpoint or SSE
    const res = await fetch(`${API_BASE_URL}/api/activities`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },

  async retryCall(leadId: string): Promise<void> {
    if (USE_MOCK) {
      await delay(500);
      console.log(`Retrying call for lead ${leadId}`);
      return;
    }
    await fetch(`${API_BASE_URL}/api/calls/${leadId}/retry`, { method: "POST" });
  },

  async triggerWhatsApp(leadId: string, sequence: "hot" | "warm" | "cold"): Promise<void> {
    if (USE_MOCK) {
      await delay(500);
      console.log(`Triggering WhatsApp for lead ${leadId} with sequence ${sequence}`);
      return;
    }
    await fetch(`${API_BASE_URL}/api/whatsapp/trigger`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lead_id: leadId, sequence }),
    });
  },

  async ingestCsv(file: File): Promise<void> {
    if (USE_MOCK) {
      await delay(1000);
      console.log(`Ingested CSV: ${file.name}`);
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    await fetch(`${API_BASE_URL}/api/leads/ingest/csv`, {
      method: "POST",
      body: formData,
    });
  },

  async ingestJson(data: any[]): Promise<void> {
    if (USE_MOCK) {
      await delay(1000);
      console.log(`Ingested JSON with ${data.length} records`);
      return;
    }
    await fetch(`${API_BASE_URL}/api/leads/ingest/json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },

  async launchCampaign(): Promise<{ message: string; queued: number }> {
    if (USE_MOCK) {
      await delay(500);
      return { message: "Campaign launched (mock)", queued: 3 };
    }
    const res = await fetch(`${API_BASE_URL}/api/campaigns/launch`, { method: "POST" });
    return res.json();
  },

  async getCampaignStatus(): Promise<any> {
    if (USE_MOCK) return {};
    const res = await fetch(`${API_BASE_URL}/api/campaigns/status`);
    return res.json();
  },

  async getActiveCalls(): Promise<any[]> {
    if (USE_MOCK) {
      await delay(300);
      return [];
    }
    const res = await fetch(`${API_BASE_URL}/api/calls/active`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },

  async stopCall(callSid: string): Promise<void> {
    if (USE_MOCK) {
      await delay(300);
      return;
    }
    await fetch(`${API_BASE_URL}/api/calls/${callSid}/stop`, { method: "POST" });
  },

  async stopAllCalls(): Promise<void> {
    if (USE_MOCK) {
      await delay(300);
      return;
    }
    await fetch(`${API_BASE_URL}/api/calls/stop-all`, { method: "POST" });
  },

  async updateLead(id: string, data: Partial<{ name: string; email: string; company: string; phone: string; notes: string; state: string }>): Promise<Lead> {
    const res = await fetch(`${API_BASE_URL}/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async deleteLead(id: string): Promise<void> {
    await fetch(`${API_BASE_URL}/api/leads/${id}`, { method: "DELETE" });
  },
};
