import type { User } from "./user";

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = LoginPayload & {
  name: string;
  username: string;
  college?: string | null;
  branch?: string | null;
  year?: number | null;
  skills: string[];
};

export type AuthToken = {
  access_token: string;
  token_type: "bearer";
};

export type GoogleAuthResponse = AuthToken & {
  user: User;
};
