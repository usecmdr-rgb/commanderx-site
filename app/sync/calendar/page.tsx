"use client";

import { useState, useEffect, useMemo } from "react";
import { supabaseBrowserClient } from "@/lib/supabaseClient";
import { Loader2, CheckCircle2, Calendar as CalendarIcon, Plus, Edit2, Trash2, Clock, MapPin, Users, FileText } from "lucide-react";

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  location?: string;
  attendees?: Array<{ email: string; displayName?: string }>;
  notes?: string; // Custom notes added by user
  memo?: string; // Memo/reminder
  reminder?: string; // Reminder text
  createdByAloha?: boolean; // Whether this was created by Aloha agent
  alohaCallId?: string; // Reference to the call that created this
  isSuggested?: boolean; // Whether this is a suggested event from Sync
  suggestedBy?: string; // Agent that suggested this (e.g., "sync")
  followupId?: string; // Follow-up ID if this is a suggested event
  relatedEmailId?: string; // Related email ID if this is from Sync
}

const CalendarPage = () => {
  const [isCalendarConnected, setIsCalendarConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [suggestedEvents, setSuggestedEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [memoText, setMemoText] = useState("");
  const [reminderText, setReminderText] = useState("");

  useEffect(() => {
    checkCalendarConnection();
  }, []);

  useEffect(() => {
    if (isCalendarConnected) {
      loadCalendarEvents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCalendarConnected, selectedDate]);

  const checkCalendarConnection = async () => {
    try {
      const { data: { session } } = await supabaseBrowserClient.auth.getSession();
      if (!session?.access_token) return;

      const res = await fetch("/api/calendar/events?check=true", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (res.ok) {
        setIsCalendarConnected(true);
      }
    } catch (error) {
      console.error("Error checking calendar connection:", error);
    }
  };

  const handleConnectCalendar = async () => {
    try {
      setIsConnecting(true);
      const { data: { session } } = await supabaseBrowserClient.auth.getSession();
      if (!session?.access_token) {
        alert("Please log in first");
        return;
      }

      const res = await fetch("/api/calendar/auth", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await res.json();
      if (!data.ok || !data.authUrl) {
        throw new Error("Failed to get auth URL");
      }

      const width = 500;
      const height = 600;
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;

      const popup = window.open(
        data.authUrl,
        "Google Calendar Authentication",
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
      );

      const pollTimer = setInterval(() => {
        if (popup?.closed) {
          clearInterval(pollTimer);
          setIsConnecting(false);
          setTimeout(() => {
            checkCalendarConnection();
          }, 1000);
        }
      }, 500);
    } catch (error) {
      console.error("Error connecting calendar:", error);
      alert("Failed to connect Google Calendar. Please try again.");
      setIsConnecting(false);
    }
  };

  const loadCalendarEvents = async () => {
    try {
      setIsLoadingEvents(true);
      const { data: { session } } = await supabaseBrowserClient.auth.getSession();
      if (!session?.access_token) return;

      const startDate = new Date(selectedDate);
      startDate.setDate(1); // First day of month
      const endDate = new Date(selectedDate);
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0); // Last day of month

      const res = await fetch(
        `/api/calendar/events?start=${startDate.toISOString()}&end=${endDate.toISOString()}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (!res.ok) {
        if (res.status === 401) {
          setIsCalendarConnected(false);
          return;
        }
        throw new Error("Failed to fetch events");
      }

      const data = await res.json();
      if (data.ok) {
        if (data.events) {
          setEvents(data.events);
        }
        if (data.suggestedEvents) {
          setSuggestedEvents(data.suggestedEvents);
        }
      }
    } catch (error) {
      console.error("Error loading calendar events:", error);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setNoteText(event.notes || "");
    setMemoText(event.memo || "");
    setReminderText(event.reminder || "");
    setShowEventModal(true);
  };

  const handleAddToCalendar = async (event: CalendarEvent) => {
    if (!event.followupId) return;

    try {
      const { data: { session } } = await supabaseBrowserClient.auth.getSession();
      if (!session?.access_token) return;

      const res = await fetch("/api/calendar/followup-to-event", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          followupId: event.followupId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          // Remove from suggested events and reload calendar
          setSuggestedEvents((prev) => prev.filter((e) => e.id !== event.id));
          await loadCalendarEvents();
          setShowEventModal(false);
        }
      } else {
        const error = await res.json();
        alert(error.error || "Failed to add event to calendar");
      }
    } catch (error) {
      console.error("Error adding event to calendar:", error);
      alert("Failed to add event to calendar");
    }
  };

  const handleIgnoreSuggested = async (event: CalendarEvent) => {
    if (!event.followupId) return;

    try {
      const { data: { session } } = await supabaseBrowserClient.auth.getSession();
      if (!session?.access_token) return;

      // Mark follow-up as completed (ignored)
      const { error } = await supabaseBrowserClient
        .from("followups")
        .update({
          status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", event.followupId);

      if (error) {
        console.error("Error ignoring suggested event:", error);
      }

      // Remove from suggested events
      setSuggestedEvents((prev) => prev.filter((e) => e.id !== event.id));
      setShowEventModal(false);
    } catch (error) {
      console.error("Error ignoring suggested event:", error);
      // Still remove from UI even if API call fails
      setSuggestedEvents((prev) => prev.filter((e) => e.id !== event.id));
      setShowEventModal(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedEvent) return;

    try {
      const { data: { session } } = await supabaseBrowserClient.auth.getSession();
      if (!session?.access_token) return;

      const res = await fetch("/api/calendar/events/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          eventId: selectedEvent.id,
          notes: noteText,
          memo: memoText,
          reminder: reminderText,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          // Update local state
          setEvents((prev) =>
            prev.map((e) =>
              e.id === selectedEvent.id
                ? { ...e, notes: noteText, memo: memoText, reminder: reminderText }
                : e
            )
          );
          setSelectedEvent({ ...selectedEvent, notes: noteText, memo: memoText, reminder: reminderText });
          setEditingNote(false);
        }
      }
    } catch (error) {
      console.error("Error saving notes:", error);
      alert("Failed to save notes");
    }
  };

  const formatEventTime = (event: CalendarEvent) => {
    const start = event.start.dateTime || event.start.date;
    if (!start) return "All day";
    const date = new Date(start);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatEventDate = (event: CalendarEvent) => {
    const start = event.start.dateTime || event.start.date;
    if (!start) return "";
    const date = new Date(start);
    return date.toLocaleDateString();
  };

  const eventsByDate = useMemo(() => {
    const grouped: Record<string, CalendarEvent[]> = {};
    // Add regular events
    events.forEach((event) => {
      const date = event.start.dateTime || event.start.date;
      if (date) {
        const dateKey = new Date(date).toISOString().split("T")[0];
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(event);
      }
    });
    // Add suggested events
    suggestedEvents.forEach((event) => {
      const date = event.start.dateTime || event.start.date;
      if (date) {
        const dateKey = new Date(date).toISOString().split("T")[0];
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(event);
      }
    });
    return grouped;
  }, [events, suggestedEvents]);

  const monthDays = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: Array<{ date: Date; events: CalendarEvent[] }> = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ date: new Date(year, month, -startingDayOfWeek + i + 1), events: [] });
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateKey = date.toISOString().split("T")[0];
      days.push({
        date,
        events: eventsByDate[dateKey] || [],
      });
    }

    return days;
  }, [selectedDate, eventsByDate]);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-widest text-slate-500">Sync agent</p>
          <h1 className="text-3xl font-semibold">Calendar & appointments</h1>
        </div>
        <button
          onClick={handleConnectCalendar}
          disabled={isConnecting || isCalendarConnected}
          className="flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isConnecting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : isCalendarConnected ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Calendar Connected
            </>
          ) : (
            <>
              <CalendarIcon className="h-4 w-4" />
              Connect Google Calendar
            </>
          )}
        </button>
      </header>

      {isCalendarConnected ? (
        <div className="space-y-6">
          {/* Month Navigation */}
          <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-900/40">
            <button
              onClick={() => {
                const newDate = new Date(selectedDate);
                newDate.setMonth(newDate.getMonth() - 1);
                setSelectedDate(newDate);
              }}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              ← Previous
            </button>
            <h2 className="text-xl font-semibold">
              {selectedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </h2>
            <button
              onClick={() => {
                const newDate = new Date(selectedDate);
                newDate.setMonth(newDate.getMonth() + 1);
                setSelectedDate(newDate);
              }}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              Next →
            </button>
          </div>

          {/* Calendar Grid */}
          {isLoadingEvents ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
              <span className="ml-2 text-sm text-slate-500">Loading calendar events...</span>
            </div>
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 dark:border-slate-800 dark:bg-slate-900/40">
              <div className="grid grid-cols-7 gap-2 mb-4">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="text-center text-xs font-semibold uppercase text-slate-500 py-2">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {monthDays.map((day, index) => {
                  const isCurrentMonth = day.date.getMonth() === selectedDate.getMonth();
                  const isToday =
                    day.date.toDateString() === new Date().toDateString();
                  const hasEvents = day.events.length > 0;

                  return (
                    <div
                      key={index}
                      className={`min-h-[100px] rounded-2xl border p-2 ${
                        isCurrentMonth
                          ? "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60"
                          : "border-slate-100 bg-slate-50/50 dark:border-slate-900 dark:bg-slate-950/50"
                      } ${isToday ? "ring-2 ring-slate-900 dark:ring-white" : ""}`}
                    >
                      <div
                        className={`text-sm font-semibold mb-1 ${
                          isCurrentMonth
                            ? isToday
                              ? "text-slate-900 dark:text-white"
                              : "text-slate-600 dark:text-slate-300"
                            : "text-slate-400 dark:text-slate-600"
                        }`}
                      >
                        {day.date.getDate()}
                      </div>
                      <div className="space-y-1">
                        {day.events.slice(0, 3).map((event) => (
                          <button
                            key={event.id}
                            onClick={() => handleEventClick(event)}
                            className={`w-full text-left text-xs px-2 py-1 rounded truncate ${
                              event.isSuggested
                                ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border border-orange-200 dark:border-orange-800"
                                : event.createdByAloha
                                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                                : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            } hover:opacity-80`}
                            title={event.summary + (event.isSuggested ? " (Suggested by Sync)" : "")}
                          >
                            {formatEventTime(event)} {event.summary}
                            {event.isSuggested && " ⚡"}
                          </button>
                        ))}
                        {day.events.length > 3 && (
                          <div className="text-xs text-slate-500 px-2">
                            +{day.events.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-12 text-center dark:border-slate-800 dark:bg-slate-900/40">
          <CalendarIcon className="h-12 w-12 mx-auto text-slate-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Connect your Google Calendar</h3>
          <p className="text-sm text-slate-500 mb-6">
            Sync your calendar events, add notes and reminders, and integrate with Aloha for automatic appointment management.
          </p>
          <button
            onClick={handleConnectCalendar}
            className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
          >
            Connect Google Calendar
          </button>
        </div>
      )}

      {/* Event Detail Modal */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-2xl font-semibold mb-2">{selectedEvent.summary}</h3>
                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>
                      {formatEventDate(selectedEvent)} at {formatEventTime(selectedEvent)}
                    </span>
                  </div>
                  {selectedEvent.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{selectedEvent.location}</span>
                    </div>
                  )}
                  {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{selectedEvent.attendees.length} attendee(s)</span>
                    </div>
                  )}
                  {selectedEvent.createdByAloha && (
                    <div className="inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-300">
                      Created by Aloha
                    </div>
                  )}
                  {selectedEvent.isSuggested && (
                    <div className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                      Suggested by Sync
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowEventModal(false)}
                className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {selectedEvent.description && (
              <div className="mb-4 rounded-2xl bg-slate-100/70 p-4 text-sm dark:bg-slate-800/60">
                <p className="text-slate-700 dark:text-slate-200">{selectedEvent.description}</p>
              </div>
            )}

            {/* Suggested Event Confirmation */}
            {selectedEvent.isSuggested && (
              <div className="mb-4 rounded-2xl border-2 border-orange-200 bg-orange-50/50 p-4 dark:border-orange-800 dark:bg-orange-900/20">
                <p className="text-sm font-semibold text-orange-900 dark:text-orange-200 mb-3">
                  This event was suggested by Sync based on an email. Would you like to add it to your calendar?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleAddToCalendar(selectedEvent)}
                    className="flex-1 rounded-full bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
                  >
                    Add to Calendar
                  </button>
                  <button
                    onClick={() => handleIgnoreSuggested(selectedEvent)}
                    className="flex-1 rounded-full border border-orange-300 px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-900/30"
                  >
                    Ignore
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {/* Notes Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Notes
                  </label>
                  {!editingNote && (
                    <button
                      onClick={() => setEditingNote(true)}
                      className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    >
                      <Edit2 className="h-3 w-3 inline mr-1" />
                      Edit
                    </button>
                  )}
                </div>
                {editingNote ? (
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Add your notes here..."
                    className="w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-sm focus:border-brand-accent focus:outline-none dark:border-slate-700 min-h-[100px]"
                  />
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm dark:border-slate-800 dark:bg-slate-900/60 min-h-[100px]">
                    {noteText || <span className="text-slate-400">No notes added</span>}
                  </div>
                )}
              </div>

              {/* Memo Section */}
              <div>
                <label className="text-sm font-semibold mb-2 block">Memo</label>
                {editingNote ? (
                  <textarea
                    value={memoText}
                    onChange={(e) => setMemoText(e.target.value)}
                    placeholder="Add a memo or reminder..."
                    className="w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-sm focus:border-brand-accent focus:outline-none dark:border-slate-700 min-h-[80px]"
                  />
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm dark:border-slate-800 dark:bg-slate-900/60 min-h-[80px]">
                    {memoText || <span className="text-slate-400">No memo</span>}
                  </div>
                )}
              </div>

              {/* Reminder Section */}
              <div>
                <label className="text-sm font-semibold mb-2 block">Reminder</label>
                {editingNote ? (
                  <input
                    type="text"
                    value={reminderText}
                    onChange={(e) => setReminderText(e.target.value)}
                    placeholder="Set a reminder..."
                    className="w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-sm focus:border-brand-accent focus:outline-none dark:border-slate-700"
                  />
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm dark:border-slate-800 dark:bg-slate-900/60">
                    {reminderText || <span className="text-slate-400">No reminder set</span>}
                  </div>
                )}
              </div>

              {editingNote && (
                <div className="flex gap-3">
                  <button
                    onClick={handleSaveNotes}
                    className="flex-1 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingNote(false);
                      setNoteText(selectedEvent.notes || "");
                      setMemoText(selectedEvent.memo || "");
                      setReminderText(selectedEvent.reminder || "");
                    }}
                    className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;

