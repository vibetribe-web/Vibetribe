"use client";

import { create } from "zustand";
import { clearToken, getToken, setToken } from "@/services/api";
import * as authService from "@/services/authService";
import type { LoginPayload, RegisterPayload } from "@/types/auth";
import type { User } from "@/types/user";

const PROFILE_STALE_TIME = 5 * 60 * 1000;
let currentUserRequest: Promise<User | null> | null = null;
let currentUserFetchedAt = 0;

type AuthState = {
  token: string | null;
  user: User | null;
  isHydrated: boolean;
  isAuthenticated: boolean;
  hydrate: () => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  getCurrentUser: (force?: boolean) => Promise<User | null>;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isHydrated: false,
  isAuthenticated: false,
  hydrate: async () => {
    const token = getToken();
    set({ token, isAuthenticated: Boolean(token), isHydrated: true });
    if (token) await get().getCurrentUser();
  },
  login: async (payload) => {
    const token = await authService.login(payload);
    setToken(token.access_token);
    set({ token: token.access_token, isAuthenticated: true });
    await get().getCurrentUser();
  },
  register: async (payload) => {
    await authService.register(payload);
    await get().login({ email: payload.email, password: payload.password });
  },
  getCurrentUser: async (force = false) => {
    const existingUser = get().user;
    if (!force && existingUser && Date.now() - currentUserFetchedAt < PROFILE_STALE_TIME) {
      return existingUser;
    }
    if (currentUserRequest) return currentUserRequest;

    currentUserRequest = (async () => {
    try {
      const user = await authService.getCurrentUser();
      set({ user, isAuthenticated: true, token: getToken() });
      currentUserFetchedAt = Date.now();
      return user;
    } catch {
      clearToken();
      set({ user: null, token: null, isAuthenticated: false });
      return null;
    } finally {
      currentUserRequest = null;
    }
    })();
    return currentUserRequest;
  },
  logout: () => {
    clearToken();
    currentUserFetchedAt = 0;
    set({ token: null, user: null, isAuthenticated: false });
  },
}));
