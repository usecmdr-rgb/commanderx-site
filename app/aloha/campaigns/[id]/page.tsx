"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  type: string;
  purpose: string | null;
  purpose_details: string | null;
  extra_instructions: string | null;
  script_style: string | null;
  status: string;
  timezone: string;
  allowed_call_start_time: string;
  allowed_call_end_time: string;
  allowed_days_of_week: string[];
  targets: Array<{
    id: string;
    phone_number: string;
    contact_name: string | null;
    status: string;
  }>;
  stats: {
    total: number;
    completed: number;
    pending: number;
    failed: number;
    calling: number;
    percentage: number;
  };
  timeWindowStatus: {
    isWithinWindow: boolean;
    reason?: string;
    nextWindowOpens?: string;
  };
}

export default function CampaignDetailPage() {
  const router = useRouter();
  const params = useParams();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testCallLoading, setTestCallLoading] = useState(false);
  const [testCallError, setTestCallError] = useState<string | null>(null);
  const [testPhoneNumber, setTestPhoneNumber] = useState("");
  const [showTestCallForm, setShowTestCallForm] = useState(false);

  useEffect(() => {
    fetchCampaign();
  }, [campaignId]);

  const fetchCampaign = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/campaigns/${campaignId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch campaign");
      }
      const data = await response.json();
      setCampaign(data.campaign);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTestCall = async () => {
    if (!testPhoneNumber.trim()) {
      setTestCallError("Please enter a phone number");
      return;
    }

    try {
      setTestCallLoading(true);
      setTestCallError(null);

      const response = await fetch(`/api/campaigns/${campaignId}/test-call`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: testPhoneNumber.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to initiate test call");
      }

      // Success - show message
      alert(`Test call initiated to ${testPhoneNumber}. In production, Aloha would call you now.`);
      setShowTestCallForm(false);
      setTestPhoneNumber("");
    } catch (err: any) {
      setTestCallError(err.message);
    } finally {
      setTestCallLoading(false);
    }
  };

  const handleAction = async (action: string) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || data.error || "Action failed");
        return;
      }

      // Refresh campaign
      fetchCampaign();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-500">Loading campaign...</p>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="space-y-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
          {error || "Campaign not found"}
        </div>
        <Link
          href="/aloha/campaigns"
          className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
        >
          ← Back to Campaigns
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl">
      <header className="flex items-center justify-between">
        <div>
          <Link
            href="/aloha/campaigns"
            className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-4 inline-block"
          >
            ← Back to Campaigns
          </Link>
          <h1 className="text-3xl font-semibold">{campaign.name}</h1>
          {campaign.description && (
            <p className="text-slate-600 dark:text-slate-400 mt-2">{campaign.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {campaign.status === "draft" && (
            <button
              onClick={() => handleAction("start")}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Start Campaign
            </button>
          )}
          {campaign.status === "running" && (
            <button
              onClick={() => handleAction("pause")}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              Pause
            </button>
          )}
          {campaign.status === "paused" && (
            <button
              onClick={() => handleAction("resume")}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Resume
            </button>
          )}
        </div>
      </header>

      {/* Test Call Section */}
      <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">Test This Campaign with Aloha</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Use a test call to hear exactly how Aloha will speak and handle questions before you start calling real customers.
            </p>
          </div>
          <button
            onClick={() => setShowTestCallForm(!showTestCallForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showTestCallForm ? "Cancel" : "Test Call"}
          </button>
        </div>

        {showTestCallForm && (
          <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Phone Number to Call *
              </label>
              <input
                type="tel"
                value={testPhoneNumber}
                onChange={(e) => setTestPhoneNumber(e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg dark:border-slate-700 dark:bg-slate-800"
              />
              <p className="text-xs text-slate-500 mt-1">
                Enter your phone number (or another test number) to receive a test call from Aloha.
              </p>
            </div>

            {testCallError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200 text-sm">
                {testCallError}
              </div>
            )}

            <button
              onClick={handleTestCall}
              disabled={testCallLoading || !testPhoneNumber.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testCallLoading ? "Initiating..." : "Place Test Call"}
            </button>
          </div>
        )}
      </div>

      {/* Campaign Info */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 dark:border-slate-800 dark:bg-slate-900/40">
          <h2 className="text-xl font-semibold mb-4">Campaign Details</h2>
          <div className="space-y-3 text-sm">
            <div>
              <span className="font-semibold text-slate-600 dark:text-slate-400">Purpose:</span>{" "}
              <span className="text-slate-700 dark:text-slate-300">
                {campaign.purpose || campaign.type}
              </span>
            </div>
            {campaign.purpose_details && (
              <div>
                <span className="font-semibold text-slate-600 dark:text-slate-400">Message:</span>
                <p className="text-slate-700 dark:text-slate-300 mt-1">{campaign.purpose_details}</p>
              </div>
            )}
            {campaign.extra_instructions && (
              <div>
                <span className="font-semibold text-slate-600 dark:text-slate-400">Additional Instructions:</span>
                <p className="text-slate-700 dark:text-slate-300 mt-1">{campaign.extra_instructions}</p>
              </div>
            )}
            <div>
              <span className="font-semibold text-slate-600 dark:text-slate-400">Status:</span>{" "}
              <span className="text-slate-700 dark:text-slate-300 capitalize">{campaign.status}</span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 dark:border-slate-800 dark:bg-slate-900/40">
          <h2 className="text-xl font-semibold mb-4">Progress</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Total Targets</span>
              <span className="font-semibold">{campaign.stats.total}</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 dark:bg-slate-700">
              <div
                className="bg-brand-accent h-2 rounded-full transition-all"
                style={{ width: `${campaign.stats.percentage}%` }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-600 dark:text-slate-400">Completed:</span>{" "}
                <span className="font-semibold">{campaign.stats.completed}</span>
              </div>
              <div>
                <span className="text-slate-600 dark:text-slate-400">Pending:</span>{" "}
                <span className="font-semibold">{campaign.stats.pending}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Targets List */}
      <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 dark:border-slate-800 dark:bg-slate-900/40">
        <h2 className="text-xl font-semibold mb-4">Campaign Targets</h2>
        {campaign.targets.length === 0 ? (
          <p className="text-slate-500">No targets added yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-2">Phone Number</th>
                  <th className="py-2">Contact Name</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {campaign.targets.map((target) => (
                  <tr
                    key={target.id}
                    className="border-t border-slate-100 dark:border-slate-800"
                  >
                    <td className="py-3">{target.phone_number}</td>
                    <td className="py-3">{target.contact_name || "-"}</td>
                    <td className="py-3 capitalize">{target.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

