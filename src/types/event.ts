import type { Club } from "./club";

export type EventType = "hackathon" | "event";
export type EventMode = "online" | "offline" | "hybrid";
export type EventStatus = "upcoming" | "ongoing" | "finished";

export type Event = {
  id: number;
  club_id: number;
  title: string;
  description: string;
  event_type: EventType;
  mode: EventMode;
  venue?: string | null;
  start_date: string;
  end_date: string;
  registration_link?: string | null;
  image_url?: string | null;
  interested_count: number;
  is_interested: boolean;
  event_status?: EventStatus;
  club?: Club | null;
  created_at: string;
  updated_at: string;
};

export type EventDetail = Event & {
  club: Club;
};

export type EventPayload = {
  title: string;
  description: string;
  event_type: EventType;
  mode: EventMode;
  venue?: string | null;
  start_date: string;
  end_date: string;
  registration_link?: string | null;
  image_url?: string | null;
};

export type EventInterestResponse = {
  event_id: number;
  is_interested: boolean;
  interested_count: number;
};

export type EventTeammateRecommendation = {
  id: number;
  name: string;
  username?: string | null;
  college?: string | null;
  branch?: string | null;
  year?: number | null;
  skills: string[];
  profile_image_url?: string | null;
  match_score: number;
  reason_tags: string[];
};
