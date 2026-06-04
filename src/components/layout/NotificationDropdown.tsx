"use client";

import Link from "next/link";
import { Bell, CheckCircle2, MessageSquare } from "lucide-react";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { listMyRequests } from "@/services/requestService";
import { getSeenTeamMessageId } from "@/lib/teamChatNotifications";
import { queryKeys, staleTimes } from "@/lib/queryKeys";
import { listMyTeams, listTeamMessages } from "@/services/teamService";
import { useAuth } from "@/hooks/useAuth";

export function NotificationDropdown() {
  const auth = useAuth();
  const viewerId = auth.user?.id ?? null;
  const { data: requests = [] } = useQuery({
    queryKey: queryKeys.myRequestsForUser(viewerId),
    queryFn: () => listMyRequests({ suppressNetworkErrorLog: true }),
    enabled: auth.isAuthenticated && Boolean(viewerId),
    staleTime: staleTimes.requests,
  });
  const { data: unreadTeams = [] } = useQuery({
    queryKey: ["notifications", "team-unread", "viewer", viewerId ?? "anonymous"],
    queryFn: loadUnreadTeams,
    enabled: auth.isAuthenticated && Boolean(viewerId),
    refetchInterval: 60 * 1000,
    staleTime: 45 * 1000,
  });

  const pending = useMemo(
    () => requests.filter((request) => request.status === "pending").length,
    [requests],
  );
  const notificationCount = pending + unreadTeams.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" className="relative">
          <Bell className="h-5 w-5" />
          {notificationCount > 0 && (
            <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-teal-500 ring-2 ring-white" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="px-3 py-2 text-sm font-semibold">Notifications</div>
        {unreadTeams.slice(0, 4).map((team) => (
          <DropdownMenuItem key={`${team.teamId}-${team.latestId}`} asChild>
            <Link className="flex items-start gap-3" href={`/teams/${team.teamId}/chat`}>
              <MessageSquare className="mt-0.5 h-4 w-4 text-blue-600" />
              <span>
                New message in {team.teamName}.
              </span>
            </Link>
          </DropdownMenuItem>
        ))}
        {requests.slice(0, 4).map((request) => (
          <DropdownMenuItem key={request.id} className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-teal-600" />
            <span>{notificationText(request.status, request.team?.name)}</span>
          </DropdownMenuItem>
        ))}
        {!unreadTeams.length && !requests.length && (
          <DropdownMenuItem className="text-slate-500">No new notifications.</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function notificationText(status: string, teamName?: string | null) {
  const target = teamName || "your selected team";
  if (status === "accepted") return `You're in! Your request to join ${target} was accepted.`;
  if (status === "rejected") return `Your request to join ${target} was declined.`;
  return `Your join request for ${target} is pending.`;
}

async function loadUnreadTeams() {
  try {
    const teams = await listMyTeams({ suppressNetworkErrorLog: true });
    const entries = await Promise.allSettled(
      teams.map(async (team) => {
        const page = await listTeamMessages(team.team_id, {
          limit: 1,
          suppressNetworkErrorLog: true,
        });
        const latest = page.items.at(-1);
        if (!latest || latest.id <= getSeenTeamMessageId(team.team_id)) return null;
        return { teamId: team.team_id, teamName: team.team_name, latestId: latest.id };
      }),
    );
    return entries
      .filter((entry) => entry.status === "fulfilled")
      .map((entry) => entry.value)
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
  } catch {
    return [];
  }
}
