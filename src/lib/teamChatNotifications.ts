const KEY = "vibetribe_team_chat_seen";

type SeenMap = Record<string, number>;

function readSeen(): SeenMap {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "{}") as SeenMap;
  } catch {
    return {};
  }
}

function writeSeen(value: SeenMap) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(value));
}

export function getSeenTeamMessageId(teamId: number) {
  return readSeen()[String(teamId)] ?? 0;
}

export function markTeamChatSeen(teamId: number, messageId: number) {
  const seen = readSeen();
  const key = String(teamId);
  seen[key] = Math.max(seen[key] ?? 0, messageId);
  writeSeen(seen);
}
