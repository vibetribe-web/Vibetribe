export type RequestStatus = "pending" | "accepted" | "rejected";

export type JoinRequest = {
  id: number;
  from_user_id: number;
  team_id: number;
  message?: string | null;
  status: RequestStatus;
  reply_message?: string | null;
  team?: {
    id: number;
    name: string;
  } | null;
  from_user?: {
    id: number;
    username?: string | null;
    full_name?: string | null;
    name?: string | null;
  } | null;
};

export type JoinRequestCreate = {
  team_id: number;
  message?: string | null;
};

export type JoinRequestResponse = {
  status: RequestStatus;
  reply_message?: string | null;
};
