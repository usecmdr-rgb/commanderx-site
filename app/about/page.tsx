"use client";

import { useTranslation } from "@/hooks/useTranslation";

export default function AboutPage() {
  const t = useTranslation();

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-widest text-slate-500">{t("aboutTitle")}</p>
        <h1 className="text-4xl font-semibold">{t("aboutHeading")}</h1>
        <p className="text-lg text-slate-600 dark:text-slate-300">
          {t("aboutDescription")}
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-md dark:border-slate-800 dark:bg-slate-900/40">
          <h3 className="text-xl font-semibold">{t("mission")}</h3>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            {t("missionDescription")}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-md dark:border-slate-800 dark:bg-slate-900/40">
          <h3 className="text-xl font-semibold">{t("whyNow")}</h3>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            {t("whyNowDescription")}
          </p>
        </div>
      </div>
      <div className="rounded-3xl border border-slate-200 bg-slate-900/90 p-6 text-white shadow-xl dark:border-slate-800">
        <h3 className="text-2xl font-semibold">{t("ourPromise")}</h3>
        <p className="mt-3 text-slate-200">
          - {t("promise1")}
          <br />- {t("promise2")}
          <br />- {t("promise3")}
          <br />- {t("promise4")}
        </p>
      </div>
    </div>
  );
}
