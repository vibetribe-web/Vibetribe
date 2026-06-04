import { apiFetch } from "./api";
import type { Team, TeamDetail, TeamMember, TeamMessage, TeamMessagePage, TeamPayload, TeamUpdatePayload, TeamWorkflow } from "@/types/team";

export function listTeams() {
  return apiFetch<Team[]>("/api/v1/teams");
}

export function listMyTeamDetails() {
  return apiFetch<Team[]>("/api/v1/users/me/teams");
}

export function listMyEventTeamDetails() {
  return apiFetch<Team[]>("/api/v1/users/me/event-teams");
}

export function listMyTeams(options: { suppressNetworkErrorLog?: boolean } = {}) {
  return apiFetch<TeamWorkflow[]>("/api/v1/teams/my-teams", {
    suppressNetworkErrorLog: options.suppressNetworkErrorLog,
  });
}

export function getTeam(id: number) {
  return apiFetch<TeamDetail>(`/api/v1/teams/${id}`);
}

export function listTeamMembers(id: number) {
  return apiFetch<TeamMember[]>(`/api/v1/teams/${id}/members`, { auth: false });
}

export function createTeam(payload: TeamPayload) {
  return apiFetch<TeamWorkflow>("/api/v1/teams/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateTeam(teamId: number, payload: TeamUpdatePayload) {
  return apiFetch<TeamDetail>(`/api/v1/teams/${teamId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function addTeamMember(teamId: number, userId: number) {
  return apiFetch<TeamDetail>(`/api/v1/teams/${teamId}/members/${userId}`, {
    method: "POST",
  });
}

export function removeTeamMember(teamId: number, userId: number) {
  return apiFetch<TeamDetail>(`/api/v1/teams/${teamId}/members/${userId}`, {
    method: "DELETE",
  });
}

export function updateTeamMemberRole(teamId: number, userId: number, role: TeamMember["role"]) {
  return apiFetch<TeamDetail>(`/api/v1/teams/${teamId}/members/${userId}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export function listTeamMessages(
  teamId: number,
  options: { limit?: number; beforeId?: number; suppressNetworkErrorLog?: boolean } = {},
) {
  const params = new URLSearchParams();
  if (options.limit) params.set("limit", String(options.limit));
  if (options.beforeId) params.set("before_id", String(options.beforeId));
  const query = params.toString();
  return apiFetch<TeamMessagePage>(`/api/v1/teams/${teamId}/messages${query ? `?${query}` : ""}`, {
    suppressNetworkErrorLog: options.suppressNetworkErrorLog,
  });
}

export function sendTeamMessage(teamId: number, content: string) {
  return apiFetch<TeamMessage>(`/api/v1/teams/${teamId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

export function shareEventToTeam(teamId: number, eventId: number, content?: string) {
  return apiFetch<TeamMessage>(`/api/v1/teams/${teamId}/share-event`, {
    method: "POST",
    body: JSON.stringify({ event_id: eventId, content: content || null }),
  });
}
