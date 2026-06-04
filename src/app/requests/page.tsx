"use client";

import { useMemo, type ElementType } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Inbox, Send } from "lucide-react";
import { motion } from "framer-motion";
import { RequestCard } from "@/components/cards/RequestCard";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useRequireAuth } from "@/hooks/useAuth";
import { useDelayedLoading } from "@/hooks/useDelayedLoading";
import { queryKeys, staleTimes } from "@/lib/queryKeys";
import { listMyRequests, listTeamRequests } from "@/services/requestService";
import { listTeams } from "@/services/teamService";

export default function RequestsPage() {
  const auth = useRequireAuth();
  const viewerId = auth.user?.id ?? null;
  const teamsQueryKey = queryKeys.teamsForUser(viewerId);
  const myRequestsQueryKey = queryKeys.myRequestsForUser(viewerId);
  const { data: sent = [], isLoading: sentLoading } = useQuery({
    queryKey: myRequestsQueryKey,
    queryFn: () => listMyRequests(),
    enabled: auth.isAuthenticated && Boolean(viewerId),
    staleTime: staleTimes.requests,
  });
  const { data: teams = [], isLoading: teamsLoading } = useQuery({
    queryKey: teamsQueryKey,
    queryFn: listTeams,
    enabled: auth.isAuthenticated && Boolean(viewerId),
    staleTime: staleTimes.teams,
  });

  const leaderTeams = useMemo(
    () => teams.filter((team) => isVisibleLeaderTeam(team, viewerId)),
    [teams, viewerId],
  );

  const incomingQueries = useQueries({
    queries: leaderTeams.map((team) => ({
      queryKey: queryKeys.teamRequestsForUser(team.id, viewerId),
      queryFn: () => listTeamRequests(team.id),
      enabled: auth.isAuthenticated && Boolean(viewerId),
      staleTime: staleTimes.requests,
    })),
  });
  const incoming = useMemo(
    () => incomingQueries.flatMap((query) => query.data ?? []),
    [incomingQueries],
  );
  const incomingLoading = teamsLoading || incomingQueries.some((query) => query.isLoading);
  const showIncomingSkeleton = useDelayedLoading(incomingLoading);
  const showSentSkeleton = useDelayedLoading(sentLoading);

  return (
    <main>
      <Navbar />
      <div className="flex min-h-[calc(100vh-3.5rem)]">
        <Sidebar />
        <section className="relative flex-1 overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
          <div className="relative mx-auto max-w-7xl">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 overflow-hidden rounded-[1.75rem] border border-white/75 bg-white/76 p-6 shadow-[0_18px_56px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-8"
            initial={{ opacity: 0, y: 14 }}
            transition={{ duration: 0.35 }}
          >
            <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <p className="text-sm font-semibold text-indigo-700">Request center</p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                  Incoming and sent collaboration requests
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                  Keep invites moving with clear context, warm replies, and a quick view of every request tied to your teams.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:min-w-72">
                <RequestSignal icon={Inbox} label="Incoming" value={incoming.length} />
                <RequestSignal icon={Send} label="Sent" value={sent.length} />
              </div>
            </div>
          </motion.div>
          <Tabs defaultValue="incoming">
            <TabsList className="mb-5">
              <TabsTrigger value="incoming">Incoming ({incoming.length})</TabsTrigger>
              <TabsTrigger value="sent">Sent ({sent.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="incoming">
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {showIncomingSkeleton
                  ? Array.from({ length: 3 }).map((_, index) => <RequestCardSkeleton key={index} />)
                  : incoming.map((request) => <RequestCard key={request.id} request={request} mode="incoming" />)}
              </div>
              {!incomingLoading && leaderTeams.length === 0 && (
                <EmptyRequests text="Create a team to receive incoming join requests." />
              )}
            </TabsContent>
            <TabsContent value="sent">
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {showSentSkeleton
                  ? Array.from({ length: 3 }).map((_, index) => <RequestCardSkeleton key={index} />)
                  : sent.map((request) => <RequestCard key={request.id} request={request} mode="sent" />)}
              </div>
              {!sentLoading && sent.length === 0 && (
                <EmptyRequests text="Sent requests will appear here when you reach out to teams." />
              )}
            </TabsContent>
          </Tabs>
          </div>
        </section>
      </div>
    </main>
  );
}

function RequestSignal({
  icon: Icon,
  label,
  value,
}: {
  icon: ElementType;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-white/80 bg-white/78 p-4 shadow-sm backdrop-blur">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-indigo-600" />
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">{label}</p>
      </div>
      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{value}</p>
    </div>
  );
}

function EmptyRequests({ text }: { text: string }) {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-slate-300/80 bg-white/70 p-8 text-center shadow-sm backdrop-blur">
      <p className="text-sm leading-6 text-slate-500">{text}</p>
    </div>
  );
}

function RequestCardSkeleton() {
  return (
    <div className="h-64 rounded-2xl border border-white/80 bg-white/90 p-5 shadow-sm backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <Skeleton className="h-10 w-10 shrink-0 rounded-2xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
        <Skeleton className="h-7 w-20 rounded-full" />
      </div>
      <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50/85 p-4">
        <Skeleton className="h-3 w-24" />
        <div className="mt-3 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Skeleton className="h-10 rounded-xl" />
        <Skeleton className="h-10 rounded-xl" />
      </div>
    </div>
  );
}

function isVisibleLeaderTeam(team: { is_current_user_member: boolean; is_current_user_leader: boolean; leader_id: number; members: { user_id: number; role: string }[] }, viewerId?: number | null) {
  if (!viewerId || !team.is_current_user_member) return false;
  const membership = team.members.find((member) => member.user_id === viewerId);
  return Boolean(team.is_current_user_leader || team.leader_id === viewerId || membership?.role === "leader");
}
