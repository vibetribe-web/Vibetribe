import { apiFetch } from "./api";
import type { AdminDashboard } from "@/types/admin";
import type { JoinRequest } from "@/types/request";
import type { Team } from "@/types/team";
import type { User } from "@/types/user";

export function getAdminDashboard() {
  return apiFetch<AdminDashboard>("/api/v1/admin/dashboard");
}

export function listAdminUsers() {
  return apiFetch<User[]>("/api/v1/admin/users");
}

export function listAdminTeams() {
  return apiFetch<Team[]>("/api/v1/admin/teams");
}

export function listAdminRequests() {
  return apiFetch<JoinRequest[]>("/api/v1/admin/requests");
}
