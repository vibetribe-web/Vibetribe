import type { Event, EventStatus } from "@/types/event";
import type { TeamMessageEvent } from "@/types/team";

type StatusEvent = Pick<Event, "start_date" | "end_date" | "event_status">;
type SharedStatusEvent = Pick<TeamMessageEvent, "start_date" | "end_date" | "event_status">;

export const EVENT_STATUS_OPTIONS = ["all", "upcoming", "ongoing", "finished"] as const;
export type EventStatusFilter = (typeof EVENT_STATUS_OPTIONS)[number];

export function getEventStatus(event: StatusEvent | SharedStatusEvent): EventStatus {
  if (event.event_status) return event.event_status;

  const now = Date.now();
  const startTime = parseEventTime(event.start_date);
  const endTime = parseEventTime(event.end_date);

  if (now < startTime) return "upcoming";
  if (now <= endTime) return "ongoing";
  return "finished";
}

export function isFinishedEvent(event: StatusEvent | SharedStatusEvent) {
  return getEventStatus(event) === "finished";
}

export function isActiveEvent(event: StatusEvent | SharedStatusEvent) {
  return getEventStatus(event) !== "finished";
}

export function getEventStatusLabel(status: EventStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function getEventStatusBadgeClass(status: EventStatus) {
  if (status === "finished") {
    return "border-slate-200 bg-slate-100 text-slate-600";
  }
  if (status === "ongoing") {
    return "border-teal-200 bg-teal-50 text-teal-700";
  }
  return "border-blue-200 bg-blue-50 text-blue-700";
}

function parseEventTime(value: string) {
  const hasTimeZone = /(?:z|[+-]\d{2}:?\d{2})$/i.test(value);
  return new Date(hasTimeZone ? value : `${value}Z`).getTime();
}
