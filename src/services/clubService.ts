import { apiFetch } from "./api";
import type { Club, ClubAdmin, ClubMember, ClubPayload, ClubUpdatePayload } from "@/types/club";
import type { Event, EventPayload } from "@/types/event";

export function listClubs() {
  return apiFetch<Club[]>("/api/v1/clubs", { auth: false });
}

export function getClub(id: number) {
  return apiFetch<Club>(`/api/v1/clubs/${id}`, { auth: false });
}

export function getClubEvents(id: number) {
  return apiFetch<Event[]>(`/api/v1/clubs/${id}/events`);
}

export function listAdminClubs() {
  return apiFetch<ClubAdmin[]>("/api/v1/admin/clubs");
}

export function createClub(payload: ClubPayload) {
  return apiFetch<ClubAdmin>("/api/v1/admin/clubs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateClub(id: number, payload: ClubUpdatePayload) {
  return apiFetch<ClubAdmin>(`/api/v1/admin/clubs/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deactivateClub(id: number) {
  return apiFetch<ClubAdmin>(`/api/v1/admin/clubs/${id}`, { method: "DELETE" });
}

export function assignLeader(clubId: number, userId: number) {
  return apiFetch(`/api/v1/admin/clubs/${clubId}/leaders/${userId}`, {
    method: "POST",
  });
}

export function removeLeader(clubId: number, userId: number) {
  return apiFetch(`/api/v1/admin/clubs/${clubId}/leaders/${userId}`, {
    method: "DELETE",
  });
}

export function listClubMembers(clubId: number) {
  return apiFetch<ClubMember[]>(`/api/v1/clubs/${clubId}/members`);
}

export function addClubMember(clubId: number, userId: number) {
  return apiFetch(`/api/v1/clubs/${clubId}/members/${userId}`, { method: "POST" });
}

export function removeClubMember(clubId: number, userId: number) {
  return apiFetch(`/api/v1/clubs/${clubId}/members/${userId}`, { method: "DELETE" });
}

export function promoteClubMember(clubId: number, userId: number) {
  return apiFetch(`/api/v1/clubs/${clubId}/members/${userId}/promote`, { method: "POST" });
}

export function demoteClubLeader(clubId: number, userId: number) {
  return apiFetch(`/api/v1/clubs/${clubId}/members/${userId}/demote`, { method: "POST" });
}

export function createClubEvent(clubId: number, payload: EventPayload) {
  return apiFetch<Event>(`/api/v1/clubs/${clubId}/events`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateClubEvent(clubId: number, eventId: number, payload: Partial<EventPayload>) {
  return apiFetch<Event>(`/api/v1/clubs/${clubId}/events/${eventId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteClubEvent(clubId: number, eventId: number) {
  return apiFetch<void>(`/api/v1/clubs/${clubId}/events/${eventId}`, {
    method: "DELETE",
  });
}
