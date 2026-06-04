import { apiFetch } from "./api";
import type { Event, EventDetail, EventInterestResponse, EventTeammateRecommendation } from "@/types/event";

export function listEvents() {
  return apiFetch<Event[]>("/api/v1/events");
}

export function getEvent(id: number) {
  return apiFetch<EventDetail>(`/api/v1/events/${id}`);
}

export function listClubEvents(clubId: number) {
  return apiFetch<Event[]>(`/api/v1/clubs/${clubId}/events`, { auth: false });
}

export function listInterestedEvents() {
  return apiFetch<Event[]>("/api/v1/users/me/interested-events");
}

export function listEventTeammates(eventId: number) {
  return apiFetch<EventTeammateRecommendation[]>(`/api/v1/events/${eventId}/teammates`);
}

export function markEventInterested(eventId: number) {
  return apiFetch<EventInterestResponse>(`/api/v1/events/${eventId}/interest`, {
    method: "POST",
  });
}

export function removeEventInterest(eventId: number) {
  return apiFetch<EventInterestResponse>(`/api/v1/events/${eventId}/interest`, {
    method: "DELETE",
  });
}
