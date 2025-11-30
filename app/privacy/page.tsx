"use client";

import { useTranslation } from "@/hooks/useTranslation";
import { Shield } from "lucide-react";

export default function PrivacyPage() {
  const t = useTranslation();

  const sections = [
    {
      title: t("privacySection1Title"),
      content: t("privacySection1Content"),
    },
    {
      title: t("privacySection2Title"),
      content: t("privacySection2Content"),
    },
    {
      title: t("privacySection3Title"),
      content: t("privacySection3Content"),
    },
    {
      title: t("privacySection4Title"),
      content: t("privacySection4Content"),
    },
    {
      title: t("privacySection5Title"),
      content: t("privacySection5Content"),
    },
    {
      title: t("privacySection6Title"),
      content: t("privacySection6Content"),
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-black dark:text-slate-100">
      {/* Hero Section */}
      <div className="border-b border-slate-200 dark:border-slate-800/50">
        <div className="pt-8 sm:pt-12 pb-12 sm:pb-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <Shield className="h-6 w-6 text-blue-500" />
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight bg-gradient-to-br from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
                {t("privacyPageTitle")}
              </h1>
            </div>
            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 font-light leading-relaxed">
              {t("privacyPageDescription")}
            </p>
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              {t("privacyLastUpdated")}
            </p>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {sections.map((section, index) => (
              <div
                key={index}
                className="p-6 sm:p-8 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700/50 transition-all duration-300"
              >
                <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-slate-900 dark:text-slate-100">
                  {section.title}
                </h2>
                <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                  {section.content}
                </p>
              </div>
            ))}
          </div>

          {/* Contact Section */}
          <div className="mt-12 p-6 sm:p-8 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-slate-200 dark:border-slate-800/50">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-slate-900 dark:text-slate-100">
              {t("privacyContactTitle")}
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              {t("privacyContactDescription")}
            </p>
            <p className="text-base text-slate-600 dark:text-slate-300">
              <strong className="text-slate-900 dark:text-slate-100">Email:</strong>{" "}
              <a
                href="mailto:privacy@ovrsee.dev"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                privacy@ovrsee.dev
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

