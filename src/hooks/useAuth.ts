"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export function useAuth() {
  const auth = useAuthStore();

  useEffect(() => {
    if (!auth.isHydrated) {
      void auth.hydrate();
    }
  }, [auth]);

  return auth;
}

export function useRequireAuth() {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (auth.isHydrated && !auth.isAuthenticated) {
      router.replace("/auth");
    }
  }, [auth.isHydrated, auth.isAuthenticated, router]);

  return auth;
}
