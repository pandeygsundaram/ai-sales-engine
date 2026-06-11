export type LeadState = 
  | "pending"
  | "calling"
  | "hot"
  | "warm"
  | "cold"
  | "lost"
  | "booked"
  | "dnc";

export type LeadSource = "csv" | "json" | "manual";

export interface Lead {
  id: string;
  name: string | null;
  phone: string;
  email: string | null;
  company: string | null;
  state: LeadState;
  state_reason: string | null;
  call_attempts: number;
  last_called_at: string | null;
  call_transcript: string | null;
  call_summary: string | null;
  vapi_call_id: string | null;
  whatsapp_opted_in: boolean;
  whatsapp_last_message_at: string | null;
  whatsapp_sequence_step: number;
  meeting_scheduled_at: string | null;
  calcom_booking_id: string | null;
  preferred_time: string | null;
  source: LeadSource;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityEvent {
  id: string;
  lead_id: string;
  lead_name: string | null;
  lead_phone: string;
  type: "ingested" | "call_placed" | "call_completed" | "whatsapp_sent" | "meeting_booked";
  description: string;
  timestamp: string;
}
