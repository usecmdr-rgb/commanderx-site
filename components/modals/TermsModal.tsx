"use client";

import Modal from "@/components/ui/Modal";
import { useAppState } from "@/context/AppStateContext";

const statements = [
  'CommanderX is provided "as is" and "as available" without any warranties of any kind.',
  "The service uses experimental AI models which may generate incorrect, incomplete, or misleading information. Outputs should not be relied on as professional advice (including but not limited to legal, financial, medical, or HR advice).",
  "Users remain solely responsible for any decisions or actions they take based on the service's outputs.",
  "CommanderX is not responsible for missed calls, missed emails, calendar errors, or any loss, damage, or liability arising from delays, inaccuracies, or omissions in the service.",
  "Users are responsible for reviewing and verifying any AI-generated drafts, summaries, or suggested actions before sending or acting on them.",
  "Users must ensure they have the necessary rights and permissions to provide any data, media, or content they upload and must not upload illegal or infringing content.",
  "CommanderX may store and process user data to provide and improve the service, in accordance with a separate Privacy Policy.",
  "Access to the service is subscription-based. Users are responsible for cancelling subscriptions if they no longer wish to be billed. Fees are generally non-refundable except where required by applicable law.",
  "CommanderX may modify or discontinue features at any time and may update these Terms periodically.",
  "To the maximum extent permitted by law, CommanderX's total liability for any claims related to the service is limited to the amount the user paid for the service in the 3 months preceding the claim.",
  "Users agree to use the service in compliance with all applicable laws and regulations.",
  "This text is a placeholder and should be replaced or reviewed by a qualified attorney before production use.",
];

const TermsModal = () => {
  const { showTermsModal, setShowTermsModal } = useAppState();

  return (
    <Modal
      title="CommanderX Terms of Service"
      description="Placeholder legal copy. Please review with counsel before launch."
      open={showTermsModal}
      onClose={() => setShowTermsModal(false)}
      size="lg"
    >
      <ol className="space-y-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        {statements.map((text, index) => (
          <li key={text} className="flex items-start gap-2">
            <span className="font-semibold">{index + 1}.</span>
            <span>{text}</span>
          </li>
        ))}
      </ol>
    </Modal>
  );
};

export default TermsModal;
