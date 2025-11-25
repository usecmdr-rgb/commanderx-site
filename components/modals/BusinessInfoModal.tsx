"use client";

import { FormEvent, useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import { useAppState } from "@/context/AppStateContext";
import { useSupabase } from "@/components/SupabaseProvider";

const fields = [
  { id: "businessName", label: "Business name", placeholder: "CommanderX Studio" },
  { id: "businessType", label: "Business type / industry", placeholder: "Consulting" },
  { id: "location", label: "Location", placeholder: "San Francisco, CA" },
  { id: "operatingHours", label: "Operating hours", placeholder: "Mon-Fri, 8a-6p" },
  { id: "serviceName", label: "Service name / Product", placeholder: "Consulting Services" },
  { id: "website", label: "Website", placeholder: "https://" },
  { id: "contactEmail", label: "Contact email", placeholder: "ops@company.com" },
  { id: "contactPhone", label: "Contact phone", placeholder: "+1 (555) 123-4567" },
  { id: "language", label: "Preferred language", placeholder: "English" },
  { id: "timezone", label: "Timezone", placeholder: "EST" },
];

const BusinessInfoModal = () => {
  const { showBusinessModal, setShowBusinessModal, businessInfo, updateBusinessInfo } = useAppState();
  const { supabase } = useSupabase();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [watermarkEnabled, setWatermarkEnabled] = useState(false);
  const [watermarkText, setWatermarkText] = useState("");
  const [watermarkPosition, setWatermarkPosition] = useState("bottom_right");

  // Load existing business profile when modal opens
  useEffect(() => {
    if (showBusinessModal) {
      loadBusinessProfile();
    }
  }, [showBusinessModal]);

  const loadBusinessProfile = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) return;

      const response = await fetch("/api/business-profile");
      if (response.ok) {
        const data = await response.json();
        if (data.profile) {
          // Update local state with profile data
          updateBusinessInfo({
            businessName: data.profile.businessName || "",
            businessType: data.profile.industry || "",
            location: data.profile.location || "",
            operatingHours: data.profile.hours || "",
            serviceName: data.profile.serviceName || "",
            website: data.profile.website || "",
            contactEmail: data.profile.contactEmail || "",
            contactPhone: data.profile.contactPhone || "",
            language: data.profile.language || "English",
            timezone: data.profile.timezone || "EST",
            notes: data.profile.notes || "",
            services: typeof data.profile.services === "string" 
              ? data.profile.services 
              : Array.isArray(data.profile.services)
              ? data.profile.services.join("\n")
              : "",
          });

          // Load watermark settings
          if (data.profile.watermarkSettings) {
            setWatermarkEnabled(data.profile.watermarkSettings.enabled || false);
            setWatermarkText(data.profile.watermarkSettings.text || "");
            setWatermarkPosition(data.profile.watermarkSettings.position || "bottom_right");
          }
        }
      }
    } catch (err) {
      console.error("Error loading business profile:", err);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setError("Please log in to save business information");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/business-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...businessInfo,
          watermarkSettings: {
            enabled: watermarkEnabled,
            text: watermarkText || null,
            position: watermarkPosition,
            logoUrl: null, // Can be added later
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save business information");
      }

      setShowBusinessModal(false);
      // Mark as shown so it doesn't appear again
      if (typeof window !== "undefined") {
        window.localStorage.setItem("cx-business-modal-shown", "true");
      }
    } catch (err: any) {
      setError(err.message || "Failed to save business information");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Help Us, Help You"
      description="This information will be given to the agents."
      open={showBusinessModal}
      onClose={() => {
        setShowBusinessModal(false);
        // Mark as shown so it doesn't appear again
        if (typeof window !== "undefined") {
          window.localStorage.setItem("cx-business-modal-shown", "true");
        }
      }}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          {fields.map((field) => (
            <label key={field.id} className="text-sm font-medium">
              {field.label}
              <input
                value={(businessInfo as any)[field.id] ?? ""}
                onChange={(event) =>
                  updateBusinessInfo({ [field.id]: event.target.value } as any)
                }
                placeholder={field.placeholder}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-sm focus:border-brand-accent focus:outline-none dark:border-slate-700"
              />
            </label>
          ))}
        </div>
        <label className="text-sm font-medium">
          Services / Products
          <textarea
            value={businessInfo.services}
            onChange={(event) => updateBusinessInfo({ services: event.target.value })}
            rows={6}
            placeholder="List all your services and products with details, pricing, and information..."
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-transparent px-3 py-2 text-sm focus:border-brand-accent focus:outline-none dark:border-slate-700"
          />
        </label>
        <label className="text-sm font-medium">
          Notes / &quot;Help us, help you&quot;
          <textarea
            value={businessInfo.notes}
            onChange={(event) => updateBusinessInfo({ notes: event.target.value })}
            rows={4}
            placeholder="Remind callers we are closed on state holidays..."
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-transparent px-3 py-2 text-sm focus:border-brand-accent focus:outline-none dark:border-slate-700"
          />
        </label>

        {/* Watermark Settings Section */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
          <h3 className="mb-3 text-sm font-semibold">Image Watermark Settings (for Studio agent)</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={watermarkEnabled}
                onChange={(e) => setWatermarkEnabled(e.target.checked)}
                className="rounded border-slate-300"
              />
              <span className="text-sm">Enable automatic watermark on images</span>
            </label>
            {watermarkEnabled && (
              <>
                <div>
                  <label className="text-xs font-medium">Watermark Text</label>
                  <input
                    type="text"
                    value={watermarkText}
                    onChange={(e) => setWatermarkText(e.target.value)}
                    placeholder="Your Studio Name"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-sm focus:border-brand-accent focus:outline-none dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">Position</label>
                  <select
                    value={watermarkPosition}
                    onChange={(e) => setWatermarkPosition(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-sm focus:border-brand-accent focus:outline-none dark:border-slate-700"
                  >
                    <option value="top_left">Top Left</option>
                    <option value="top_right">Top Right</option>
                    <option value="top_center">Top Center</option>
                    <option value="bottom_left">Bottom Left</option>
                    <option value="bottom_right">Bottom Right</option>
                    <option value="bottom_center">Bottom Center</option>
                    <option value="center">Center</option>
                  </select>
                </div>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              setShowBusinessModal(false);
              // Mark as shown so it doesn't appear again
              if (typeof window !== "undefined") {
                window.localStorage.setItem("cx-business-modal-shown", "true");
              }
            }}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default BusinessInfoModal;
