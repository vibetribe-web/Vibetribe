import { apiFetch } from "./api";
import type { RecommendedTeam } from "@/types/team";

export function listRecommendedTeams() {
  return apiFetch<RecommendedTeam[]>("/api/v1/recommendations/teams");
}
