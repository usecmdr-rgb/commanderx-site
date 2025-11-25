import "./globals.css";

import React from "react";
import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import { AppStateProvider } from "@/context/AppStateContext";
import AuthModal from "@/components/modals/AuthModal";
import BusinessInfoModal from "@/components/modals/BusinessInfoModal";
import BillingModal from "@/components/modals/BillingModal";
import SettingsModal from "@/components/modals/SettingsModal";
import TermsModal from "@/components/modals/TermsModal";
import { SupabaseProvider } from "@/components/SupabaseProvider";
import DataRetentionBanner from "@/components/subscription/DataRetentionBanner";

export const metadata: Metadata = {
  title: "CommanderX",
  description: "AI tools for Gmail, calendar, and more",
  viewport: "width=device-width, initial-scale=1, maximum-scale=5",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </head>
      <body>
        <SupabaseProvider>
          <AppStateProvider>
            <Header />
            <DataRetentionBanner />
            <main className="mx-auto min-h-screen max-w-6xl px-4 pb-16 pt-20 sm:px-6 lg:px-8 overflow-x-hidden">
              {children}
            </main>
            <AuthModal />
            <BusinessInfoModal />
            <BillingModal />
            <SettingsModal />
            <TermsModal />
          </AppStateProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
