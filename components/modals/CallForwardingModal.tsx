"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { Copy, Check } from "lucide-react";

interface CallForwardingModalProps {
  open: boolean;
  onClose: () => void;
  alohaPhoneNumber: string;
  onConfirmSetup: () => Promise<void>;
}

export default function CallForwardingModal({
  open,
  onClose,
  alohaPhoneNumber,
  onConfirmSetup,
}: CallForwardingModalProps) {
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(alohaPhoneNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmSetup = async () => {
    try {
      setSaving(true);
      await onConfirmSetup();
      onClose();
    } catch (error) {
      console.error("Error confirming forwarding setup:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Set up call forwarding to Aloha"
      open={open}
      onClose={onClose}
      size="lg"
    >
      <div className="space-y-6">
        {/* Explanation */}
        <div className="space-y-3">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            To have Aloha answer missed calls on your existing phone number, you&apos;ll need to enable call forwarding with your mobile carrier so that unanswered or busy calls are forwarded to this Aloha number.
          </p>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Use this number as your forwarding destination:
            </p>
            <div className="flex items-center gap-2">
              <code className="text-lg font-mono font-semibold text-slate-900 dark:text-slate-100">
                {alohaPhoneNumber}
              </code>
              <button
                onClick={handleCopyNumber}
                className="flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
              >
                {copied ? (
                  <>
                    <Check size={14} />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            How to set up call forwarding:
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <li>Open your Phone app.</li>
            <li>Go to Settings → Call Forwarding or Supplementary Services.</li>
            <li>Choose &apos;Forward when busy&apos; and/or &apos;Forward when unanswered&apos;.</li>
            <li>Enter <code className="font-mono text-slate-900 dark:text-slate-100">{alohaPhoneNumber}</code> as the forwarding destination.</li>
            <li>Save your changes.</li>
          </ol>
          <p className="text-xs text-slate-500 dark:text-slate-400 italic">
            Note: Exact steps vary by carrier and device.
          </p>
        </div>

        {/* Footer buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleConfirmSetup}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-brand-accent hover:bg-brand-accent/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "I've set up forwarding"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

