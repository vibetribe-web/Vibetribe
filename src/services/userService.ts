import { apiFetch } from "./api";
import type { User } from "@/types/user";

export function listUsers(search?: string) {
  const params = search ? `?search=${encodeURIComponent(search)}` : "";
  return apiFetch<User[]>(`/api/v1/users/${params}`, { auth: false });
}
