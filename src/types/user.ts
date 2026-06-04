export type User = {
  id: number;
  name: string;
  username?: string | null;
  email?: string;
  college?: string | null;
  branch?: string | null;
  year?: number | null;
  skills: string[];
  is_admin: boolean;
  auth_provider: string;
  profile_image_url?: string | null;
};

export type UserUpdate = Partial<
  Pick<User, "name" | "college" | "branch" | "year" | "skills">
>;
