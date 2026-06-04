import { apiFetch } from "./api";
import type { JoinRequest, JoinRequestCreate, JoinRequestResponse } from "@/types/request";
import type { TeamWorkflow } from "@/types/team";

export function createJoinRequest(payload: JoinRequestCreate) {
  return apiFetch<TeamWorkflow>("/api/v1/requests/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function listMyRequests(options: { suppressNetworkErrorLog?: boolean } = {}) {
  return apiFetch<JoinRequest[]>("/api/v1/requests/me", {
    suppressNetworkErrorLog: options.suppressNetworkErrorLog,
  });
}

export function listTeamRequests(teamId: number) {
  return apiFetch<JoinRequest[]>(`/api/v1/requests/team/${teamId}`);
}

export function respondToRequest(requestId: number, payload: JoinRequestResponse) {
  return apiFetch<TeamWorkflow>(`/api/v1/requests/${requestId}/respond`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
