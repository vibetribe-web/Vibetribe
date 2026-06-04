"use client";

import { Loader2 } from "lucide-react";
import { useRequireAuth } from "@/hooks/useAuth";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const auth = useRequireAuth();

  if (!auth.isHydrated || !auth.isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-600 shadow-sm">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          Checking your session
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
