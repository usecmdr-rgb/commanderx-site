"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ConnectedAccount, ConnectedAccountType } from "@/types";

type UseConnectedAccountsResult = {
  accounts: ConnectedAccount[];
  isLoading: boolean;
  error: string | null;
  connectAccount: (type: ConnectedAccountType) => Promise<void>;
  disconnectAccount: (accountId: string) => Promise<void>;
  refresh: () => Promise<void>;
};

export function useConnectedAccounts(): UseConnectedAccountsResult {
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const popupWatcher = useRef<number | null>(null);

  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/connections");
      if (!response.ok) {
        throw new Error("Unable to load connected accounts.");
      }
      const data = await response.json();
      setAccounts(data.accounts ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load connected accounts.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (typeof window === "undefined") return;
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "social-auth-complete" && event.data?.success) {
        fetchAccounts();
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [fetchAccounts]);

  const connectAccount = useCallback(
    async (type: ConnectedAccountType) => {
      if (typeof window === "undefined") {
        throw new Error("Social connections are only available in the browser.");
      }
      const response = await fetch(`/api/auth/${type}/url`);
      if (!response.ok) {
        throw new Error("Unable to start the connection flow.");
      }
      const { authUrl } = await response.json();
      if (!authUrl) {
        throw new Error("Missing authorization URL.");
      }

      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        authUrl,
        `connect-${type}`,
        `width=${width},height=${height},left=${left},top=${top}`
      );

      if (!popup) {
        throw new Error("Popup blocked. Please allow popups and try again.");
      }

      await new Promise<void>((resolve, reject) => {
        const cleanup = () => {
          if (popupWatcher.current) {
            window.clearInterval(popupWatcher.current);
            popupWatcher.current = null;
          }
          window.removeEventListener("message", handlePopupMessage);
        };

        const handlePopupMessage = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          if (event.data?.type === "social-auth-complete" && event.data?.provider === type) {
            cleanup();
            popup.close();
            if (event.data?.success) {
              resolve();
            } else {
              reject(new Error(event.data?.error ?? "Authorization failed."));
            }
          }
        };

        window.addEventListener("message", handlePopupMessage);

        popupWatcher.current = window.setInterval(() => {
          if (popup.closed) {
            cleanup();
            reject(new Error("Popup closed before authorization completed."));
          }
        }, 500);
      });

      await fetchAccounts();
    },
    [fetchAccounts]
  );

  const disconnectAccount = useCallback(
    async (accountId: string) => {
      const response = await fetch(`/api/connections/${accountId}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error("Unable to disconnect the account.");
      }
      await fetchAccounts();
    },
    [fetchAccounts]
  );

  return {
    accounts,
    isLoading,
    error,
    connectAccount,
    disconnectAccount,
    refresh: fetchAccounts,
  };
}

