/* eslint-disable @next/next/no-img-element */
"use client";

import { ChangeEvent, useEffect, useMemo, useState, useRef, useCallback } from "react";
import { mockMediaItems } from "@/lib/data";
import { useAgentStats, emptyAgentStats } from "@/hooks/useAgentStats";
import { useAppState } from "@/context/AppStateContext";
import { useConnectedAccounts } from "@/hooks/useConnectedAccounts";
import type { ConnectedAccountType } from "@/types";
import { Download, Facebook, Instagram, Maximize2, X, Plus, Trash2, Bold, Italic, Underline, Sparkles, Send, Linkedin, Globe, Check, Loader2 } from "lucide-react";

const filters = [
  "Soft",
  "Vivid",
  "Monochrome",
  "Vintage",
  "Dramatic",
  "Cool",
  "Warm",
  "Cinematic",
  "B&W",
  "Sepia",
];

type SocialPlatform = "instagram" | "tiktok" | "facebook";

type ShareTargetPayload = {
  connectedAccountId: string;
  caption: string;
};

type ShareRequest = {
  assetId: string; // URL or unique identifier for the image/video
  targets: ShareTargetPayload[];
};
type AdjustmentKey =
  | "brightness"
  | "contrast"
  | "saturation"
  | "warmth"
  | "shadows"
  | "highlights"
  | "zoom";
type OverlayAlignment = "left" | "center" | "right";

type QuickAddSuggestion = {
  id: string;
  label: string; // e.g., "Quick add website URL"
  type: "website" | "phone" | "companyName" | "email" | "location" | "serviceName";
  value: string; // The actual text that will be added as overlay
};

type TextItem = {
  id: string;
  content: string;
  color: string; // HEX format
  fontFamily: string;
  fontSize: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  position: { x: number; y: number }; // Percentage-based
  alignment: OverlayAlignment;
  // Text effects
  effectType?: "none" | "glow" | "outline" | "highlight" | "shadow";
  effectColor?: string; // HEX/RGBA for effect
  effectIntensity?: number; // 0–100 (controls blur/strength)
  effectThickness?: number; // px for outline thickness
  highlightPadding?: number; // px padding around text for highlight
  // Metadata
  metaType?: QuickAddSuggestion["type"]; // Track source for Quick Add suggestions
};

type AdjustmentState = Record<AdjustmentKey, number>;

const adjustmentKeys: AdjustmentKey[] = [
  "brightness",
  "contrast",
  "saturation",
  "warmth",
  "shadows",
  "highlights",
  "zoom",
];

const NO_OP_ADJUSTMENTS: AdjustmentState = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  warmth: 0,
  shadows: 0,
  highlights: 0,
  zoom: 0,
};

const adjustmentSliderConfig: Record<AdjustmentKey, { label: string; min: number; max: number; step?: number }> = {
  brightness: { label: "Brightness", min: 0, max: 200 },
  contrast: { label: "Contrast", min: 0, max: 200 },
  saturation: { label: "Saturation", min: 0, max: 200 },
  warmth: { label: "Temperature", min: -50, max: 50 },
  shadows: { label: "Shadows", min: -50, max: 50 },
  highlights: { label: "Highlights", min: -50, max: 50 },
  zoom: { label: "Zoom", min: -50, max: 100 },
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

// Helper function to compute text item styles with effects
function getTextItemStyle(item: TextItem): React.CSSProperties {
  const baseStyle: React.CSSProperties = {
    fontFamily: item.fontFamily,
    fontSize: `${item.fontSize}px`,
    lineHeight: 1.2,
    userSelect: "none",
    color: item.color,
    fontWeight: item.bold ? "bold" : "normal",
    fontStyle: item.italic ? "italic" : "normal",
    textDecoration: item.underline ? "underline" : "none",
  };

  const effectType = item.effectType || "none";
  const effectColor = item.effectColor || "#000000";
  const effectIntensity = item.effectIntensity ?? 50;
  const effectThickness = item.effectThickness ?? 2;
  const highlightPadding = item.highlightPadding ?? 4;

  // Convert HEX to RGBA for effects
  const hexToRgba = (hex: string, alpha: number = 1): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      const r = parseInt(result[1], 16);
      const g = parseInt(result[2], 16);
      const b = parseInt(result[3], 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return hex;
  };

  // Calculate effect values based on intensity (0-100)
  const blurRadius = (effectIntensity / 100) * 20; // 0-20px blur
  const shadowOpacity = effectIntensity / 100; // 0-1 opacity

  switch (effectType) {
    case "glow": {
      const glowColor = hexToRgba(effectColor, shadowOpacity);
      return {
        ...baseStyle,
        textShadow: `0 0 ${blurRadius}px ${glowColor}, 0 0 ${blurRadius * 1.5}px ${glowColor}`,
      };
    }

    case "outline": {
      const outlineColor = hexToRgba(effectColor, 1);
      // Create outline using multiple text-shadows
      const shadows: string[] = [];
      const steps = Math.max(8, Math.ceil(effectThickness * 2));
      for (let i = 0; i < steps; i++) {
        const angle = (i / steps) * Math.PI * 2;
        const x = Math.cos(angle) * effectThickness;
        const y = Math.sin(angle) * effectThickness;
        shadows.push(`${x}px ${y}px 0 ${outlineColor}`);
      }
      return {
        ...baseStyle,
        textShadow: shadows.join(", "),
      };
    }

    case "highlight": {
      const highlightColor = hexToRgba(effectColor, shadowOpacity);
      return {
        ...baseStyle,
        backgroundColor: highlightColor,
        padding: `${highlightPadding}px ${highlightPadding * 1.5}px`,
        borderRadius: `${highlightPadding}px`,
        display: "inline-block",
      };
    }

    case "shadow": {
      const shadowColor = hexToRgba(effectColor, shadowOpacity);
      const offsetX = (effectIntensity / 100) * 4; // 0-4px offset
      const offsetY = (effectIntensity / 100) * 4;
      return {
        ...baseStyle,
        textShadow: `${offsetX}px ${offsetY}px ${blurRadius}px ${shadowColor}`,
      };
    }

    case "none":
    default:
      return baseStyle;
  }
}

// Color Picker Component
const ColorPicker = ({
  color,
  onChange,
}: {
  color: string;
  onChange: (color: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hexInput, setHexInput] = useState(color);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHexInput(color);
  }, [color]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  };

  const rgbToHex = (r: number, g: number, b: number) => {
    return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
  };

  const handleHexChange = (value: string) => {
    setHexInput(value);
    if (/^#[0-9A-F]{6}$/i.test(value)) {
      onChange(value);
    }
  };

  const presetColors = [
    "#FFFFFF",
    "#000000",
    "#FF0000",
    "#00FF00",
    "#0000FF",
    "#FFFF00",
    "#FF00FF",
    "#00FFFF",
    "#FFA500",
    "#800080",
    "#FFC0CB",
    "#A52A2A",
  ];

  return (
    <div className="relative" ref={pickerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-10 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-2 px-3 hover:bg-slate-50 dark:hover:bg-slate-800"
      >
        <div
          className="w-6 h-6 rounded border border-slate-300 dark:border-slate-600"
          style={{ backgroundColor: color }}
        />
        <span className="text-sm flex-1 text-left">{color}</span>
      </button>
      {isOpen && (
        <div className="absolute z-50 mt-2 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg w-64">
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold mb-1 block">HEX Color</label>
              <input
                type="text"
                value={hexInput}
                onChange={(e) => handleHexChange(e.target.value.toUpperCase())}
                placeholder="#FFFFFF"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm focus:border-brand-accent focus:outline-none"
                pattern="^#[0-9A-F]{6}$"
              />
            </div>
            <div>
              <label className="text-xs font-semibold mb-2 block">Preset Colors</label>
              <div className="grid grid-cols-6 gap-2">
                {presetColors.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      onChange(preset);
                      setHexInput(preset);
                    }}
                    className={`w-8 h-8 rounded border-2 ${
                      color === preset
                        ? "border-slate-900 dark:border-white"
                        : "border-slate-300 dark:border-slate-600"
                    }`}
                    style={{ backgroundColor: preset }}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold mb-2 block">RGB Sliders</label>
              {(() => {
                const rgb = hexToRgb(color);
                if (!rgb) return null;
                return (
                  <div className="space-y-2">
                    {(["r", "g", "b"] as const).map((channel) => (
                      <div key={channel}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="uppercase">{channel}</span>
                          <span>{rgb[channel]}</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={255}
                          value={rgb[channel]}
                          onChange={(e) => {
                            const newRgb = { ...rgb, [channel]: parseInt(e.target.value) };
                            const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
                            onChange(newHex);
                            setHexInput(newHex);
                          }}
                          className="w-full"
                        />
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to build Quick Add suggestions from business info
function buildQuickAddSuggestions(
  businessInfo: {
    website?: string;
    contactPhone?: string;
    businessName?: string;
    contactEmail?: string;
    location?: string;
    serviceName?: string;
  },
  existingTextItems: TextItem[]
): QuickAddSuggestion[] {
  const suggestions: QuickAddSuggestion[] = [];

  // Track which types already exist to avoid duplicates
  const existingTypes = new Set(
    existingTextItems.map((item) => item.metaType).filter(Boolean)
  );

  if (businessInfo.website && businessInfo.website.trim() && !existingTypes.has("website")) {
    suggestions.push({
      id: "quick-add-website",
      label: "Quick add website URL",
      type: "website",
      value: businessInfo.website.trim(),
    });
  }

  if (
    businessInfo.contactPhone &&
    businessInfo.contactPhone.trim() &&
    !existingTypes.has("phone")
  ) {
    suggestions.push({
      id: "quick-add-phone",
      label: "Quick add phone number",
      type: "phone",
      value: businessInfo.contactPhone.trim(),
    });
  }

  if (
    businessInfo.businessName &&
    businessInfo.businessName.trim() &&
    !existingTypes.has("companyName")
  ) {
    suggestions.push({
      id: "quick-add-company",
      label: "Quick add company name",
      type: "companyName",
      value: businessInfo.businessName.trim(),
    });
  }

  if (
    businessInfo.contactEmail &&
    businessInfo.contactEmail.trim() &&
    !existingTypes.has("email")
  ) {
    suggestions.push({
      id: "quick-add-email",
      label: "Quick add email",
      type: "email",
      value: businessInfo.contactEmail.trim(),
    });
  }

  if (
    businessInfo.location &&
    businessInfo.location.trim() &&
    !existingTypes.has("location")
  ) {
    suggestions.push({
      id: "quick-add-location",
      label: "Quick add location",
      type: "location",
      value: businessInfo.location.trim(),
    });
  }

  if (
    businessInfo.serviceName &&
    businessInfo.serviceName.trim() &&
    !existingTypes.has("serviceName")
  ) {
    suggestions.push({
      id: "quick-add-service",
      label: "Quick add service name",
      type: "serviceName",
      value: businessInfo.serviceName.trim(),
    });
  }

  return suggestions;
}

// Share Modal Component
interface MuShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  assetUrl: string | null;
  assetName?: string;
}

function MuShareModal({ isOpen, onClose, assetUrl, assetName }: MuShareModalProps) {
  const [selectedTargets, setSelectedTargets] = useState<Set<string>>(new Set());
  const [captions, setCaptions] = useState<Record<string, string>>({});
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectingPlatform, setConnectingPlatform] = useState<ConnectedAccountType | null>(null);

  const {
    accounts,
    isLoading: accountsLoading,
    error: accountsError,
    connectAccount,
  } = useConnectedAccounts();

  useEffect(() => {
    if (!isOpen) {
      setSelectedTargets(new Set());
      setCaptions({});
      setError(null);
      setConnectingPlatform(null);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedTargets((prev) => {
      const connectedIds = new Set(accounts.filter((a) => a.isConnected).map((a) => a.id));
      const next = new Set(Array.from(prev).filter((id) => connectedIds.has(id)));
      return next;
    });
    setCaptions((prev) => {
      const connectedIds = new Set(accounts.filter((a) => a.isConnected).map((a) => a.id));
      const next: Record<string, string> = {};
      Object.entries(prev).forEach(([key, value]) => {
        if (connectedIds.has(key)) {
          next[key] = value;
        }
      });
      return next;
    });
  }, [accounts]);

  const getPlatformIcon = (type: ConnectedAccountType) => {
    switch (type) {
      case "instagram":
        return <Instagram className="h-5 w-5" />;
      case "facebook":
        return <Facebook className="h-5 w-5" />;
      case "x":
        return <X className="h-5 w-5" />;
      case "linkedin":
        return <Linkedin className="h-5 w-5" />;
      case "website":
        return <Globe className="h-5 w-5" />;
      default:
        return <Globe className="h-5 w-5" />;
    }
  };

  const handleToggleTarget = (accountId: string, isConnected: boolean) => {
    if (!isConnected) return;
    setSelectedTargets((prev) => {
      const next = new Set(prev);
      if (next.has(accountId)) {
        next.delete(accountId);
      } else {
        next.add(accountId);
      }
      return next;
    });
  };

  const handleConnectAccount = async (type: ConnectedAccountType) => {
    try {
      setConnectingPlatform(type);
      setError(null);
      await connectAccount(type);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to connect the selected platform.");
    } finally {
      setConnectingPlatform(null);
    }
  };

  const handleShare = async () => {
    if (selectedTargets.size === 0 || !assetUrl) {
      setError("Please select at least one platform to share to.");
      return;
    }

    setIsSharing(true);
    setError(null);

    try {
      const shareRequest: ShareRequest = {
        assetId: assetUrl,
        targets: Array.from(selectedTargets).map((accountId) => ({
          connectedAccountId: accountId,
          caption: captions[accountId] ?? "",
        })),
      };

      // Call API - placeholder for now
      await sharePost(shareRequest);

      // Success - close modal and reset state
      onClose();
      setSelectedTargets(new Set());
      setCaptions({});
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to share post. Please try again.");
    } finally {
      setIsSharing(false);
    }
  };

  const handleCaptionChange = (accountId: string, value: string) => {
    setCaptions((prev) => ({ ...prev, [accountId]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative z-50 w-full max-w-4xl max-h-[90vh] mx-4 bg-white rounded-3xl shadow-xl dark:bg-slate-900 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-semibold">Share Post</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition"
            disabled={isSharing}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
            {/* Left: Preview */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Preview</h3>
              {assetUrl ? (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50 dark:bg-slate-900">
                  <img
                    src={assetUrl}
                    alt="Share preview"
                    className="w-full h-auto object-contain"
                  />
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center text-slate-500">
                  No preview available
                </div>
              )}
              {assetName && (
                <p className="text-xs text-slate-500 truncate">{assetName}</p>
              )}
            </div>

            {/* Right: Platforms & Captions */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Select Platforms</h3>
              {accountsLoading ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-slate-700">
                  Loading connected accounts…
                </div>
              ) : (
                <div className="space-y-3">
                  {accounts.map((account) => (
                  <div
                    key={account.id}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-slate-600 dark:text-slate-400">
                          {getPlatformIcon(account.type)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold capitalize">{account.type === "x" ? "X (Twitter)" : account.type}</p>
                          <p className="text-xs text-slate-500">{account.displayName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {account.isConnected ? (
                          <>
                            <span className="text-xs text-green-600 dark:text-green-400">Connected</span>
                            <button
                              type="button"
                              onClick={() => handleToggleTarget(account.id, account.isConnected)}
                              className={`flex items-center justify-center w-6 h-6 rounded border-2 transition ${
                                selectedTargets.has(account.id)
                                  ? "bg-slate-900 border-slate-900 dark:bg-white dark:border-white"
                                  : "border-slate-300 dark:border-slate-600"
                              }`}
                              disabled={isSharing}
                            >
                              {selectedTargets.has(account.id) && (
                                <Check className="h-4 w-4 text-white dark:text-slate-900" />
                              )}
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleConnectAccount(account.type)}
                            className={`text-xs px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center gap-1 ${
                              connectingPlatform === account.type ? "opacity-60" : ""
                            }`}
                            disabled={isSharing || connectingPlatform === account.type}
                          >
                            {connectingPlatform === account.type ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Connecting…
                              </>
                            ) : (
                              "Connect"
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Caption field - only show if selected and connected */}
                    {selectedTargets.has(account.id) && account.isConnected && (
                      <div>
                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">
                          Caption for {account.type === "x" ? "X" : account.type}
                        </label>
                        <textarea
                          value={captions[account.id] ?? ""}
                          onChange={(e) => handleCaptionChange(account.id, e.target.value)}
                          placeholder={`Write a caption for ${account.displayName}...`}
                          rows={3}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent p-3 text-sm focus:border-slate-900 dark:focus:border-white focus:outline-none resize-none"
                          disabled={isSharing}
                        />
                      </div>
                    )}
                  </div>
                  ))}
                  {accounts.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-slate-700">
                      No platforms available yet. Connect an account to start sharing.
                    </div>
                  )}
                </div>
              )}

              {(error || accountsError) && (
                <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {error || accountsError}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            disabled={isSharing}
            className="px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleShare}
            disabled={isSharing || selectedTargets.size === 0 || !assetUrl}
            className="px-4 py-2 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSharing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sharing...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Share
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// API helper function - placeholder for real implementation
async function sharePost(request: ShareRequest): Promise<void> {
  // In production, this would call: POST /api/share
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Simulate API call
      if (Math.random() > 0.1) {
        // 90% success rate for demo
        resolve();
      } else {
        reject(new Error("Network error. Please try again."));
      }
    }, 2000);
  });
}

// MuAnalyticsPanel Component
function MuAnalyticsPanel() {
  const { stats, loading, error } = useAgentStats();
  const fallbackStats = {
    ...emptyAgentStats,
    mu_media_edits: 124,
  };
  const latestStats = stats ?? fallbackStats;
  const noStats = !stats && !loading && !error;

  // Mock analytics data - replace with real data when available
  const mockPosts = [
    { id: "1", name: "Spring Campaign", views: 1250, clicks: 120, saves: 45, date: "2024-01-15" },
    { id: "2", name: "Product Launch", views: 890, clicks: 78, saves: 32, date: "2024-01-20" },
    { id: "3", name: "Brand Story", views: 2100, clicks: 195, saves: 87, date: "2024-01-25" },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
        <h2 className="text-xl font-semibold mb-4">Performance Overview</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 text-center dark:border-slate-800 dark:bg-slate-900/60">
            <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Total Edits</p>
            <p className="text-3xl font-semibold">{latestStats.mu_media_edits}</p>
            {loading && <p className="text-xs text-slate-400 mt-1">Loading...</p>}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 text-center dark:border-slate-800 dark:bg-slate-900/60">
            <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Total Posts</p>
            <p className="text-3xl font-semibold">{mockPosts.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 text-center dark:border-slate-800 dark:bg-slate-900/60">
            <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Total Views</p>
            <p className="text-3xl font-semibold">
              {mockPosts.reduce((sum, post) => sum + post.views, 0).toLocaleString()}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
        <h3 className="text-lg font-semibold mb-4">Posts & Interactions</h3>
        <div className="space-y-3">
          {mockPosts.map((post) => (
            <div
              key={post.id}
              className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-900/60"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold">{post.name}</p>
                  <p className="text-xs text-slate-500 mt-1">{post.date}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Views</p>
                  <p className="text-sm font-semibold mt-1">{post.views.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Clicks</p>
                  <p className="text-sm font-semibold mt-1">{post.clicks.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Saves</p>
                  <p className="text-sm font-semibold mt-1">{post.saves.toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
        <h3 className="text-lg font-semibold mb-4">Trends</h3>
        <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-8 text-center dark:border-slate-700 dark:bg-slate-900/40">
          <p className="text-sm text-slate-500">
            Analytics charts and trends will be displayed here once data is available.
          </p>
        </div>
      </section>
    </div>
  );
}

export default function StudioPage() {
  const [activeTab, setActiveTab] = useState<"edit" | "analytics">("edit");
  const { businessInfo } = useAppState();
  const { stats, loading, error } = useAgentStats();
  // Fallback to realistic random numbers if no stats available
  const fallbackStats = {
    ...emptyAgentStats,
    mu_media_edits: 124,
  };
  const latestStats = stats ?? fallbackStats;
  const noStats = !stats && !loading && !error;
  const [selectedMediaName, setSelectedMediaName] = useState<string>(mockMediaItems[0]?.filename ?? "");
  const [muImageFile, setMuImageFile] = useState<File | null>(null);
  const [muImagePreviewUrl, setMuImagePreviewUrl] = useState<string | null>(null);
  const [muMessages, setMuMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    { role: "assistant", content: "Drop an image and tell me how bold or subtle you want it." },
  ]);
  const [muInput, setMuInput] = useState("");
  const [muLoading, setMuLoading] = useState(false);
  const [muRecommendedFilters, setMuRecommendedFilters] = useState<string[]>([]);
  const [textItems, setTextItems] = useState<TextItem[]>([
    {
      id: "1",
      content: "Fresh spring launch -- open preorders now",
      color: "#FFFFFF",
      fontFamily: "Inter, sans-serif",
      fontSize: 32,
      bold: false,
      italic: false,
      underline: false,
      position: { x: 50, y: 50 },
      alignment: "center",
      effectType: "none",
      effectColor: "#000000",
      effectIntensity: 50,
      effectThickness: 2,
      highlightPadding: 4,
    },
  ]);
  const [selectedTextItemId, setSelectedTextItemId] = useState<string | null>("1");
  const [isDragging, setIsDragging] = useState(false);
  const [draggingTextItemId, setDraggingTextItemId] = useState<string | null>(null);
  const [textOverlayEnabled, setTextOverlayEnabled] = useState(true);
  const [connectedSocials, setConnectedSocials] = useState<Record<SocialPlatform, boolean>>({
    instagram: false,
    tiktok: false,
    facebook: false,
  });
  const [activityLog, setActivityLog] = useState([
    { role: "agent", text: "Drop a file and tell me how subtle or bold you want it." },
  ]);
  const [adjustments, setAdjustments] = useState<AdjustmentState>({ ...NO_OP_ADJUSTMENTS });
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [mediaItems, setMediaItems] = useState(mockMediaItems);
  const [fetchingMetrics, setFetchingMetrics] = useState<Record<string, boolean>>({});
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const handleResetAdjustments = () => {
    setAdjustments({ ...NO_OP_ADJUSTMENTS });
    setSelectedFilter(null);
  };

  const selectedTextItem = useMemo(() => {
    return textItems.find((item) => item.id === selectedTextItemId) || null;
  }, [textItems, selectedTextItemId]);

  const addTextItem = () => {
    const newId = Date.now().toString();
    const newItem: TextItem = {
      id: newId,
      content: "New text",
      color: "#FFFFFF",
      fontFamily: "Inter, sans-serif",
      fontSize: 32,
      bold: false,
      italic: false,
      underline: false,
      position: { x: 50, y: 50 },
      alignment: "center",
      effectType: "none",
      effectColor: "#000000",
      effectIntensity: 50,
      effectThickness: 2,
      highlightPadding: 4,
    };
    setTextItems((prev) => [...prev, newItem]);
    setSelectedTextItemId(newId);
  };

  const deleteTextItem = (id: string) => {
    setTextItems((prev) => prev.filter((item) => item.id !== id));
    if (selectedTextItemId === id) {
      const remaining = textItems.filter((item) => item.id !== id);
      setSelectedTextItemId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const updateTextItem = useCallback((id: string, updates: Partial<TextItem>) => {
    setTextItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  }, []);

  // Build Quick Add suggestions from business info
  const quickAddSuggestions = useMemo(() => {
    return buildQuickAddSuggestions(businessInfo, textItems);
  }, [businessInfo, textItems]);

  // Handle Quick Add chip click
  const handleQuickAddClick = (suggestion: QuickAddSuggestion) => {
    const newId = Date.now().toString();
    
    // Determine initial position based on type (stagger them to avoid overlap)
    const positionMap: Record<QuickAddSuggestion["type"], { x: number; y: number }> = {
      website: { x: 50, y: 75 },
      phone: { x: 50, y: 80 },
      companyName: { x: 50, y: 20 },
      email: { x: 50, y: 85 },
      location: { x: 50, y: 25 },
      serviceName: { x: 50, y: 30 },
    };
    
    const initialPosition = positionMap[suggestion.type] || { x: 50, y: 50 };
    
    const newItem: TextItem = {
      id: newId,
      content: suggestion.value,
      color: "#FFFFFF",
      fontFamily: "Inter, sans-serif",
      fontSize: 32,
      bold: false,
      italic: false,
      underline: false,
      position: initialPosition,
      alignment: "center",
      effectType: "none",
      effectColor: "#000000",
      effectIntensity: 50,
      effectThickness: 2,
      highlightPadding: 4,
      metaType: suggestion.type, // Track source
    };
    
    setTextItems((prev) => [...prev, newItem]);
    setSelectedTextItemId(newId);
  };

  const handleTextDragStart = (e: React.MouseEvent<HTMLDivElement>, itemId: string) => {
    if (!textOverlayEnabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDraggingTextItemId(itemId);
    const previewContainer = e.currentTarget.closest('[data-preview-container]') as HTMLElement;
    if (previewContainer) {
      const rect = previewContainer.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      updateTextItem(itemId, {
        position: {
          x: Math.max(0, Math.min(100, x)),
          y: Math.max(0, Math.min(100, y)),
        },
      });
    }
  };

  const handleTextDragEnd = () => {
    setIsDragging(false);
    setDraggingTextItemId(null);
  };

  useEffect(() => {
    if (isDragging && draggingTextItemId) {
      const handleMouseMove = (e: MouseEvent) => {
        const previewContainer = document.querySelector('[data-preview-container]') as HTMLElement;
        if (previewContainer) {
          const rect = previewContainer.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 100;
          const y = ((e.clientY - rect.top) / rect.height) * 100;
          updateTextItem(draggingTextItemId, {
            position: {
              x: Math.max(0, Math.min(100, x)),
              y: Math.max(0, Math.min(100, y)),
            },
          });
        }
      };
      const handleMouseUp = () => {
        setIsDragging(false);
        setDraggingTextItemId(null);
      };
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, draggingTextItemId, updateTextItem]);

  const handleUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedMediaName(file.name);
      setMuImageFile(file);
      if (muImagePreviewUrl) {
        URL.revokeObjectURL(muImagePreviewUrl);
      }
      handleResetAdjustments();
      // Reset all text items to center
      setTextItems((prev) =>
        prev.map((item) => ({ ...item, position: { x: 50, y: 50 } }))
      );
      const objectUrl = URL.createObjectURL(file);
      setMuImagePreviewUrl(objectUrl);
    }
  };

  useEffect(() => {
    return () => {
      if (muImagePreviewUrl) {
        URL.revokeObjectURL(muImagePreviewUrl);
      }
    };
  }, [muImagePreviewUrl]);

  const applyMuCommandFromText = (text: string) => {
    const lower = text.toLowerCase();
    let delta = 0;

    if (
      lower.includes("brighter") ||
      lower.includes("increase brightness") ||
      lower.includes("add brightness") ||
      lower.includes("more bright")
    ) {
      delta = 10;
    } else if (
      lower.includes("darker") ||
      lower.includes("reduce brightness") ||
      lower.includes("lower brightness") ||
      lower.includes("less bright")
    ) {
      delta = -10;
    }

    if (delta !== 0) {
      setAdjustments((prev) => ({
        ...prev,
        brightness: clamp(prev.brightness + delta, 0, 200),
      }));
    }
  };

  const shadowFactor = 1 + (adjustments.shadows / 100) * 0.2;
  const highlightFactor = 1 + (adjustments.highlights / 100) * 0.2;
  const computedBrightness = clamp(adjustments.brightness * shadowFactor * highlightFactor, 0, 400);
  const presetFilter =
    selectedFilter === "Monochrome" || selectedFilter === "B&W"
      ? "grayscale(100%)"
      : selectedFilter === "Sepia"
      ? "sepia(100%)"
      : selectedFilter === "Vintage"
      ? "sepia(50%) contrast(110%) brightness(90%)"
      : selectedFilter === "Dramatic"
      ? "contrast(150%) saturate(120%)"
      : selectedFilter === "Cool"
      ? "brightness(95%) saturate(80%)"
      : selectedFilter === "Warm"
      ? "brightness(105%) saturate(120%) sepia(20%)"
      : selectedFilter === "Cinematic"
      ? "contrast(120%) saturate(110%) brightness(95%)"
      : selectedFilter === "Soft"
      ? "contrast(90%) saturate(90%) brightness(105%)"
      : selectedFilter === "Vivid"
      ? "contrast(130%) saturate(150%)"
      : "";
  const isAtNoOp = useMemo(
    () =>
      Object.entries(NO_OP_ADJUSTMENTS).every(
        ([key, value]) => adjustments[key as AdjustmentKey] === value
      ) && !selectedFilter,
    [adjustments, selectedFilter]
  );

  const previewFilter = useMemo(() => {
    if (isAtNoOp) {
      return undefined;
    }

    const warmthHue = adjustments.warmth * 0.6;
    const warmthSepia = adjustments.warmth > 0 ? (adjustments.warmth / 100) * 0.3 : 0;
    const filterParts = [
      `brightness(${computedBrightness}%)`,
      `contrast(${adjustments.contrast}%)`,
      `saturate(${adjustments.saturation}%)`,
    ];

    if (adjustments.warmth !== 0) {
      filterParts.push(`hue-rotate(${warmthHue}deg)`);
      if (warmthSepia > 0) {
        filterParts.push(`sepia(${warmthSepia})`);
      }
    }

    if (presetFilter) {
      filterParts.push(presetFilter);
    }

    return filterParts.join(" ").trim();
  }, [adjustments, computedBrightness, isAtNoOp, presetFilter]);

  const previewScale = useMemo(() => clamp(1 + adjustments.zoom / 100, 0.5, 3), [adjustments.zoom]);
  const previewTransform = `scale(${previewScale})`;
  const overlayAlignmentClass: Record<OverlayAlignment, string> = {
    center: "items-center justify-center text-center px-4",
    left: "items-center justify-start text-left pl-8 pr-4",
    right: "items-center justify-end text-right pr-8 pl-4",
  };

  const handleMuSend = async () => {
    const message = muInput.trim();
    if (!message || muLoading) return;

    setMuMessages((prev) => [...prev, { role: "user", content: message }]);
    applyMuCommandFromText(message);
    setMuInput("");
    setMuLoading(true);

    try {
      const res = await fetch("/api/brain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent: "mu",
          message,
          taskType: "default",
          context: {
            brightness: adjustments.brightness,
            imagePreviewUrl: muImagePreviewUrl,
            imageName: muImageFile?.name ?? null,
          },
        }),
      });

      const json = await res.json();
      const isOk = res.ok && !json.error;

      setMuMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: isOk ? json.reply || "No reply from MU." : json.error || "Error from MU.",
        },
      ]);
    } catch (error) {
      console.error(error);
      setMuMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error talking to MU." },
      ]);
    } finally {
      setMuLoading(false);
    }
  };

  const handleSocialConnect = (platform: SocialPlatform) => {
    setConnectedSocials((prev) => ({ ...prev, [platform]: !prev[platform] }));
    if (!connectedSocials[platform]) {
      setActivityLog((prev) => [
        ...prev,
        { role: "agent", text: `Connected to ${platform}. You can now post media and fetch metrics.` },
      ]);
    }
  };

  const handleSocialUpload = (platform: SocialPlatform) => {
    // In a real implementation, this would open a modal or API to fetch media from the platform
    setActivityLog((prev) => [
      ...prev,
      { role: "user", text: `Uploading from ${platform}...` },
      { role: "agent", text: `Fetching media from ${platform}. Select the items you want to import.` },
    ]);
  };

  const handlePostToSocial = async (mediaId: string, platform: SocialPlatform) => {
    if (!connectedSocials[platform]) {
      setActivityLog((prev) => [
        ...prev,
        { role: "agent", text: `Please connect ${platform} first to post media.` },
      ]);
      return;
    }

    setActivityLog((prev) => [
      ...prev,
      { role: "user", text: `Posting to ${platform}...` },
      { role: "agent", text: `Posting media to ${platform}. This may take a moment...` },
    ]);

    // Simulate API call to post to social platform
    // In production, this would call: POST /api/social/post
    setTimeout(() => {
      const postId = `${platform}_${Date.now()}`;
      setMediaItems((prev) =>
        prev.map((item) =>
          item.id === mediaId
            ? {
                ...item,
                postedTo: [
                  ...(item.postedTo || []),
                  {
                    platform,
                    postId,
                    postedAt: new Date().toISOString(),
                  },
                ],
              }
            : item
        )
      );
      setActivityLog((prev) => [
        ...prev,
        { role: "agent", text: `Successfully posted to ${platform}! Post ID: ${postId}` },
      ]);
    }, 1500);
  };

  const fetchMetricsFromSocial = async (mediaId: string, platform: SocialPlatform, postId?: string) => {
    if (!connectedSocials[platform]) {
      setActivityLog((prev) => [
        ...prev,
        { role: "agent", text: `Please connect ${platform} first to fetch metrics.` },
      ]);
      return;
    }

    setFetchingMetrics((prev) => ({ ...prev, [`${mediaId}_${platform}`]: true }));

    // Simulate API call to fetch metrics
    // In production, this would call: GET /api/social/metrics?platform=${platform}&postId=${postId}
    setTimeout(() => {
      // Simulate fetching real metrics (in production, these would come from the API)
      const mockMetrics = {
        impressions: Math.floor(Math.random() * 20000) + 5000,
        likes: Math.floor(Math.random() * 1000) + 100,
        reposts: Math.floor(Math.random() * 200) + 20,
        comments: Math.floor(Math.random() * 150) + 10,
      };

      setMediaItems((prev) =>
        prev.map((item) => {
          if (item.id === mediaId) {
            // Aggregate metrics from all platforms
            const existingMetrics = {
              impressions: item.impressions || 0,
              likes: item.likes || 0,
              reposts: item.reposts || 0,
              comments: item.comments || 0,
            };

            return {
              ...item,
              impressions: existingMetrics.impressions + mockMetrics.impressions,
              likes: existingMetrics.likes + mockMetrics.likes,
              reposts: existingMetrics.reposts + mockMetrics.reposts,
              comments: existingMetrics.comments + mockMetrics.comments,
              metricsLastUpdated: new Date().toISOString(),
            };
          }
          return item;
        })
      );

      setFetchingMetrics((prev) => ({ ...prev, [`${mediaId}_${platform}`]: false }));
      setActivityLog((prev) => [
        ...prev,
        { role: "agent", text: `Updated metrics from ${platform}: ${mockMetrics.likes} likes, ${mockMetrics.comments} comments` },
      ]);
    }, 1000);
  };

  const syncAllMetrics = async (mediaId: string) => {
    const item = mediaItems.find((m) => m.id === mediaId);
    if (!item?.postedTo) return;

    for (const post of item.postedTo) {
      await fetchMetricsFromSocial(mediaId, post.platform, post.postId);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm uppercase tracking-widest text-slate-500">Studio agent</p>
        <h1 className="text-3xl font-semibold">Media & branding workspace</h1>
      </header>

      {/* Tab Bar */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("edit")}
            className={`px-4 py-2 text-sm font-semibold transition ${
              activeTab === "edit"
                ? "border-b-2 border-slate-900 text-slate-900 dark:border-white dark:text-white"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
            }`}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("analytics")}
            className={`px-4 py-2 text-sm font-semibold transition ${
              activeTab === "analytics"
                ? "border-b-2 border-slate-900 text-slate-900 dark:border-white dark:text-white"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
            }`}
          >
            Analytics
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mu-content">
        {activeTab === "edit" && (
          <>
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-8 text-center text-sm shadow-sm dark:border-slate-700/80 dark:bg-slate-900/40">
            <p className="font-semibold">Drop image or video</p>
            <p className="mt-2 text-slate-500">
              Mu only applies filters, zoom, crops, and text overlays--never changes the original.
            </p>
            <label className="mt-6 inline-flex cursor-pointer items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white dark:bg-white dark:text-slate-900">
              Browse files
              <input type="file" accept="image/*,video/*" className="hidden" onChange={handleUpload} />
            </label>
            {selectedMediaName && <p className="mt-4 text-xs text-slate-500">Selected: {selectedMediaName}</p>}
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Text overlay</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={textOverlayEnabled}
                  onChange={(e) => setTextOverlayEnabled(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 dark:border-slate-600 dark:bg-slate-800"
                />
                <span className="text-sm text-slate-600 dark:text-slate-300">Enable overlay</span>
              </label>
            </div>
            {textOverlayEnabled && (
              <>
                {/* Text Items List */}
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Text Items</p>
                    <button
                      type="button"
                      onClick={addTextItem}
                      className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
                    >
                      <Plus className="h-3 w-3" />
                      Add text
                    </button>
                  </div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {textItems.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-center gap-2 rounded-xl border p-2 cursor-pointer transition ${
                          selectedTextItemId === item.id
                            ? "border-slate-900 bg-slate-100 dark:border-white dark:bg-slate-800"
                            : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                        }`}
                        onClick={() => setSelectedTextItemId(item.id)}
                      >
                        <div
                          className="w-3 h-3 rounded border border-slate-300 dark:border-slate-600"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="flex-1 text-xs truncate">
                          {item.content || "Empty text"}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTextItem(item.id);
                          }}
                          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                        >
                          <Trash2 className="h-3 w-3 text-slate-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Selected Text Item Controls */}
                {selectedTextItem && (
                  <>
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                      <label className="text-sm font-semibold mb-2 block">Text Content</label>
                      <textarea
                        value={selectedTextItem.content}
                        onChange={(event) =>
                          updateTextItem(selectedTextItem.id, { content: event.target.value })
                        }
                        rows={3}
                        className="w-full rounded-2xl border border-slate-200 bg-transparent p-3 text-sm focus:border-brand-accent focus:outline-none dark:border-slate-700"
                        placeholder="Enter text..."
                      />
                      <p className="mt-2 text-xs text-slate-500">
                        💡 Drag the text in the preview to reposition it
                      </p>
                    </div>

                    <div className="mt-4 space-y-3">
                      <div>
                        <label className="text-sm font-semibold mb-2 block">Color</label>
                        <ColorPicker
                          color={selectedTextItem.color}
                          onChange={(color) => updateTextItem(selectedTextItem.id, { color })}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-semibold mb-2 block">Font Family</label>
                        <select
                          className="w-full rounded-2xl border border-slate-200 bg-transparent p-2 text-sm dark:border-slate-700"
                          value={selectedTextItem.fontFamily}
                          onChange={(event) =>
                            updateTextItem(selectedTextItem.id, { fontFamily: event.target.value })
                          }
                        >
                          <option value="sans-serif">System Sans</option>
                          <option value="Inter, sans-serif">Inter</option>
                          <option value="'Work Sans', sans-serif">Work Sans</option>
                          <option value="'Space Grotesk', sans-serif">Space Grotesk</option>
                          <option value="'Roboto', sans-serif">Roboto</option>
                          <option value="'Open Sans', sans-serif">Open Sans</option>
                          <option value="'Montserrat', sans-serif">Montserrat</option>
                          <option value="'Poppins', sans-serif">Poppins</option>
                          <option value="'Playfair Display', serif">Playfair Display</option>
                          <option value="'Merriweather', serif">Merriweather</option>
                          <option value="'Georgia', serif">Georgia</option>
                          <option value="'Courier New', monospace">Courier New</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-sm font-semibold mb-2 block">
                          Font Size: {selectedTextItem.fontSize}px
                        </label>
                        <input
                          type="range"
                          min={12}
                          max={72}
                          value={selectedTextItem.fontSize}
                          onChange={(event) =>
                            updateTextItem(selectedTextItem.id, {
                              fontSize: Number(event.target.value),
                            })
                          }
                          className="w-full"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-semibold mb-2 block">Font Styles</label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              updateTextItem(selectedTextItem.id, {
                                bold: !selectedTextItem.bold,
                              })
                            }
                            className={`flex-1 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                              selectedTextItem.bold
                                ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white"
                                : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                            }`}
                          >
                            <Bold className="h-4 w-4 mx-auto" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateTextItem(selectedTextItem.id, {
                                italic: !selectedTextItem.italic,
                              })
                            }
                            className={`flex-1 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                              selectedTextItem.italic
                                ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white"
                                : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                            }`}
                          >
                            <Italic className="h-4 w-4 mx-auto" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateTextItem(selectedTextItem.id, {
                                underline: !selectedTextItem.underline,
                              })
                            }
                            className={`flex-1 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                              selectedTextItem.underline
                                ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white"
                                : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                            }`}
                          >
                            <Underline className="h-4 w-4 mx-auto" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-semibold mb-2 block">Quick Position</label>
                        <select
                          className="w-full rounded-2xl border border-slate-200 bg-transparent p-2 text-sm dark:border-slate-700"
                          value={selectedTextItem.alignment}
                          onChange={(event) => {
                            const alignment = event.target.value as OverlayAlignment;
                            updateTextItem(selectedTextItem.id, { alignment });
                            if (alignment === "center") {
                              updateTextItem(selectedTextItem.id, { position: { x: 50, y: 50 } });
                            } else if (alignment === "left") {
                              updateTextItem(selectedTextItem.id, { position: { x: 10, y: 50 } });
                            } else if (alignment === "right") {
                              updateTextItem(selectedTextItem.id, { position: { x: 90, y: 50 } });
                            }
                          }}
                        >
                          <option value="center">Center</option>
                          <option value="left">Left</option>
                          <option value="right">Right</option>
                        </select>
                      </div>

                      {/* Text Effects */}
                      <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                        <label className="text-sm font-semibold mb-2 block">Text Effect</label>
                        <select
                          className="w-full rounded-2xl border border-slate-200 bg-transparent p-2 text-sm dark:border-slate-700 mb-3"
                          value={selectedTextItem.effectType || "none"}
                          onChange={(event) => {
                            const effectType = event.target.value as TextItem["effectType"];
                            updateTextItem(selectedTextItem.id, {
                              effectType: effectType || "none",
                            });
                          }}
                        >
                          <option value="none">None</option>
                          <option value="glow">Glow</option>
                          <option value="outline">Outline</option>
                          <option value="highlight">Highlight</option>
                          <option value="shadow">Shadow</option>
                        </select>

                        {selectedTextItem.effectType &&
                          selectedTextItem.effectType !== "none" && (
                            <>
                              <div className="mb-3">
                                <label className="text-sm font-semibold mb-2 block">
                                  Effect Color
                                </label>
                                <ColorPicker
                                  color={selectedTextItem.effectColor || "#000000"}
                                  onChange={(color) =>
                                    updateTextItem(selectedTextItem.id, { effectColor: color })
                                  }
                                />
                              </div>

                              <div className="mb-3">
                                <label className="text-sm font-semibold mb-2 block">
                                  Intensity: {selectedTextItem.effectIntensity ?? 50}%
                                </label>
                                <input
                                  type="range"
                                  min={0}
                                  max={100}
                                  value={selectedTextItem.effectIntensity ?? 50}
                                  onChange={(event) =>
                                    updateTextItem(selectedTextItem.id, {
                                      effectIntensity: Number(event.target.value),
                                    })
                                  }
                                  className="w-full"
                                />
                              </div>

                              {selectedTextItem.effectType === "outline" && (
                                <div className="mb-3">
                                  <label className="text-sm font-semibold mb-2 block">
                                    Thickness: {selectedTextItem.effectThickness ?? 2}px
                                  </label>
                                  <input
                                    type="range"
                                    min={0}
                                    max={10}
                                    value={selectedTextItem.effectThickness ?? 2}
                                    onChange={(event) =>
                                      updateTextItem(selectedTextItem.id, {
                                        effectThickness: Number(event.target.value),
                                      })
                                    }
                                    className="w-full"
                                  />
                                </div>
                              )}

                              {selectedTextItem.effectType === "highlight" && (
                                <div className="mb-3">
                                  <label className="text-sm font-semibold mb-2 block">
                                    Padding: {selectedTextItem.highlightPadding ?? 4}px
                                  </label>
                                  <input
                                    type="range"
                                    min={0}
                                    max={20}
                                    value={selectedTextItem.highlightPadding ?? 4}
                                    onChange={(event) =>
                                      updateTextItem(selectedTextItem.id, {
                                        highlightPadding: Number(event.target.value),
                                      })
                                    }
                                    className="w-full"
                                  />
                                </div>
                              )}
                            </>
                          )}
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
          <h3 className="text-lg font-semibold mb-4">Live Preview</h3>
            <div
              data-preview-container
              className="relative rounded-2xl overflow-hidden bg-white dark:bg-slate-900 flex items-center justify-center shadow-inner"
              style={{ aspectRatio: "16/9", minHeight: "320px" }}
            >
              {muImagePreviewUrl ? (
                <>
                  <img
                    src={muImagePreviewUrl}
                    alt="Preview"
                    className="h-full w-full object-contain transition-all duration-200"
                    style={{
                      ...(previewFilter && { filter: previewFilter }),
                      ...(previewTransform && { transform: previewTransform }),
                      transformOrigin: "center center",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setIsPreviewModalOpen(true)}
                    className="absolute top-3 right-3 rounded-full bg-white/80 p-2 text-slate-700 shadow hover:bg-white dark:bg-slate-900/70 dark:hover:bg-slate-900"
                    aria-label="Expand preview"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </button>
                  {textOverlayEnabled &&
                    textItems.map((item) => {
                      const textStyle = getTextItemStyle(item);
                      const isSelected = selectedTextItemId === item.id;
                      return (
                        <div
                          key={item.id}
                          className={`absolute select-none ${
                            isDragging && draggingTextItemId === item.id
                              ? "cursor-grabbing"
                              : "cursor-grab"
                          }`}
                          style={{
                            left: `${item.position.x}%`,
                            top: `${item.position.y}%`,
                            transform: "translate(-50%, -50%)",
                            pointerEvents: "auto",
                          }}
                          onMouseDown={(e) => handleTextDragStart(e, item.id)}
                          onClick={() => setSelectedTextItemId(item.id)}
                        >
                          <p
                            className="whitespace-nowrap"
                            style={{
                              ...textStyle,
                              border: isSelected ? "2px dashed rgba(255,255,255,0.5)" : "none",
                              ...(isSelected &&
                                item.effectType !== "highlight" && { padding: "2px" }),
                            }}
                          >
                            {item.content || "Empty text"}
                          </p>
                        </div>
                      );
                    })}
                </>
              ) : (
                <p className="text-sm text-slate-500">Upload an image to see the live preview.</p>
              )}
            </div>
            
            {/* Quick Add Chips */}
            {quickAddSuggestions.length > 0 && muImagePreviewUrl && (
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-slate-500" />
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Quick Add
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {quickAddSuggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      type="button"
                      onClick={() => handleQuickAddClick(suggestion)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:border-slate-600"
                    >
                      <Plus className="h-3 w-3" />
                      {suggestion.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (!muImagePreviewUrl) return;
                    const link = document.createElement("a");
                    link.href = muImagePreviewUrl;
                    link.download = "mu-image.png";
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  disabled={!muImagePreviewUrl}
                  className={`inline-flex items-center gap-2 text-sm font-semibold ${
                    muImagePreviewUrl
                      ? "text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white"
                      : "text-slate-400 cursor-not-allowed"
                  }`}
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(true)}
                  disabled={!muImagePreviewUrl}
                  className={`inline-flex items-center gap-2 text-sm font-semibold ${
                    muImagePreviewUrl
                      ? "text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white"
                      : "text-slate-400 cursor-not-allowed"
                  }`}
                >
                  <Send className="h-4 w-4" />
                  Share
                </button>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Recent media</h3>
            </div>
            <ul className="mt-3 space-y-3 text-sm">
              {mediaItems.map((item) => {
                const isPostedToInstagram = item.postedTo?.some((p) => p.platform === "instagram");
                const isPostedToTikTok = item.postedTo?.some((p) => p.platform === "tiktok");
                const isPostedToFacebook = item.postedTo?.some((p) => p.platform === "facebook");
                const isFetching = Object.keys(fetchingMetrics).some((key) => key.startsWith(`${item.id}_`));

                return (
                  <li key={item.id} className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-semibold">{item.filename}</p>
                        <p className="text-xs text-slate-500 mt-1">{item.updatedAt}</p>
                        {item.metricsLastUpdated && (
                          <p className="text-xs text-slate-400 mt-1">
                            Metrics updated: {new Date(item.metricsLastUpdated).toLocaleTimeString()}
                          </p>
                        )}
                      </div>
                      <span className="text-xs uppercase tracking-wide text-slate-500 px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800">
                        {item.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-3 mb-3 flex-wrap">
                      <span className="text-xs text-slate-500">Post to:</span>
                      <button
                        onClick={() => handlePostToSocial(item.id, "instagram")}
                        disabled={!connectedSocials.instagram || isPostedToInstagram}
                        className={`text-xs px-2 py-1 rounded-full transition ${
                          isPostedToInstagram
                            ? "bg-gradient-to-br from-purple-600 to-pink-600 text-white"
                            : connectedSocials.instagram
                            ? "border border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                            : "border border-slate-200 opacity-50 cursor-not-allowed dark:border-slate-700"
                        }`}
                      >
                        <Instagram size={12} className="inline mr-1" />
                        Instagram
                      </button>
                      <button
                        onClick={() => handlePostToSocial(item.id, "tiktok")}
                        disabled={!connectedSocials.tiktok || isPostedToTikTok}
                        className={`text-xs px-2 py-1 rounded-full transition ${
                          isPostedToTikTok
                            ? "bg-black text-white"
                            : connectedSocials.tiktok
                            ? "border border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                            : "border border-slate-200 opacity-50 cursor-not-allowed dark:border-slate-700"
                        }`}
                      >
                        TikTok
                      </button>
                      <button
                        onClick={() => handlePostToSocial(item.id, "facebook")}
                        disabled={!connectedSocials.facebook || isPostedToFacebook}
                        className={`text-xs px-2 py-1 rounded-full transition ${
                          isPostedToFacebook
                            ? "bg-blue-600 text-white"
                            : connectedSocials.facebook
                            ? "border border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                            : "border border-slate-200 opacity-50 cursor-not-allowed dark:border-slate-700"
                        }`}
                      >
                        <Facebook size={12} className="inline mr-1" />
                        Facebook
                      </button>
                      {item.postedTo && item.postedTo.length > 0 && (
                        <button
                          onClick={() => syncAllMetrics(item.id)}
                          disabled={isFetching}
                          className="text-xs px-2 py-1 rounded-full border border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 disabled:opacity-50"
                        >
                          {isFetching ? "Syncing..." : "Sync Metrics"}
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Impressions</p>
                        <p className="text-sm font-semibold mt-1">{item.impressions?.toLocaleString() || "0"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Likes</p>
                        <p className="text-sm font-semibold mt-1">{item.likes?.toLocaleString() || "0"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Reposts</p>
                        <p className="text-sm font-semibold mt-1">{item.reposts?.toLocaleString() || "0"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Comments</p>
                        <p className="text-sm font-semibold mt-1">{item.comments?.toLocaleString() || "0"}</p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
            <h3 className="text-lg font-semibold">Agent chat</h3>
            <div className="mt-3 space-y-2 max-h-72 overflow-y-auto text-sm">
              {muMessages.map((message, index) => (
                <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <span
                    className={`rounded-2xl px-3 py-2 ${
                      message.role === "user"
                        ? "bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-200"
                        : "bg-slate-900/90 text-white dark:bg-slate-800"
                    }`}
                  >
                    {message.content}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <input
                className="flex-1 rounded-2xl border border-slate-200 bg-transparent px-4 py-2 text-sm focus:border-brand-accent focus:outline-none dark:border-slate-700"
                placeholder="Add a tweak request..."
                value={muInput}
                onChange={(event) => setMuInput(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && handleMuSend()}
              />
              <button
                type="button"
                onClick={handleMuSend}
                disabled={muLoading}
                className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 dark:bg-white dark:text-slate-900"
              >
                {muLoading ? "Thinking…" : "Send"}
              </button>
            </div>
            <div className="mt-6 border-t border-slate-200 pt-4 dark:border-slate-800">
              <p className="text-sm font-semibold mb-3">Automation updates</p>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {activityLog.map((message, index) => (
                  <div
                    key={index}
                    className={`rounded-2xl px-4 py-3 text-sm ${
                      message.role === "agent"
                        ? "bg-slate-900/90 text-white dark:bg-slate-800"
                        : "bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-200"
                    }`}
                  >
                    {message.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold">Adjustments</h3>
              <button
                type="button"
                onClick={handleResetAdjustments}
                disabled={isAtNoOp || !muImagePreviewUrl}
                className={`text-xs font-semibold rounded-full px-3 py-1 border ${
                  isAtNoOp || !muImagePreviewUrl
                    ? "text-slate-400 border-slate-200 dark:border-slate-700 dark:text-slate-500 cursor-not-allowed"
                    : "text-slate-700 border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                Reset to Original
              </button>
            </div>
            {adjustmentKeys.map((key) => {
              const slider = adjustmentSliderConfig[key];
              return (
                <label key={key} className="mt-3 block text-sm font-semibold capitalize">
                  {slider.label}
                  <input
                    type="range"
                    min={slider.min}
                    max={slider.max}
                    step={slider.step ?? 1}
                    value={adjustments[key]}
                    onChange={(event) =>
                      setAdjustments((prev) => ({ ...prev, [key]: Number(event.target.value) }))
                    }
                    className="mt-2 w-full"
                  />
                </label>
              );
            })}
            <div className="mt-4">
              <p className="text-sm font-semibold mb-3">Filters</p>
              <div className="grid grid-cols-2 gap-2">
                {filters.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setSelectedFilter(selectedFilter === filter ? null : filter)}
                    className={`rounded-2xl border px-3 py-2 text-sm font-semibold transition ${
                      selectedFilter === filter
                        ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white"
                        : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
            <h3 className="text-lg font-semibold mb-4">Connect Social Media</h3>
            <p className="text-sm text-slate-500 mb-4">Connect your accounts to upload media directly from social platforms</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 p-2">
                    <Instagram size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Instagram</p>
                    <p className="text-xs text-slate-500">
                      {connectedSocials.instagram ? "Connected" : "Not connected"}
                    </p>
                  </div>
                </div>
                {connectedSocials.instagram ? (
                  <button
                    onClick={() => handleSocialUpload("instagram")}
                    className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
                  >
                    Upload
                  </button>
                ) : (
                  <button
                    onClick={() => handleSocialConnect("instagram")}
                    className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                  >
                    Connect
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-black p-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">TikTok</p>
                    <p className="text-xs text-slate-500">
                      {connectedSocials.tiktok ? "Connected" : "Not connected"}
                    </p>
                  </div>
                </div>
                {connectedSocials.tiktok ? (
                  <button
                    onClick={() => handleSocialUpload("tiktok")}
                    className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
                  >
                    Upload
                  </button>
                ) : (
                  <button
                    onClick={() => handleSocialConnect("tiktok")}
                    className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                  >
                    Connect
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-blue-600 p-2">
                    <Facebook size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Facebook</p>
                    <p className="text-xs text-slate-500">
                      {connectedSocials.facebook ? "Connected" : "Not connected"}
                    </p>
                  </div>
                </div>
                {connectedSocials.facebook ? (
                  <button
                    onClick={() => handleSocialUpload("facebook")}
                    className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
                  >
                    Upload
                  </button>
                ) : (
                  <button
                    onClick={() => handleSocialConnect("facebook")}
                    className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                  >
                    Connect
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        </>
        )}
        {activeTab === "analytics" && <MuAnalyticsPanel />}
      </div>
      {isPreviewModalOpen && muImagePreviewUrl && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setIsPreviewModalOpen(false)}
          />
          <div className="relative z-50 flex items-center justify-center w-full h-full px-4">
            <img
              src={muImagePreviewUrl}
              alt="Expanded preview"
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-2xl"
              style={{
                ...(previewFilter && { filter: previewFilter }),
                ...(previewTransform && { transform: previewTransform }),
                transformOrigin: "center center",
              }}
            />
            {textOverlayEnabled &&
              textItems.map((item) => {
                const textStyle = getTextItemStyle(item);
                return (
                  <div
                    key={item.id}
                    className="absolute pointer-events-none select-none"
                    style={{
                      left: `${item.position.x}%`,
                      top: `${item.position.y}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    <p
                      className="whitespace-nowrap"
                      style={{
                        ...textStyle,
                        fontSize: `${(item.fontSize || 32) + 6}px`,
                      }}
                    >
                      {item.content || "Empty text"}
                    </p>
                  </div>
                );
              })}
            <button
              type="button"
              onClick={() => setIsPreviewModalOpen(false)}
              className="absolute top-4 right-4 px-3 py-1 rounded-full bg-black/60 text-white text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}
      <MuShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        assetUrl={muImagePreviewUrl}
        assetName={selectedMediaName}
      />
    </div>
  );
}
