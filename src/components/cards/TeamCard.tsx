"use client";

import { CalendarDays, MessageSquare, Send, Settings, Trophy, Zap } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Team, TeamMember } from "@/types/team";

export function TeamCard({
  team,
  members,
  compact = false,
  viewerId,
  onJoin,
  onSelect,
}: {
  team: Team;
  members?: TeamMember[];
  compact?: boolean;
  viewerId?: number | null;
  onJoin?: (team: Team) => void;
  onSelect?: (team: Team) => void;
}) {
  const resolvedMembers = members ?? team.members ?? [];
  const leader = resolvedMembers.find((member) => member.role === "leader");
  const viewerMembership = viewerId
    ? resolvedMembers.find((member) => member.user_id === viewerId)
    : undefined;
  const isViewerMember = viewerId
    ? team.is_current_user_member && Boolean(viewerMembership || team.leader_id === viewerId)
    : team.is_current_user_member;
  const canManage = isViewerMember && Boolean(
    team.is_current_user_leader ||
    (viewerId && (team.leader_id === viewerId || viewerMembership?.role === "leader")),
  );
  const orderedMembers = orderMembers(resolvedMembers);
  const visibleMembers = orderedMembers.slice(0, 4);
  const memberCount = team.current_members_count ?? resolvedMembers.length;
  const slots = team.available_slots ?? Math.max(team.max_members - memberCount, 0);
  const fillPercent = Math.min(100, Math.round((memberCount / Math.max(team.max_members, 1)) * 100));

  return (
    <motion.article
      className="group relative h-full cursor-pointer overflow-hidden rounded-3xl border border-white/80 bg-white/84 p-5 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-blue-200/80 hover:bg-white/95 hover:shadow-[0_28px_90px_rgba(37,99,235,0.16)]"
      onClick={() => onSelect?.(team)}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-blue-300/20 blur-3xl transition group-hover:bg-teal-300/30" />
      <div className="relative flex h-full flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-950 via-blue-700 to-teal-600 text-lg font-black text-white shadow-lg shadow-blue-500/20">
              {team.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h3 className="line-clamp-1 text-lg font-black tracking-tight text-slate-950">{team.name}</h3>
              <p className="mt-1 text-sm text-slate-500">
                Created by {team.leader?.name ?? leader?.name ?? "team leader"}
              </p>
            </div>
          </div>
          {canManage ? (
            <Badge className="rounded-full bg-slate-950 px-3 py-1 text-white">Leader</Badge>
          ) : (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
              <Zap className="h-4 w-4" />
            </span>
          )}
        </div>

        <p className={compact ? "mt-4 line-clamp-2 text-sm leading-6 text-slate-600" : "mt-5 line-clamp-3 text-sm leading-6 text-slate-600"}>
          {team.description || "A VibeTribe team looking for collaborators."}
        </p>

        {team.event && (
          <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-3">
            <div className="flex items-start gap-2">
              <Trophy className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
              <div className="min-w-0">
                <p className="line-clamp-1 text-sm font-bold text-indigo-950">{team.event.title}</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-indigo-700">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {new Date(team.event.start_date).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-500">Formed for this hackathon</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/90 p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-slate-950">{memberCount} / {team.max_members} members</p>
              <p className="text-xs font-semibold text-teal-600">{slots === 1 ? "1 slot open" : `${slots} slots open`}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {visibleMembers.map((member) => (
                  <Avatar key={member.user_id} className="h-8 w-8 border-2 border-white shadow-sm">
                    <AvatarFallback className="bg-gradient-to-br from-blue-100 to-teal-100 text-xs font-bold text-slate-800">
                      {member.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              {resolvedMembers.length > 4 && (
                <Badge className="rounded-full" variant="secondary">+{resolvedMembers.length - 4}</Badge>
              )}
              {!resolvedMembers.length && <Badge className="rounded-full" variant="secondary">No members</Badge>}
            </div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500 transition-all duration-500"
              style={{ width: `${fillPercent}%` }}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {team.hackathon_category && <Badge className="rounded-full">{team.hackathon_category}</Badge>}
          {(team.preferred_roles ?? []).slice(0, 2).map((role) => (
            <Badge className="rounded-full bg-blue-50 text-blue-700 hover:bg-blue-50" key={role} variant="secondary">{role}</Badge>
          ))}
          {(team.required_skills ?? []).slice(0, 5).map((skill) => (
            <Badge className="rounded-full bg-slate-100 text-slate-700 hover:bg-slate-100" key={skill} variant="secondary">{skill}</Badge>
          ))}
        </div>

        <div className="mt-auto pt-5">
          <TeamAction canChat={isViewerMember} canManage={canManage} team={team} onJoin={onJoin} />
        </div>
      </div>
    </motion.article>
  );
}

function TeamAction({
  canChat,
  canManage,
  team,
  onJoin,
}: {
  canChat: boolean;
  canManage: boolean;
  team: Team;
  onJoin?: (team: Team) => void;
}) {
  if (canChat) {
    return (
      <div className={canManage ? "grid gap-2 sm:grid-cols-2" : "grid gap-2"}>
        <Button asChild variant="secondary" onClick={(event) => event.stopPropagation()}>
          <Link href={`/teams/${team.id}/chat`}>
            <MessageSquare className="h-4 w-4" />
            Chat
          </Link>
        </Button>
        {canManage && (
          <Button asChild variant="outline" onClick={(event) => event.stopPropagation()}>
            <Link href={`/teams/${team.id}`}>
              <Settings className="h-4 w-4" />
              Manage
            </Link>
          </Button>
        )}
      </div>
    );
  }

  if (team.has_pending_request) {
    return (
      <Button className="w-full" disabled variant="outline">
        Pending
      </Button>
    );
  }

  if (team.available_slots <= 0) {
    return (
      <Button className="w-full" disabled variant="outline">
        Team full
      </Button>
    );
  }

  return (
    <Button
      className="w-full border-slate-200 bg-white text-slate-900 shadow-sm hover:bg-slate-50 hover:text-slate-950"
      variant="outline"
      onClick={(event) => {
        event.stopPropagation();
        if (onJoin) onJoin(team);
        else toast.info("Open Requests to manage team join workflow.");
      }}
    >
      <Send className="h-4 w-4" />
      Request to join
    </Button>
  );
}

function orderMembers(members: TeamMember[]) {
  return [...members].sort((a, b) => {
    if (a.role === b.role) return a.name.localeCompare(b.name);
    return a.role === "leader" ? -1 : 1;
  });
}
