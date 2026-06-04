import type { User } from "./user";
import type { EventStatus } from "./event";

export type Team = {
  id: number;
  name: string;
  description?: string | null;
  required_skills: string[];
  interests: string[];
  preferred_roles: string[];
  hackathon_category?: string | null;
  event_id?: number | null;
  max_members: number;
  leader_id: number;
  leader?: User | null;
  event?: {
    id: number;
    title: string;
    event_type: "hackathon" | "event";
    start_date: string;
    event_status?: EventStatus;
  } | null;
  current_members_count: number;
  available_slots: number;
  members: TeamMember[];
  is_current_user_member: boolean;
  is_current_user_leader: boolean;
  has_pending_request: boolean;
};

export type TeamDetail = Team;

export type TeamMember = {
  user_id: number;
  name: string;
  email: string;
  username?: string | null;
  profile_image_url?: string | null;
  role: "leader" | "member";
  joined_at: string;
};

export type TeamWorkflow = {
  team_id: number;
  team_name: string;
  member_count: number;
  max_members: number;
  request_status?: string | null;
  message: string;
};

export type TeamPayload = {
  name: string;
  description?: string | null;
  required_skills: string[];
  interests?: string[];
  preferred_roles?: string[];
  hackathon_category?: string | null;
  event_id?: number | null;
  max_members: number;
};

export type TeamUpdatePayload = Partial<TeamPayload>;

export type RecommendedTeamMember = {
  name: string;
  username?: string | null;
};

export type RecommendedTeam = {
  team_id: number;
  team_name: string;
  match_score: number;
  open_slots: number;
  required_skills: string[];
  reasons: string[];
  reason_tags: string[];
  members: RecommendedTeamMember[];
};

export type TeamMessageType = "text" | "event_share";

export type TeamMessageSender = {
  id: number;
  name: string;
  username?: string | null;
  profile_image_url?: string | null;
};

export type TeamMessageEvent = {
  id: number;
  title: string;
  event_type: "hackathon" | "event";
  mode: "online" | "offline" | "hybrid";
  start_date: string;
  end_date: string;
  image_url?: string | null;
  venue?: string | null;
  description: string;
  club_id: number;
  club_name: string;
  event_status?: EventStatus;
};

export type TeamMessage = {
  id: number;
  team_id: number;
  shared_event_id?: number | null;
  sender: TeamMessageSender;
  message_type: TeamMessageType;
  content?: string | null;
  event?: TeamMessageEvent | null;
  created_at: string;
};

export type TeamMessagePage = {
  items: TeamMessage[];
  has_more: boolean;
  next_before_id?: number | null;
};
