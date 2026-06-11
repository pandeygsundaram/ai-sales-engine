import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Lead } from "@/lib/types";
import {
  Calendar as CalendarIcon,
  Clock,
  ExternalLink,
  Video,
  Mail,
  Phone,
  Building2,
  CheckCircle2,
  CalendarClock,
  History,
} from "lucide-react";
import { format, isPast, isToday, isTomorrow } from "date-fns";

function formatMeetingDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isToday(d)) return `Today at ${format(d, "h:mm a")}`;
  if (isTomorrow(d)) return `Tomorrow at ${format(d, "h:mm a")}`;
  return format(d, "EEE, MMM d 'at' h:mm a");
}

function BookingCard({ lead }: { lead: Lead }) {
  const isPastMeeting = lead.meeting_scheduled_at
    ? isPast(new Date(lead.meeting_scheduled_at))
    : false;

  return (
    <div
      className={`rounded-xl border bg-zinc-900/50 p-5 flex flex-col hover:border-zinc-600 transition-colors ${
        isPastMeeting ? "border-zinc-800 opacity-60" : "border-zinc-700"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white text-base truncate">
            {lead.name || "Unknown"}
          </h3>
          {lead.company && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <Building2 className="size-3 text-zinc-500 shrink-0" />
              <p className="text-sm text-zinc-400 truncate">{lead.company}</p>
            </div>
          )}
        </div>
        <div
          className={`size-9 rounded-full flex items-center justify-center shrink-0 ml-3 ${
            isPastMeeting
              ? "bg-zinc-800 border border-zinc-700"
              : "bg-emerald-500/10 border border-emerald-500/20"
          }`}
        >
          {isPastMeeting ? (
            <History className="size-4 text-zinc-400" />
          ) : (
            <CalendarIcon className="size-4 text-emerald-400" />
          )}
        </div>
      </div>

      {/* Meeting time */}
      <div className="space-y-2.5 flex-1">
        <div className="flex items-center gap-2.5 text-sm">
          <Clock className="size-4 text-zinc-500 shrink-0" />
          <span
            className={`font-medium ${
              isPastMeeting ? "text-zinc-400" : "text-zinc-100"
            }`}
          >
            {lead.meeting_scheduled_at
              ? formatMeetingDate(lead.meeting_scheduled_at)
              : lead.preferred_time
              ? `Prefers: ${lead.preferred_time}`
              : "Time TBD"}
          </span>
        </div>

        {lead.email && (
          <div className="flex items-center gap-2.5 text-sm">
            <Mail className="size-4 text-zinc-500 shrink-0" />
            <span className="text-zinc-400 truncate">{lead.email}</span>
          </div>
        )}

        <div className="flex items-center gap-2.5 text-sm">
          <Phone className="size-4 text-zinc-500 shrink-0" />
          <span className="text-zinc-400 font-mono">{lead.phone}</span>
        </div>

        {lead.call_summary && (
          <p className="text-xs text-zinc-500 mt-2 line-clamp-2 italic">
            "{lead.call_summary}"
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between gap-2">
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            isPastMeeting
              ? "bg-zinc-800 text-zinc-400"
              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
          }`}
        >
          {isPastMeeting ? "Completed" : "Upcoming"}
        </span>

        {lead.calcom_booking_id && (
          <a
            href={`https://app.cal.com/bookings/${lead.calcom_booking_id}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <Video className="size-3" /> View Booking
          </a>
        )}
      </div>
    </div>
  );
}

export function Bookings() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    const booked = await api.getLeads({ state: "booked", limit: 100 });
    booked.sort((a, b) => {
      if (!a.meeting_scheduled_at) return 1;
      if (!b.meeting_scheduled_at) return -1;
      return (
        new Date(a.meeting_scheduled_at).getTime() -
        new Date(b.meeting_scheduled_at).getTime()
      );
    });
    setLeads(booked);
    setLoading(false);
  };

  useEffect(() => {
    fetchBookings();
    const interval = setInterval(fetchBookings, 30_000);
    return () => clearInterval(interval);
  }, []);

  const upcoming = leads.filter(
    (l) => !l.meeting_scheduled_at || !isPast(new Date(l.meeting_scheduled_at))
  );
  const past = leads.filter(
    (l) => l.meeting_scheduled_at && isPast(new Date(l.meeting_scheduled_at))
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Bookings
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Meetings booked by the AI agent — live and past.
          </p>
        </div>
        <a
          href="https://app.cal.com/bookings"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-md transition-colors border border-zinc-700"
        >
          <ExternalLink className="size-4" /> Cal.com Dashboard
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <CalendarIcon className="size-4 text-zinc-500" />
            <span className="text-xs text-zinc-500 uppercase tracking-wider">
              Total Booked
            </span>
          </div>
          <p className="text-2xl font-bold text-white">{leads.length}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <CalendarClock className="size-4 text-emerald-500" />
            <span className="text-xs text-zinc-500 uppercase tracking-wider">
              Upcoming
            </span>
          </div>
          <p className="text-2xl font-bold text-emerald-400">
            {upcoming.length}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="size-4 text-zinc-500" />
            <span className="text-xs text-zinc-500 uppercase tracking-wider">
              Completed
            </span>
          </div>
          <p className="text-2xl font-bold text-zinc-300">{past.length}</p>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="py-12 text-center text-zinc-500 text-sm">
          Loading bookings...
        </div>
      )}

      {/* Upcoming */}
      {!loading && upcoming.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
            Upcoming ({upcoming.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcoming.map((lead) => (
              <BookingCard key={lead.id} lead={lead} />
            ))}
          </div>
        </div>
      )}

      {/* Past */}
      {!loading && past.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
            Past ({past.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {past.map((lead) => (
              <BookingCard key={lead.id} lead={lead} />
            ))}
          </div>
        </div>
      )}

      {/* Empty */}
      {!loading && leads.length === 0 && (
        <div className="py-16 text-center border border-dashed border-zinc-800 rounded-xl">
          <CalendarIcon className="size-10 text-zinc-700 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-zinc-300">No bookings yet</h3>
          <p className="text-sm text-zinc-500 mt-1">
            When the AI agent books a meeting, it'll show up here automatically.
          </p>
        </div>
      )}
    </div>
  );
}
