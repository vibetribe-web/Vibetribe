export type Club = {
  id: number;
  name: string;
  description?: string | null;
  event_count?: number;
  created_at: string;
  updated_at: string;
};

export type ClubRole = "leader" | "member";

export type ClubMember = {
  user_id: number;
  name: string;
  email: string;
  role: ClubRole;
  joined_at: string;
  added_by?: number | null;
};

export type ClubLeader = Omit<ClubMember, "added_by">;

export type ClubAdmin = Club & {
  is_active: boolean;
  created_by: number;
  leaders: ClubLeader[];
};

export type ClubPayload = {
  name: string;
  description?: string | null;
  is_active?: boolean;
};

export type ClubUpdatePayload = Partial<ClubPayload>;
