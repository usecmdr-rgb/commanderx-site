"use client";

import { useTranslation } from "@/hooks/useTranslation";
import { FileText } from "lucide-react";

export default function TermsPage() {
  const t = useTranslation();

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-black dark:text-slate-100">
      {/* Hero Section */}
      <div className="border-b border-slate-200 dark:border-slate-800/50">
        <div className="pt-8 sm:pt-12 pb-12 sm:pb-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <FileText className="h-6 w-6 text-purple-500" />
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight bg-gradient-to-br from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
                {t("termsPageTitle")}
              </h1>
            </div>
            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 font-light leading-relaxed">
              {t("termsPageDescription")}
            </p>
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              {t("termsLastUpdated")}
            </p>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
            {/* Agreement to Terms */}
            <div className="p-6 sm:p-8 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/50">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-slate-100">1. {t("termsSection1Title")}</h2>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                {t("termsSection1Content")}
              </p>
            </div>

            {/* Description of Service */}
            <div className="p-6 sm:p-8 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/50">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-slate-100">2. {t("termsSection2Title")}</h2>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                {t("termsSection2Content")}
              </p>
              <ul className="list-disc list-inside space-y-2 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed ml-4">
                <li>{t("termsSection2Item1")}</li>
                <li>{t("termsSection2Item2")}</li>
                <li>{t("termsSection2Item3")}</li>
                <li>{t("termsSection2Item4")}</li>
              </ul>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mt-4">
                {t("termsSection2Note")}
              </p>
            </div>

            {/* Eligibility */}
            <div className="p-6 sm:p-8 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/50">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-slate-100">3. {t("termsSection3Title")}</h2>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                {t("termsSection3Content")}
              </p>
            </div>

            {/* Accounts */}
            <div className="p-6 sm:p-8 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/50">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-slate-100">4. {t("termsSection4Title")}</h2>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                {t("termsSection4Content")}
              </p>
              <ul className="list-disc list-inside space-y-2 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed ml-4">
                <li>{t("termsSection4Item1")}</li>
                <li>{t("termsSection4Item2")}</li>
                <li>{t("termsSection4Item3")}</li>
              </ul>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mt-4">
                {t("termsSection4Note")}
              </p>
            </div>

            {/* Acceptable Use */}
            <div className="p-6 sm:p-8 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/50">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-slate-100">5. {t("termsSection5Title")}</h2>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                {t("termsSection5Content")}
              </p>
              <ul className="list-disc list-inside space-y-2 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed ml-4">
                <li>{t("termsSection5Item1")}</li>
                <li>{t("termsSection5Item2")}</li>
                <li>{t("termsSection5Item3")}</li>
                <li>{t("termsSection5Item4")}</li>
                <li>{t("termsSection5Item5")}</li>
                <li>{t("termsSection5Item6")}</li>
                <li>{t("termsSection5Item7")}</li>
              </ul>
            </div>

            {/* User Content */}
            <div className="p-6 sm:p-8 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/50">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-slate-100">6. {t("termsSection6Title")}</h2>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                {t("termsSection6Content1")}
              </p>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                {t("termsSection6Content2")}
              </p>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-semibold">
                {t("termsSection6Note")}
              </p>
            </div>

            {/* Payments & Billing */}
            <div className="p-6 sm:p-8 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/50">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-slate-100">7. {t("termsSection7Title")}</h2>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                {t("termsSection7Content")}
              </p>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-semibold">
                {t("termsSection7Note")}
              </p>
            </div>

            {/* Termination */}
            <div className="p-6 sm:p-8 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/50">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-slate-100">8. {t("termsSection8Title")}</h2>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                {t("termsSection8Content1")}
              </p>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                {t("termsSection8Content2")}
              </p>
              <ul className="list-disc list-inside space-y-2 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed ml-4">
                <li>{t("termsSection8Item1")}</li>
                <li>{t("termsSection8Item2")}</li>
                <li>{t("termsSection8Item3")}</li>
                <li>{t("termsSection8Item4")}</li>
              </ul>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mt-4">
                {t("termsSection8Note")}
              </p>
            </div>

            {/* AI-Generated Outputs */}
            <div className="p-6 sm:p-8 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/50">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-slate-100">9. {t("termsSection9Title")}</h2>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                {t("termsSection9Content1")}
              </p>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                {t("termsSection9Content2")}
              </p>
            </div>

            {/* Warranties & Disclaimers */}
            <div className="p-6 sm:p-8 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/50">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-slate-100">10. {t("termsSection10Title")}</h2>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                {t("termsSection10Content1")}
              </p>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                {t("termsSection10Content2")}
              </p>
            </div>

            {/* Limitation of Liability */}
            <div className="p-6 sm:p-8 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/50">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-slate-100">11. {t("termsSection11Title")}</h2>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                {t("termsSection11Content")}
              </p>
              <ul className="list-disc list-inside space-y-2 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed ml-4">
                <li>{t("termsSection11Item1")}</li>
                <li>{t("termsSection11Item2")}</li>
              </ul>
            </div>

            {/* Indemnification */}
            <div className="p-6 sm:p-8 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/50">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-slate-100">12. {t("termsSection12Title")}</h2>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                {t("termsSection12Content")}
              </p>
              <ul className="list-disc list-inside space-y-2 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed ml-4">
                <li>{t("termsSection12Item1")}</li>
                <li>{t("termsSection12Item2")}</li>
                <li>{t("termsSection12Item3")}</li>
                <li>{t("termsSection12Item4")}</li>
              </ul>
            </div>

            {/* Governing Law */}
            <div className="p-6 sm:p-8 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/50">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-slate-100">13. {t("termsSection13Title")}</h2>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                {t("termsSection13Content")}
              </p>
            </div>

            {/* Changes to Terms */}
            <div className="p-6 sm:p-8 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/50">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-slate-100">14. {t("termsSection14Title")}</h2>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                {t("termsSection14Content")}
              </p>
            </div>

            {/* Contact Section */}
            <div className="mt-12 p-6 sm:p-8 rounded-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-slate-200 dark:border-slate-800/50">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-slate-100">15. {t("termsContactTitle")}</h2>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                {t("termsContactDescription")}
              </p>
              <p className="text-base text-slate-600 dark:text-slate-300">
                <strong className="text-slate-900 dark:text-slate-100">Email:</strong>{" "}
                <a
                  href="mailto:legal@ovrsee.dev"
                  className="text-purple-600 dark:text-purple-400 hover:underline"
                >
                  legal@ovrsee.dev
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
