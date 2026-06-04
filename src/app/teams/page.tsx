"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Sparkles, Users, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { TeamCard } from "@/components/cards/TeamCard";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useRequireAuth } from "@/hooks/useAuth";
import { useDelayedLoading } from "@/hooks/useDelayedLoading";
import { queryKeys, staleTimes } from "@/lib/queryKeys";
import { getFriendlyErrorMessage } from "@/services/api";
import { createJoinRequest } from "@/services/requestService";
import { createTeam, listTeams } from "@/services/teamService";
import type { Team, TeamMember } from "@/types/team";

export default function TeamsPage() {
  const auth = useRequireAuth();
  const queryClient = useQueryClient();
  const viewerId = auth.user?.id ?? null;
  const teamsQueryKey = queryKeys.teamsForUser(viewerId);
  const myRequestsQueryKey = queryKeys.myRequestsForUser(viewerId);
  const [requestingTeam, setRequestingTeam] = useState<Team | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    max_members: "4",
    required_skills: "",
    interests: "",
    preferred_roles: "",
    hackathon_category: "",
  });

  const { data: teams = [], isLoading: loading } = useQuery({
    queryKey: teamsQueryKey,
    queryFn: listTeams,
    enabled: auth.isAuthenticated && Boolean(viewerId),
    staleTime: staleTimes.teams,
  });
  const showTeamsSkeleton = useDelayedLoading(loading);

  const myTeams = useMemo(
    () => teams.filter((team) => isVisibleMemberTeam(team, viewerId)),
    [teams, viewerId],
  );
  const discoverTeams = useMemo(
    () =>
      teams.filter(
        (team) =>
          !team.is_current_user_member &&
          !hasViewerMembership(team, viewerId) &&
          !team.has_pending_request &&
          team.available_slots > 0,
      ),
    [teams, viewerId],
  );
  const pendingTeams = useMemo(
    () => teams.filter((team) => !hasViewerMembership(team, viewerId) && !team.is_current_user_member && team.has_pending_request),
    [teams, viewerId],
  );

  const createTeamMutation = useMutation({
    mutationFn: createTeam,
    onSuccess: async () => {
      toast.success("Team created");
      setForm({
        name: "",
        description: "",
        max_members: "4",
        required_skills: "",
        interests: "",
        preferred_roles: "",
        hackathon_category: "",
      });
      await queryClient.invalidateQueries({ queryKey: teamsQueryKey });
    },
    onError: (error) => {
      toast.error(getFriendlyErrorMessage(error, "Could not create team."));
    },
  });

  const joinRequestMutation = useMutation({
    mutationFn: createJoinRequest,
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: teamsQueryKey });
      const previous = queryClient.getQueryData<Team[]>(teamsQueryKey);
      queryClient.setQueryData<Team[]>(teamsQueryKey, (current = []) =>
        current.map((team) =>
          team.id === payload.team_id ? { ...team, has_pending_request: true } : team,
        ),
      );
      return { previous };
    },
    onSuccess: () => {
      toast.success("Join request sent");
      setRequestingTeam(null);
      setRequestMessage("");
    },
    onError: (error, _payload, context) => {
      if (context?.previous) queryClient.setQueryData(teamsQueryKey, context.previous);
      toast.error(getFriendlyErrorMessage(error, "Could not send request."));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: myRequestsQueryKey });
    },
  });

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createTeamMutation.mutate({
      name: form.name,
      description: form.description || null,
      max_members: Number(form.max_members),
      required_skills: form.required_skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean),
      interests: form.interests
        .split(",")
        .map((interest) => interest.trim())
        .filter(Boolean),
      preferred_roles: form.preferred_roles
        .split(",")
        .map((role) => role.trim())
        .filter(Boolean),
      hackathon_category: form.hackathon_category || null,
    });
  }

  async function handleJoinRequest() {
    if (!requestingTeam) return;
    if (requestingTeam.is_current_user_member || requestingTeam.has_pending_request || requestingTeam.available_slots <= 0) {
      setRequestingTeam(null);
      return;
    }
    joinRequestMutation.mutate({
      team_id: requestingTeam.id,
      message: requestMessage || "I would like to join this team.",
    });
  }

  return (
    <main>
      <Navbar />
      <div className="flex min-h-[calc(100vh-4rem)]">
        <Sidebar />
        <section className="relative flex-1 overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
          <div className="pointer-events-none absolute left-8 top-12 h-56 w-56 rounded-full bg-blue-300/20 blur-3xl [animation:float-soft_10s_ease-in-out_infinite]" />
          <div className="pointer-events-none absolute right-8 top-80 h-72 w-72 rounded-full bg-teal-300/20 blur-3xl [animation:float-soft_12s_ease-in-out_infinite_reverse]" />
          <div className="relative mx-auto max-w-7xl">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 overflow-hidden rounded-[2rem] border border-white/75 bg-white/72 p-6 shadow-[0_26px_80px_rgba(15,23,42,0.09)] backdrop-blur-2xl sm:p-8"
            initial={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.4 }}
          >
            <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-200/80 bg-teal-50/80 px-3 py-1 text-sm font-bold text-teal-700">
                <Sparkles className="h-4 w-4" />
                Collaborative workspace
              </div>
              <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">Teams</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">Create squads, join active builds, and keep project momentum moving with a workspace made for students.</p>
            </div>
            <div className="grid grid-cols-3 gap-3 sm:min-w-[24rem]">
              <WorkspaceSignal label="Mine" value={myTeams.length} />
              <WorkspaceSignal label="Open" value={discoverTeams.length} />
              <WorkspaceSignal label="Pending" value={pendingTeams.length} />
            </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="auth-primary-cta" variant="default">
                  <Plus className="h-4 w-4" />
                  Create team
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogTitle>Create a team</DialogTitle>
                <DialogDescription>Add the basics. You can refine your team later.</DialogDescription>
                <form className="mt-5 space-y-4" onSubmit={handleCreate}>
                  <div className="space-y-2">
                    <Label htmlFor="team-name">Team name</Label>
                    <Input id="team-name" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="team-description">Description</Label>
                    <Input id="team-description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="team-size">Max members</Label>
                      <Input id="team-size" type="number" min="1" required value={form.max_members} onChange={(event) => setForm({ ...form, max_members: event.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="team-skills">Skills</Label>
                      <Input id="team-skills" placeholder="React, FastAPI" value={form.required_skills} onChange={(event) => setForm({ ...form, required_skills: event.target.value })} />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="team-interests">Project interests</Label>
                      <Input id="team-interests" placeholder="AI, fintech, climate" value={form.interests} onChange={(event) => setForm({ ...form, interests: event.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="team-category">Hackathon category</Label>
                      <Input id="team-category" placeholder="AI hackathon" value={form.hackathon_category} onChange={(event) => setForm({ ...form, hackathon_category: event.target.value })} />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="team-roles">Preferred roles</Label>
                      <Input id="team-roles" placeholder="Frontend, UI/UX, Backend" value={form.preferred_roles} onChange={(event) => setForm({ ...form, preferred_roles: event.target.value })} />
                    </div>
                  </div>
                  <Button className="w-full" variant="gradient" disabled={createTeamMutation.isPending}>
                    {createTeamMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Save team
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
              <Button asChild variant="secondary">
                <Link href="#discover-teams">
                  <Zap className="h-4 w-4" />
                  Browse open teams
                </Link>
              </Button>
            </div>
          </motion.div>

          {showTeamsSkeleton ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => <TeamCardSkeleton key={index} />)}
            </div>
          ) : (
            <div className="space-y-10">
              <TeamSection
                description="Quick access to teams you already belong to."
                emptyText="You are not a member of any teams yet."
                teams={myTeams}
                title="My Teams"
                onJoin={setRequestingTeam}
                onSelect={setSelectedTeam}
                viewerId={viewerId}
              />
              <TeamSection
                id="discover-teams"
                description="Open teams you can request to join."
                emptyText="No available teams to discover right now."
                teams={discoverTeams}
                title="Discover Teams"
                onJoin={setRequestingTeam}
                onSelect={setSelectedTeam}
                viewerId={viewerId}
              />
              <TeamSection
                description="Requests waiting for a team leader response."
                emptyText="You do not have pending team requests."
                teams={pendingTeams}
                title="Pending Requests"
                onJoin={setRequestingTeam}
                onSelect={setSelectedTeam}
                viewerId={viewerId}
              />
            </div>
          )}
          </div>
        </section>
      </div>
      <Dialog open={Boolean(selectedTeam)} onOpenChange={(open) => !open && setSelectedTeam(null)}>
        <DialogContent>
          <DialogTitle>{selectedTeam?.name}</DialogTitle>
          <DialogDescription>
            {selectedTeam?.description || "Team details and current collaborators."}
          </DialogDescription>
          {selectedTeam && (
            <div className="mt-5 space-y-5">
              <TeamSummary team={selectedTeam} members={selectedTeam.members} />
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-700">Skills needed</p>
                <div className="flex flex-wrap gap-2">
                  {selectedTeam.required_skills?.length ? (
                    selectedTeam.required_skills.map((skill) => (
                      <Badge key={skill} variant="secondary">{skill}</Badge>
                    ))
                  ) : (
                    <Badge variant="secondary">No required skills listed</Badge>
                  )}
                </div>
              </div>
              <div>
                <p className="mb-3 text-sm font-semibold text-slate-700">All members</p>
                <div className="grid gap-3">
                  {orderMembers(selectedTeam.members).map((member) => (
                    <MemberRow key={member.user_id} member={member} />
                  ))}
                </div>
              </div>
              {isVisibleMemberTeam(selectedTeam, viewerId) ? (
                <Button asChild className="w-full" variant="gradient">
                  <Link href={`/teams/${selectedTeam.id}/chat`}>Open chat</Link>
                </Button>
              ) : selectedTeam.has_pending_request ? (
                <Button className="w-full" disabled variant="outline">Pending</Button>
              ) : selectedTeam.available_slots <= 0 ? (
                <Button className="w-full" disabled variant="outline">Team full</Button>
              ) : (
                <Button
                  className="w-full"
                  variant="gradient"
                  onClick={() => {
                    setRequestingTeam(selectedTeam);
                    setSelectedTeam(null);
                  }}
                >
                  Request to join
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(requestingTeam)} onOpenChange={(open) => !open && setRequestingTeam(null)}>
        <DialogContent>
          <DialogTitle>Request to join {requestingTeam?.name}</DialogTitle>
          <DialogDescription>Send a message to the team leader.</DialogDescription>
          <div className="mt-5 space-y-4">
            <Textarea value={requestMessage} onChange={(event) => setRequestMessage(event.target.value)} placeholder="Share your skills and why you fit this team" />
            <Button className="w-full" variant="gradient" onClick={handleJoinRequest} disabled={joinRequestMutation.isPending}>
              {joinRequestMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Send request
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function TeamSection({
  id,
  title,
  description,
  emptyText,
  teams,
  viewerId,
  onJoin,
  onSelect,
}: {
  id?: string;
  title: string;
  description: string;
  emptyText: string;
  teams: Team[];
  viewerId?: number | null;
  onJoin: (team: Team) => void;
  onSelect: (team: Team) => void;
}) {
  return (
    <section id={id} className="rounded-[1.75rem] border border-white/70 bg-white/58 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.07)] backdrop-blur-xl sm:p-6">
      <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-950">{title}</h2>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        </div>
        <Badge className="w-fit rounded-full" variant="secondary">{teams.length} team{teams.length === 1 ? "" : "s"}</Badge>
      </div>
      {teams.length ? (
        <motion.div
          animate="show"
          className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
          initial="hidden"
          transition={{ staggerChildren: 0.06 }}
        >
          {teams.map((team) => (
            <motion.div
              key={team.id}
              variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
            >
            <TeamCard
              team={team}
              viewerId={viewerId}
              onJoin={onJoin}
              onSelect={onSelect}
            />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-300/80 bg-white/70 p-8 text-center shadow-sm backdrop-blur">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-teal-100 text-teal-700">
            <Users className="h-6 w-6" />
          </div>
          <p className="mt-4 font-black text-slate-950">{emptyText}</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-600">
            Team activity will appear here as soon as collaboration starts moving.
          </p>
        </div>
      )}
    </section>
  );
}

function TeamCardSkeleton() {
  return (
    <div className="h-72 rounded-3xl border border-white/80 bg-white/84 p-5 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 gap-3">
          <Skeleton className="h-12 w-12 shrink-0 rounded-2xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
        <Skeleton className="h-9 w-16 rounded-full" />
      </div>
      <div className="mt-6 space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Skeleton className="h-7 w-20 rounded-full" />
        <Skeleton className="h-7 w-24 rounded-full" />
        <Skeleton className="h-7 w-16 rounded-full" />
      </div>
      <div className="mt-6 grid grid-cols-2 gap-2">
        <Skeleton className="h-11 rounded-xl" />
        <Skeleton className="h-11 rounded-xl" />
      </div>
    </div>
  );
}

function WorkspaceSignal({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/80 bg-white/75 p-4 shadow-sm backdrop-blur">
      <p className="text-3xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-teal-600">{label}</p>
    </div>
  );
}

function orderMembers(members: TeamMember[]) {
  return [...members].sort((a, b) => {
    if (a.role === b.role) return a.name.localeCompare(b.name);
    return a.role === "leader" ? -1 : 1;
  });
}

function isVisibleMemberTeam(team: Team, viewerId?: number | null) {
  if (!team.is_current_user_member) return false;
  return hasViewerMembership(team, viewerId);
}

function hasViewerMembership(team: Team, viewerId?: number | null) {
  if (!viewerId) return false;
  return team.leader_id === viewerId || team.members.some((member) => member.user_id === viewerId);
}

function TeamSummary({ team, members }: { team: Team; members: TeamMember[] }) {
  const leader = members.find((member) => member.role === "leader");
  const count = team.current_members_count ?? members.length;
  const openSlots = team.available_slots ?? Math.max(team.max_members - count, 0);

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-xl bg-slate-50 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Creator</p>
        <p className="mt-1 font-semibold text-slate-800">{team.leader?.name ?? leader?.name ?? "Team leader"}</p>
      </div>
      <div className="rounded-xl bg-blue-50 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">Members</p>
        <p className="mt-1 font-semibold text-blue-700">{count}/{team.max_members}</p>
      </div>
      <div className="rounded-xl bg-teal-50 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-500">Open slots</p>
        <p className="mt-1 font-semibold text-teal-700">{openSlots}</p>
      </div>
    </div>
  );
}

function MemberRow({ member }: { member: TeamMember }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3">
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9">
          <AvatarFallback>{member.name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <p className="font-medium text-slate-800">{member.name}</p>
      </div>
      <Badge variant={member.role === "leader" ? "default" : "secondary"}>
        {member.role === "leader" ? "Leader" : "Member"}
      </Badge>
    </div>
  );
}
