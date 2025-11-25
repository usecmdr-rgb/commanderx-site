"use client";

import { useAppState } from "@/context/AppStateContext";
import AppSidebar from "./AppSidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeAgent?: string | null;
}

const DashboardLayout = ({ children, activeAgent = null }: DashboardLayoutProps) => {
  const { isAuthenticated, openAuthModal } = useAppState();

  if (!isAuthenticated) {
    return (
      <div className="rounded-3xl border border-amber-200 bg-white/70 p-4 sm:p-6 md:p-10 text-center text-slate-700 shadow-md dark:border-amber-500/40 dark:bg-slate-900/60 dark:text-slate-200">
        <h1 className="text-xl sm:text-2xl font-semibold">Please log in to reach CommanderX</h1>
        <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-slate-500">
          This dashboard is available after authentication. Use the header controls to sign in.
        </p>
        <button
          onClick={() => openAuthModal("login")}
          className="mt-4 sm:mt-6 rounded-full bg-slate-900 px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-white shadow-lg hover:bg-slate-800 dark:bg-white dark:text-slate-900"
        >
          Open login
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <AppSidebar />
      <div className="flex-1 space-y-4 sm:space-y-6">{children}</div>
    </div>
  );
};

export default DashboardLayout;




