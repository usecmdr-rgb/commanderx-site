"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users, Phone, Clock, X, Check, Search, Shield } from "lucide-react";

interface ContactProfile {
  id: string;
  phone_number: string;
  name: string | null;
  notes: string | null;
  do_not_call: boolean;
  last_called_at: string | null;
  last_outcome: string | null;
  times_contacted: number;
  created_at: string;
}

export default function ContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<ContactProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "do_not_call" | "recent">("all");
  const [selectedContact, setSelectedContact] = useState<ContactProfile | null>(null);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState("");

  useEffect(() => {
    fetchContacts();
  }, [filter]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      // TODO: Create API endpoint for contacts
      // For now, use mock data
      const mockContacts: ContactProfile[] = [
        {
          id: "1",
          phone_number: "+15551234567",
          name: "Maria Gomez",
          notes: "Prefers evening calls",
          do_not_call: false,
          last_called_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          last_outcome: "feedback_collected",
          times_contacted: 3,
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "2",
          phone_number: "+15559876543",
          name: "Alex Chen",
          notes: "Likes short calls",
          do_not_call: false,
          last_called_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          last_outcome: "rescheduled",
          times_contacted: 5,
          created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "3",
          phone_number: "+15551111111",
          name: null,
          notes: null,
          do_not_call: true,
          last_called_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          last_outcome: "do_not_call",
          times_contacted: 1,
          created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];
      setContacts(mockContacts);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDoNotCall = async (contact: ContactProfile) => {
    try {
      // TODO: Call API to update do-not-call flag
      setContacts(contacts.map(c => 
        c.id === contact.id 
          ? { ...c, do_not_call: !c.do_not_call }
          : c
      ));
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleUpdateNotes = async (contact: ContactProfile) => {
    try {
      // TODO: Call API to update notes
      setContacts(contacts.map(c => 
        c.id === contact.id 
          ? { ...c, notes: notesValue }
          : c
      ));
      setEditingNotes(false);
      setSelectedContact(null);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const getOutcomeLabel = (outcome: string | null) => {
    if (!outcome) return null;
    const labels: Record<string, string> = {
      feedback_collected: "Feedback Collected",
      rescheduled: "Rescheduled",
      not_interested: "Not Interested",
      asked_for_email: "Asked for Email",
      do_not_call: "Do Not Call",
      no_answer: "No Answer",
    };
    return labels[outcome] || outcome;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    const daysAgo = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (daysAgo === 0) return "Today";
    if (daysAgo === 1) return "Yesterday";
    if (daysAgo < 7) return `${daysAgo} days ago`;
    return date.toLocaleDateString();
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = !searchQuery || 
      contact.phone_number.includes(searchQuery) ||
      (contact.name && contact.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFilter = 
      filter === "all" ||
      (filter === "do_not_call" && contact.do_not_call) ||
      (filter === "recent" && contact.last_called_at && 
       new Date(contact.last_called_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-500">Loading contacts...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <button
          onClick={() => router.back()}
          className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-4"
        >
          ← Back
        </button>
        <p className="text-sm uppercase tracking-widest text-slate-500">Aloha Agent</p>
        <h1 className="text-3xl font-semibold">Contact Memory</h1>
        <p className="text-slate-600 dark:text-slate-300 mt-2">
          Manage contact profiles and do-not-call preferences. Aloha remembers basic info about callers for personalized conversations.
        </p>
      </header>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-900/60">
          <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Total Contacts</p>
          <p className="text-2xl font-semibold">{contacts.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-900/60">
          <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Do-Not-Call</p>
          <p className="text-2xl font-semibold text-red-600">{contacts.filter(c => c.do_not_call).length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-900/60">
          <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Recently Contacted</p>
          <p className="text-2xl font-semibold">{contacts.filter(c => c.last_called_at && new Date(c.last_called_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000).length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or phone number..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "all"
                ? "bg-brand-accent text-white"
                : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("do_not_call")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "do_not_call"
                ? "bg-brand-accent text-white"
                : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
            }`}
          >
            Do-Not-Call
          </button>
          <button
            onClick={() => setFilter("recent")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "recent"
                ? "bg-brand-accent text-white"
                : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
            }`}
          >
            Recent
          </button>
        </div>
      </div>

      {/* Contacts List */}
      {filteredContacts.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-12 text-center dark:border-slate-800 dark:bg-slate-900/40">
          <p className="text-slate-500">
            {searchQuery ? "No contacts match your search." : "No contacts found."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className="rounded-3xl border border-slate-200 bg-white/80 p-6 dark:border-slate-800 dark:bg-slate-900/40"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">
                      {contact.name || "Unknown Contact"}
                    </h3>
                    {contact.do_not_call && (
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        Do Not Call
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300 mb-3">
                    <div className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      <span>{contact.phone_number}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>Last called: {formatDate(contact.last_called_at)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>Contacted {contact.times_contacted} time{contact.times_contacted !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                  {contact.notes && (
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                      <strong>Notes:</strong> {contact.notes}
                    </p>
                  )}
                  {contact.last_outcome && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Last Outcome:</span>
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {getOutcomeLabel(contact.last_outcome)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedContact(contact);
                      setEditingNotes(true);
                      setNotesValue(contact.notes || "");
                    }}
                    className="px-3 py-1.5 text-sm bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    Edit Notes
                  </button>
                  <button
                    onClick={() => handleToggleDoNotCall(contact)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      contact.do_not_call
                        ? "bg-green-600 text-white hover:bg-green-700"
                        : "bg-red-600 text-white hover:bg-red-700"
                    }`}
                  >
                    {contact.do_not_call ? (
                      <>
                        <Check className="w-4 h-4 inline mr-1" />
                        Allow Calls
                      </>
                    ) : (
                      <>
                        <X className="w-4 h-4 inline mr-1" />
                        Block Calls
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Notes Modal */}
      {selectedContact && editingNotes && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Edit Notes</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Notes</label>
                <textarea
                  value={notesValue}
                  onChange={(e) => setNotesValue(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg dark:border-slate-700 dark:bg-slate-800"
                  placeholder="Add short notes about this contact (e.g., 'prefers evenings', 'likes short calls')"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Keep notes short and non-sensitive. Examples: preferences, call channel preference, basic call outcomes.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-6">
              <button
                onClick={() => handleUpdateNotes(selectedContact)}
                className="px-6 py-3 bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 transition-colors"
              >
                Save Notes
              </button>
              <button
                onClick={() => {
                  setEditingNotes(false);
                  setSelectedContact(null);
                  setNotesValue("");
                }}
                className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

