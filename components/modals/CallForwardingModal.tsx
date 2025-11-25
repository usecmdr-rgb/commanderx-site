"use client";

import Modal from "@/components/ui/Modal";

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
  const handleConfirm = async () => {
    try {
      await onConfirmSetup();
      onClose();
    } catch (error) {
      console.error("Error confirming forwarding:", error);
    }
  };

  return (
    <Modal
      title="How to Set Up Call Forwarding"
      description="Forward missed calls from your phone to Aloha"
      open={open}
      onClose={onClose}
      size="lg"
    >
      <div className="space-y-6">
        <div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            To have Aloha handle your missed calls, enable call forwarding on your phone to this number:
          </p>
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <p className="font-mono font-semibold text-lg text-slate-900 dark:text-slate-100">
              {alohaPhoneNumber}
            </p>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-3">Instructions by Phone Type:</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-2">iPhone:</h4>
              <ol className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-decimal list-inside">
                <li>Open Settings → Phone</li>
                <li>Tap Call Forwarding</li>
                <li>Toggle Call Forwarding ON</li>
                <li>Enter {alohaPhoneNumber}</li>
                <li>Or use: Forward When Busy / Forward When Unanswered</li>
              </ol>
            </div>

            <div>
              <h4 className="font-medium text-sm mb-2">Android:</h4>
              <ol className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-decimal list-inside">
                <li>Open Phone app → Settings (three dots)</li>
                <li>Tap Calls → Call forwarding</li>
                <li>Select Forward when unanswered or Forward when busy</li>
                <li>Enter {alohaPhoneNumber}</li>
                <li>Tap Enable</li>
              </ol>
            </div>

            <div>
              <h4 className="font-medium text-sm mb-2">Other Phones:</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Look for &quot;Call Forwarding&quot; or &quot;Call Settings&quot; in your phone settings.
                Enable forwarding for &quot;When Unanswered&quot; or &quot;When Busy&quot; and enter the Aloha number above.
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Note:</strong> Once you&apos;ve set up forwarding on your phone, click &quot;I&apos;ve Set This Up&quot; below.
            Aloha will then handle calls forwarded to {alohaPhoneNumber}.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 transition-colors"
          >
            I&apos;ve Set This Up
          </button>
        </div>
      </div>
    </Modal>
  );
}
