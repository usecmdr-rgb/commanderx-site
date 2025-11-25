"use client";

import { createContext, useContext } from "react";
import { supabaseBrowserClient } from "@/lib/supabaseClient";

// Very simple context: just expose the Supabase client.
// We'll add real auth/session handling later.
type SupabaseContextValue = {
  supabase: typeof supabaseBrowserClient;
};

const SupabaseContext = createContext<SupabaseContextValue | null>(null);

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  return (
    <SupabaseContext.Provider value={{ supabase: supabaseBrowserClient }}>
      {children}
    </SupabaseContext.Provider>
  );
}

export const useSupabase = () => {
  const ctx = useContext(SupabaseContext);
  if (!ctx) {
    throw new Error("useSupabase must be used inside SupabaseProvider");
  }
  return ctx;
};


