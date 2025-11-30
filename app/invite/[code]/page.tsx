"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react";
import { useSupabase } from "@/components/SupabaseProvider";
import { useAppState } from "@/context/AppStateContext";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function InviteAcceptPage() {
  const router = useRouter();
  const params = useParams();
  const code = params?.code as string;
  const { supabase } = useSupabase();
  const { isAuthenticated, openAuthModal } = useAppState();
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [status, setStatus] = useState<"loading" | "success" | "error" | "expired" | "already_accepted">("loading");
  const [error, setError] = useState<string | null>(null);

  const handleAccept = useCallback(async () => {
    if (!code || !isAuthenticated) {
      if (!isAuthenticated) {
        openAuthModal("signup");
      }
      return;
    }

    setAccepting(true);
    try {
      const response = await fetch(`/api/team/invites/${code}/accept`, {
        method: "POST",
      });

      const result = await response.json();

      if (result.ok) {
        setStatus("success");
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      } else {
        if (result.error?.includes("expired")) {
          setStatus("expired");
        } else if (result.error?.includes("already been accepted")) {
          setStatus("already_accepted");
        } else {
          setStatus("error");
          setError(result.error || "Failed to accept invite");
        }
      }
    } catch (err: any) {
      setStatus("error");
      setError(err.message || "Failed to accept invite");
    } finally {
      setAccepting(false);
      setLoading(false);
    }
  }, [code, isAuthenticated, openAuthModal, router]);

  useEffect(() => {
    if (!code) {
      setStatus("error");
      setError("Invalid invite code");
      setLoading(false);
      return;
    }

    // If user is not authenticated, show login prompt
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    // Auto-accept if authenticated
    handleAccept();
  }, [code, isAuthenticated, handleAccept]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400 mb-4" />
            <p className="text-sm text-slate-500">Loading invite...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Accept Team Invite</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Please sign in or create an account to accept this team invite.
            </p>
            <Button onClick={() => openAuthModal("signup")} className="w-full">
              Sign In / Sign Up
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Accept Team Invite</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "success" && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-900/20">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <p className="font-semibold text-emerald-700 dark:text-emerald-300">
                    Invite Accepted!
                  </p>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">
                    Redirecting to your dashboard...
                  </p>
                </div>
              </div>
            </div>
          )}

          {status === "expired" && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
              <div className="flex items-center gap-3">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                <div>
                  <p className="font-semibold text-red-700 dark:text-red-300">
                    Invite Expired
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    This invite link has expired. Please ask for a new invite.
                  </p>
                </div>
              </div>
            </div>
          )}

          {status === "already_accepted" && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <div>
                  <p className="font-semibold text-amber-700 dark:text-amber-300">
                    Already Accepted
                  </p>
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    This invite has already been accepted.
                  </p>
                </div>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
              <div className="flex items-center gap-3">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                <div>
                  <p className="font-semibold text-red-700 dark:text-red-300">
                    Error
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {error || "Failed to accept invite"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {status === "loading" && !accepting && (
            <Button
              onClick={handleAccept}
              disabled={accepting}
              className="w-full"
            >
              {accepting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Accepting...
                </>
              ) : (
                "Accept Invite"
              )}
            </Button>
          )}

          <Button
            onClick={() => router.push("/dashboard")}
            variant="secondary"
            className="w-full"
          >
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

