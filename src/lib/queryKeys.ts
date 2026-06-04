export const queryKeys = {
  clubs: ["clubs"] as const,
  clubEvents: (clubId: number) => ["clubs", clubId, "events"] as const,
  clubMembers: (clubId: number) => ["clubs", clubId, "members"] as const,
  currentUser: ["user", "me"] as const,
  events: ["events"] as const,
  interestedEvents: ["events", "interested"] as const,
  interestedEventsForUser: (userId?: number | null) =>
    ["events", "interested", "viewer", userId ?? "anonymous"] as const,
  myRequests: ["requests", "me"] as const,
  myRequestsForUser: (userId?: number | null) =>
    ["requests", "me", "viewer", userId ?? "anonymous"] as const,
  recommendedTeams: ["teams", "recommended"] as const,
  recommendedTeamsForUser: (userId?: number | null) =>
    ["teams", "recommended", "viewer", userId ?? "anonymous"] as const,
  teamRequests: (teamId: number) => ["requests", "team", teamId] as const,
  teamRequestsForUser: (teamId: number, userId?: number | null) =>
    ["requests", "team", teamId, "viewer", userId ?? "anonymous"] as const,
  teams: ["teams"] as const,
  teamsForUser: (userId?: number | null) =>
    ["teams", "viewer", userId ?? "anonymous"] as const,
  users: ["users"] as const,
};

export const staleTimes = {
  clubs: 8 * 60 * 1000,
  events: 3 * 60 * 1000,
  profile: 5 * 60 * 1000,
  requests: 60 * 1000,
  teams: 90 * 1000,
  users: 5 * 60 * 1000,
};
