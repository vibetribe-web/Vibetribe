"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setToken } from "@/services/api";
import { useAuthStore } from "@/store/authStore";

export default function AuthSuccessPage() {
  return (
    <Suspense>
      <AuthSuccess />
    </Suspense>
  );
}

function AuthSuccess() {
  const router = useRouter();
  const params = useSearchParams();
  const getCurrentUser = useAuthStore((state) => state.getCurrentUser);

  useEffect(() => {
    const token = params.get("access_token") ?? params.get("token");
    if (!token) return;
    setToken(token);
    void getCurrentUser().then(() => router.replace("/dashboard"));
  }, [getCurrentUser, params, router]);

  const hasToken = Boolean(params.get("access_token") ?? params.get("token"));

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        {hasToken ? (
          <>
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
            <h1 className="mt-4 text-2xl font-bold">Signing you in</h1>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold">No login token found</h1>
            <p className="mt-3 text-slate-600">Return to auth and try signing in again.</p>
            <Button asChild className="mt-6" variant="gradient">
              <Link href="/auth">Go to auth</Link>
            </Button>
          </>
        )}
      </div>
    </main>
  );
}
