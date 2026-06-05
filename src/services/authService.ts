import { apiFetch, API_BASE_URL } from "./api";
import type { AuthToken, LoginPayload, RegisterPayload } from "@/types/auth";
import type { User, UserUpdate } from "@/types/user";

export async function login(payload: LoginPayload) {
  return apiFetch<AuthToken>("/api/v1/auth/login/json", {
    method: "POST",
    body: JSON.stringify({
      email: payload.email,
      password: payload.password,
    }),
    auth: false,
  });
}

export async function register(payload: RegisterPayload) {
  return apiFetch<User>("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
    auth: false,
  });
}

export async function getCurrentUser() {
  return apiFetch<User>("/api/v1/users/me");
}

export async function updateCurrentUser(payload: UserUpdate) {
  return apiFetch<User>("/api/v1/users/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function updateUsername(username: string) {
  return apiFetch<{ message: string; username: string }>("/api/v1/users/me/username", {
    method: "PATCH",
    body: JSON.stringify({ username }),
  });
}

export function redirectToGoogleLogin() {
  if (!API_BASE_URL) {
    return false;
  }

  window.location.href = `${API_BASE_URL}/api/v1/auth/google/login`;
  return true;
}
