"use client";

import { useTranslation } from "@/hooks/useTranslation";
import { Shield } from "lucide-react";

export default function PrivacyPage() {
  const t = useTranslation();

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
          <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
            {/* Overview */}
            <div className="p-6 sm:p-8 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/50">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-slate-100">1. {t("privacySection1Title")}</h2>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                {t("privacySection1Content")}
              </p>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                {t("privacySection1Content2")}
              </p>
            </div>

            {/* Information We Collect */}
            <div className="p-6 sm:p-8 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/50">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-slate-100">2. {t("privacySection2Title")}</h2>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                {t("privacySection2Content")}
              </p>
              
              <h3 className="text-xl font-semibold mt-6 mb-3 text-slate-900 dark:text-slate-100">2.1 {t("privacySection2_1Title")}</h3>
              <ul className="list-disc list-inside space-y-2 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed ml-4">
                <li>{t("privacySection2_1Item1")}</li>
                <li>{t("privacySection2_1Item2")}</li>
                <li>{t("privacySection2_1Item3")}</li>
                <li>{t("privacySection2_1Item4")}</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-slate-900 dark:text-slate-100">2.2 {t("privacySection2_2Title")}</h3>
              <ul className="list-disc list-inside space-y-2 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed ml-4">
                <li>{t("privacySection2_2Item1")}</li>
                <li>{t("privacySection2_2Item2")}</li>
                <li>{t("privacySection2_2Item3")}</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-slate-900 dark:text-slate-100">2.3 {t("privacySection2_3Title")}</h3>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                {t("privacySection2_3Content")}
              </p>
              <ul className="list-disc list-inside space-y-2 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed ml-4">
                <li>{t("privacySection2_3Item1")}</li>
                <li>{t("privacySection2_3Item2")}</li>
                <li>{t("privacySection2_3Item3")}</li>
                <li>{t("privacySection2_3Item4")}</li>
                <li>{t("privacySection2_3Item5")}</li>
              </ul>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mt-4">
                {t("privacySection2_3Note")}
              </p>
            </div>

            {/* How We Use Information */}
            <div className="p-6 sm:p-8 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/50">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-slate-100">3. {t("privacySection3Title")}</h2>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                {t("privacySection3Content")}
              </p>
              <ul className="list-disc list-inside space-y-2 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed ml-4">
                <li>{t("privacySection3Item1")}</li>
                <li>{t("privacySection3Item2")}</li>
                <li>{t("privacySection3Item3")}</li>
                <li>{t("privacySection3Item4")}</li>
                <li>{t("privacySection3Item5")}</li>
                <li>{t("privacySection3Item6")}</li>
                <li>{t("privacySection3Item7")}</li>
                <li>{t("privacySection3Item8")}</li>
              </ul>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mt-4 font-semibold">
                {t("privacySection3Note")}
              </p>
            </div>

            {/* How We Share Information */}
            <div className="p-6 sm:p-8 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/50">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-slate-100">4. {t("privacySection4Title")}</h2>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                {t("privacySection4Content")}
              </p>
              <ul className="list-disc list-inside space-y-2 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed ml-4">
                <li>{t("privacySection4Item1")}</li>
                <li>{t("privacySection4Item2")}</li>
                <li>{t("privacySection4Item3")}</li>
                <li>{t("privacySection4Item4")}</li>
              </ul>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mt-4 font-semibold">
                {t("privacySection4Note")}
              </p>
            </div>

            {/* Data Retention */}
            <div className="p-6 sm:p-8 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/50">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-slate-100">5. {t("privacySection5Title")}</h2>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                {t("privacySection5Content")}
              </p>
              <ul className="list-disc list-inside space-y-2 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed ml-4">
                <li>{t("privacySection5Item1")}</li>
                <li>{t("privacySection5Item2")}</li>
                <li>{t("privacySection5Item3")}</li>
                <li>{t("privacySection5Item4")}</li>
              </ul>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mt-4">
                {t("privacySection5Note")}
              </p>
            </div>

            {/* Security */}
            <div className="p-6 sm:p-8 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/50">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-slate-100">6. {t("privacySection6Title")}</h2>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                {t("privacySection6Content")}
              </p>
              <ul className="list-disc list-inside space-y-2 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed ml-4">
                <li>{t("privacySection6Item1")}</li>
                <li>{t("privacySection6Item2")}</li>
                <li>{t("privacySection6Item3")}</li>
                <li>{t("privacySection6Item4")}</li>
                <li>{t("privacySection6Item5")}</li>
              </ul>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mt-4">
                {t("privacySection6Note")}
              </p>
            </div>

            {/* Your Rights */}
            <div className="p-6 sm:p-8 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/50">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-slate-100">7. {t("privacySection7Title")}</h2>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                {t("privacySection7Content")}
              </p>
              <ul className="list-disc list-inside space-y-2 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed ml-4">
                <li>{t("privacySection7Item1")}</li>
                <li>{t("privacySection7Item2")}</li>
                <li>{t("privacySection7Item3")}</li>
                <li>{t("privacySection7Item4")}</li>
                <li>{t("privacySection7Item5")}</li>
              </ul>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mt-4">
                {t("privacySection7Note")}
              </p>
            </div>

            {/* Children's Privacy */}
            <div className="p-6 sm:p-8 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/50">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-slate-100">8. {t("privacySection8Title")}</h2>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                {t("privacySection8Content")}
              </p>
            </div>

            {/* International Data Transfers */}
            <div className="p-6 sm:p-8 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/50">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-slate-100">9. {t("privacySection9Title")}</h2>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                {t("privacySection9Content")}
              </p>
            </div>

            {/* Updates to This Policy */}
            <div className="p-6 sm:p-8 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/50">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-slate-100">10. {t("privacySection10Title")}</h2>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                {t("privacySection10Content")}
              </p>
            </div>

            {/* Contact Section */}
            <div className="mt-12 p-6 sm:p-8 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-slate-200 dark:border-slate-800/50">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-slate-100">11. {t("privacyContactTitle")}</h2>
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
        </div>
      </section>
    </div>
  );
}
