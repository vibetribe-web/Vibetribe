import type { User } from "@/types/user";

type DisplayableUser = Pick<User, "id" | "name" | "username" | "branch" | "year" | "college">;

export function userSafeContext(user: Pick<User, "branch" | "year" | "college">) {
  return [user.branch, user.year ? `Year ${user.year}` : null, user.college].filter(Boolean).join(" · ");
}

export function usernameLabel(user: Pick<User, "id" | "username">) {
  return user.username && user.username !== "pending" ? `@${user.username}` : "@not_set";
}

export function userDisplayLabel(user: DisplayableUser, _users: DisplayableUser[] = []) {
  void _users;
  if (user.username && user.username !== "pending") {
    const context = userSafeContext(user);
    return `${user.name} · @${user.username}${context ? ` · ${context}` : ""}`;
  }
  const fallback = usernameLabel(user);
  const context = userSafeContext(user);
  return `${user.name} · ${fallback}${context ? ` · ${context}` : ""}`;
}
