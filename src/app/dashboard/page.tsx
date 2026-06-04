"use client";

import { useMemo, useState, type ElementType } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Compass,
  ExternalLink,
  Heart,
  Inbox,
  Loader2,
  MapPin,
  MessageSquare,
  Plus,
  Send,
  Sparkles,
  Users,
  Video,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { EventShareModal } from "@/components/team-chat/EventShareModal";
import { TeamCard } from "@/components/cards/TeamCard";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useRequireAuth } from "@/hooks/useAuth";
import { getEventStatus, getEventStatusBadgeClass, getEventStatusLabel, isActiveEvent } from "@/lib/eventStatus";
import { getSeenTeamMessageId } from "@/lib/teamChatNotifications";
import { queryKeys, staleTimes } from "@/lib/queryKeys";
import { formatDate } from "@/lib/utils";
import { createJoinRequest } from "@/services/requestService";
import { listRecommendedTeams } from "@/services/recommendationService";
import { listInterestedEvents, markEventInterested, removeEventInterest } from "@/services/eventService";
import { listTeamMessages, listTeams } from "@/services/teamService";
import type { Event } from "@/types/event";
import type { RecommendedTeam, Team, TeamMessage } from "@/types/team";

type ConversationPreview = {
  teamId: number;
  latest?: TeamMessage;
  unread: number;
};

const cardMotion = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};
const EVENT_PLACEHOLDER_IMAGE = "/event-placeholder.svg";

export default function DashboardPage() {
  const auth = useRequireAuth();
  const queryClient = useQueryClient();
  const [requestingTeamId, setRequestingTeamId] = useState<number | null>(null);
  const viewerId = auth.user?.id ?? null;
  const teamsQueryKey = queryKeys.teamsForUser(viewerId);
  const interestedEventsQueryKey = queryKeys.interestedEventsForUser(viewerId);
  const recommendedTeamsQueryKey = queryKeys.recommendedTeamsForUser(viewerId);
  const myRequestsQueryKey = queryKeys.myRequestsForUser(viewerId);

  const { data: teams = [], isLoading: teamsLoading } = useQuery({
    queryKey: teamsQueryKey,
    queryFn: listTeams,
    enabled: auth.isAuthenticated && Boolean(viewerId),
    staleTime: staleTimes.teams,
  });
  const { data: interestedEventsData = [], isLoading: eventsLoading } = useQuery({
    queryKey: interestedEventsQueryKey,
    queryFn: listInterestedEvents,
    enabled: auth.isAuthenticated && Boolean(viewerId),
    staleTime: staleTimes.events,
  });
  const { data: recommendedTeams = [], isLoading: recommendedLoading } = useQuery({
    queryKey: recommendedTeamsQueryKey,
    queryFn: listRecommendedTeams,
    enabled: auth.isAuthenticated && Boolean(viewerId) && !teamsLoading,
    staleTime: staleTimes.teams,
  });

  const myTeams = useMemo(
    () => teams.filter((team) => isVisibleMemberTeam(team, viewerId)),
    [teams, viewerId],
  );
  const myEventTeams = useMemo(() => myTeams.filter((team) => Boolean(team.event_id)), [myTeams]);
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
  const firstName = auth.user?.name?.split(" ")[0] || auth.user?.username || "student";
  const skillCount = auth.user?.skills?.length ?? 0;
  const interestedEvents = useMemo(
    () => sortUpcomingEvents(interestedEventsData.filter(isActiveEvent)).slice(0, 3),
    [interestedEventsData],
  );
  const nextEvent = interestedEvents[0];
  const { data: conversationPreviews = {}, isLoading: conversationsLoading } = useQuery({
    queryKey: ["teams", "conversation-previews", "viewer", viewerId ?? "anonymous", myTeams.map((team) => team.id).join(",")],
    queryFn: async () => {
      const entries = await Promise.allSettled(
        myTeams.slice(0, 3).map(async (team) => {
        const page = await listTeamMessages(team.id, {
          limit: 1,
          suppressNetworkErrorLog: true,
        });
        const latest = page.items.at(-1);
        const seenId = getSeenTeamMessageId(team.id);
        return [
          team.id,
          {
            teamId: team.id,
            latest,
            unread: latest && latest.id > seenId ? 1 : 0,
          },
        ] as const;
        }),
      );
      return Object.fromEntries(
        entries
          .filter((entry) => entry.status === "fulfilled")
          .map((entry) => entry.value),
      );
    },
    enabled: auth.isAuthenticated && Boolean(viewerId) && myTeams.length > 0,
    staleTime: 45 * 1000,
  });
  const unreadCount = Object.values(conversationPreviews).reduce((sum, preview) => sum + preview.unread, 0);
  const loading = teamsLoading || eventsLoading;

  async function requestRecommendedTeam(team: RecommendedTeam) {
    setRequestingTeamId(team.team_id);
    try {
      await createJoinRequest({
        team_id: team.team_id,
        message: "I would like to join this recommended team.",
      });
      queryClient.setQueryData<RecommendedTeam[]>(recommendedTeamsQueryKey, (current = []) =>
        current.filter((item) => item.team_id !== team.team_id),
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: myRequestsQueryKey }),
        queryClient.invalidateQueries({ queryKey: teamsQueryKey }),
      ]);
      toast.success("Join request sent");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send request");
    } finally {
      setRequestingTeamId(null);
    }
  }

  return (
    <main>
      <Navbar />
      <div className="flex min-h-[calc(100vh-3.5rem)]">
        <Sidebar />
        <section className="relative flex-1 overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
          <div className="relative mx-auto max-w-7xl space-y-8">
            <motion.section
              animate={{ opacity: 1, y: 0 }}
              className="overflow-hidden rounded-[1.75rem] border border-white/75 bg-white/76 p-6 shadow-[0_18px_56px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-8"
              initial={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.45 }}
            >
              <div className="grid gap-8 lg:grid-cols-[1.5fr_0.9fr] lg:items-center">
                <div>
                  <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-indigo-50/80 px-3 py-1 text-sm font-semibold text-indigo-700">
                    <Sparkles className="h-4 w-4" />
                    Your student command center
                  </div>
                  <h1 className="max-w-3xl text-3xl font-bold leading-tight tracking-tight text-slate-950 sm:text-4xl">
                    Hi {firstName}, ready to make today count?
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                    Keep your events, teams, requests, and conversations in one focused space built around your momentum.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Button asChild className="auth-primary-cta" variant="default">
                      <Link href="/teams">
                        <Plus className="h-4 w-4" />
                        Create team
                      </Link>
                    </Button>
                    <Button asChild variant="secondary">
                      <Link href="/discover">
                        <Compass className="h-4 w-4" />
                        Find collaborators
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/80 bg-gradient-to-br from-slate-950 via-indigo-950 to-blue-900 p-5 text-white shadow-xl shadow-blue-950/16">
                  <p className="text-sm font-semibold text-teal-100">Next focus</p>
                  <h2 className="mt-3 line-clamp-2 text-2xl font-black tracking-tight">
                    {nextEvent?.title || "Build your next opportunity"}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-blue-100">
                    {nextEvent
                      ? `${formatDate(nextEvent.start_date)} · ${nextEvent.venue || nextEvent.mode}`
                      : "Save an event or join a team to personalize this space."}
                  </p>
                  <div className="mt-6 grid grid-cols-3 gap-3">
                    <MiniSignal label="Teams" value={myTeams.length} />
                    <MiniSignal label="Events" value={interestedEvents.length} />
                    <MiniSignal label="Unread" value={unreadCount} />
                  </div>
                </div>
              </div>
            </motion.section>

            <motion.div
              animate="show"
              className="grid gap-4 md:grid-cols-3"
              initial="hidden"
              transition={{ staggerChildren: 0.08 }}
            >
              <Stat title="Interested events" value={interestedEvents.length} icon={CalendarDays} tone="from-violet-500 to-blue-500" />
              <Stat title="My teams" value={myTeams.length} icon={Users} tone="from-blue-500 to-cyan-500" />
              <Stat title="Skills" value={skillCount} icon={Sparkles} tone="from-teal-500 to-emerald-500" />
            </motion.div>

            <div className="grid gap-4 lg:grid-cols-3">
              <QuickAction href="/discover" title="Discover collaborators" icon={Compass} copy="Find students by skill, branch, year, and shared interests." />
              <QuickAction href="/requests" title="Request center" icon={Inbox} copy="Review team invites and keep collaboration moving." />
              <QuickAction href="/clubs" title="Club workspace" icon={Zap} copy="Plan activities, manage events, and stay close to campus energy." />
            </div>

            <DashboardSection
              actionHref="/events"
              actionText="Explore events"
              eyebrow="Activity"
              title="Interested Events"
              subtitle="Saved hackathons and campus moments worth showing up for."
            >
              <div className="grid gap-5 lg:grid-cols-3">
                {loading
                  ? Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-96 rounded-3xl" />)
                  : interestedEvents.map((event, index) => (
                      <DashboardEventCard
                        key={event.id}
                        event={event}
                        index={index}
                        onInterestChange={(updatedEvent) => {
                          queryClient.setQueryData<Event[]>(interestedEventsQueryKey, (current = []) =>
                            updateInterestedEvents(current, updatedEvent),
                          );
                        }}
                      />
                    ))}
                {!loading && !interestedEvents.length && (
                  <EmptyPanel
                    actionHref="/events"
                    actionText="Find events"
                    icon={CalendarDays}
                    text="Mark events as Interested to turn this into your personal opportunity board."
                    title="No saved events yet"
                  />
                )}
              </div>
            </DashboardSection>

            <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <DashboardSection
                actionHref="/teams"
                actionText="View all"
                eyebrow="Crew"
                title="My Teams"
                subtitle="The people and projects you are building with."
              >
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-1">
                  {loading
                    ? Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-56 rounded-3xl" />)
                    : myTeams.slice(0, 3).map((team) => <TeamCard compact key={team.id} team={team} viewerId={viewerId} />)}
                  {!loading && !myTeams.length && (
                    <EmptyPanel
                      actionHref="/teams"
                      actionText="Create team"
                      icon={Users}
                      text="Create or join a team to bring project work and team chat into your dashboard."
                      title="Your team space is waiting"
                    />
                  )}
                </div>
              </DashboardSection>

              <DashboardSection
                eyebrow="Social pulse"
                title="Team Conversations"
                subtitle="A quick path back into active team chats."
              >
                <div className="space-y-4">
                  {conversationsLoading
                    ? Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-36 rounded-3xl" />)
                    : myTeams.slice(0, 3).map((team) => (
                        <ConversationCard
                          key={team.id}
                          preview={conversationPreviews[team.id]}
                          team={team}
                        />
                      ))}
                  {!loading && !myTeams.length && (
                    <EmptyPanel
                      actionHref="/teams"
                      actionText="Browse teams"
                      icon={MessageSquare}
                      text="Join or create a team to start conversations that stay close to your work."
                      title="No conversations yet"
                    />
                  )}
                </div>
              </DashboardSection>
            </div>

            <DashboardSection
              actionHref="/events"
              actionText="Find events"
              eyebrow="Hackathon squads"
              title="My Event Teams"
              subtitle="Teams formed around specific events and hackathons."
            >
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {loading
                  ? Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-56 rounded-3xl" />)
                  : myEventTeams.slice(0, 3).map((team) => <TeamCard compact key={team.id} team={team} viewerId={viewerId} />)}
                {!loading && !myEventTeams.length && (
                  <EmptyPanel
                    actionHref="/events"
                    actionText="Browse events"
                    icon={CalendarDays}
                    text="Create an event team from a hackathon or event when you need teammates for that specific opportunity."
                    title="No event teams yet"
                  />
                )}
              </div>
            </DashboardSection>

            <DashboardSection
              actionHref="/teams"
              actionText="Browse teams"
              eyebrow="Matched for you"
              title="Recommended Teams"
              subtitle="Skill, interest, and profile-based matches with room for you."
            >
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {recommendedLoading
                    ? Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-72 rounded-3xl" />)
                  : recommendedTeams.slice(0, 5).map((team) => (
                      <RecommendedTeamCard
                        key={team.team_id}
                        loading={requestingTeamId === team.team_id}
                        team={team}
                        onRequest={requestRecommendedTeam}
                      />
                    ))}
                {!recommendedLoading && !recommendedTeams.length && (
                  <EmptyPanel
                    actionHref="/profile"
                    actionText="Update profile"
                    icon={Sparkles}
                    text="Add skills and save events to help VibeTribe surface sharper team matches."
                    title="Matches are warming up"
                  />
                )}
              </div>
            </DashboardSection>

            <DashboardSection
              actionHref="/teams"
              actionText="Browse"
              eyebrow="Open doors"
              title="Discover Teams"
              subtitle="Public teams currently accepting requests."
            >
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {loading
                  ? Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-56 rounded-3xl" />)
                  : discoverTeams.slice(0, 3).map((team) => <TeamCard compact key={team.id} team={team} viewerId={viewerId} />)}
                {!loading && !discoverTeams.length && (
                  <EmptyPanel
                    actionHref="/discover"
                    actionText="Discover students"
                    icon={Compass}
                    text="No open teams are available right now. Try finding people first and starting your own."
                    title="No open teams today"
                  />
                )}
              </div>
            </DashboardSection>
          </div>
        </section>
      </div>
    </main>
  );
}

function DashboardSection({
  actionHref,
  actionText,
  children,
  eyebrow,
  subtitle,
  title,
}: {
  actionHref?: string;
  actionText?: string;
  children: React.ReactNode;
  eyebrow: string;
  subtitle: string;
  title: string;
}) {
  return (
    <section className="rounded-[1.5rem] border border-white/75 bg-white/68 p-5 shadow-[0_14px_44px_rgba(15,23,42,0.06)] backdrop-blur-xl sm:p-6">
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">{eyebrow}</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{title}</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">{subtitle}</p>
        </div>
        {actionHref && actionText ? (
          <Button asChild variant="ghost">
            <Link href={actionHref}>
              {actionText}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function DashboardEventCard({
  event,
  index,
  onInterestChange,
}: {
  event: Event;
  index: number;
  onInterestChange?: (event: Event) => void;
}) {
  const [currentEvent, setCurrentEvent] = useState(event);
  const [updatingInterest, setUpdatingInterest] = useState(false);
  const coverImage = currentEvent.image_url || EVENT_PLACEHOLDER_IMAGE;
  const status = getEventStatus(currentEvent);
  const finished = status === "finished";

  async function toggleInterest() {
    if (updatingInterest || finished) return;
    const previous = currentEvent;
    const nextInterested = !previous.is_interested;
    const optimisticEvent = {
      ...previous,
      is_interested: nextInterested,
      interested_count: Math.max(previous.interested_count + (nextInterested ? 1 : -1), 0),
    };
    setCurrentEvent(optimisticEvent);
    onInterestChange?.(optimisticEvent);
    setUpdatingInterest(true);

    try {
      const response = nextInterested
        ? await markEventInterested(previous.id)
        : await removeEventInterest(previous.id);
      const savedEvent = {
        ...optimisticEvent,
        is_interested: response.is_interested,
        interested_count: response.interested_count,
      };
      setCurrentEvent(savedEvent);
      onInterestChange?.(savedEvent);
      toast.success(response.is_interested ? "Added to interested events" : "Removed from interested events");
    } catch (error) {
      setCurrentEvent(previous);
      onInterestChange?.(previous);
      toast.error(error instanceof Error ? error.message : "Could not update interest");
    } finally {
      setUpdatingInterest(false);
    }
  }

  return (
    <motion.article
      className={`group overflow-hidden rounded-2xl border shadow-[0_14px_42px_rgba(15,23,42,0.07)] backdrop-blur transition-all duration-300 hover:-translate-y-1 ${
        finished
          ? "border-slate-200/80 bg-slate-100/88 grayscale-[0.2] hover:border-slate-300 hover:bg-slate-100"
          : "border-slate-200/70 bg-white/90 hover:border-blue-200/90 hover:bg-white hover:shadow-[0_22px_62px_rgba(37,99,235,0.13)]"
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.35 }}
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        <Image
          alt={currentEvent.image_url ? currentEvent.title : "VibeTribe event placeholder"}
          className="object-cover transition duration-700 group-hover:scale-105"
          fill
          loading="lazy"
          sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
          src={coverImage}
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent" />
        <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <StatusChip status={status} />
            <MetaChip>{currentEvent.event_type}</MetaChip>
            <MetaChip>{currentEvent.mode}</MetaChip>
          </div>
          <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-indigo-700 shadow-sm backdrop-blur">
            {currentEvent.interested_count} interested
          </span>
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="line-clamp-2 text-xl font-bold tracking-tight text-white">{currentEvent.title}</h3>
        </div>
      </div>

      <div className="space-y-4 p-5">
        {finished && (
          <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600">
            This event has ended
          </p>
        )}
        <p className="line-clamp-2 text-sm leading-6 text-slate-600">{currentEvent.description}</p>
        <div className="grid gap-2 text-sm text-slate-600">
          <MetadataRow icon={CalendarDays} text={formatDate(currentEvent.start_date)} />
          <MetadataRow
            icon={currentEvent.mode === "online" ? Video : MapPin}
            text={currentEvent.venue || currentEvent.mode}
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full" variant="secondary">View details</Button>
            </DialogTrigger>
            <DialogContent>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <DialogTitle>{currentEvent.title}</DialogTitle>
                <StatusChip status={status} />
              </div>
              <DialogDescription>
                {currentEvent.event_type} hosted {formatDate(currentEvent.start_date)}
              </DialogDescription>
              <div className="mt-4 space-y-4">
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl">
                  <Image
                    alt={currentEvent.image_url ? currentEvent.title : "VibeTribe event placeholder"}
                    className="object-cover"
                    fill
                    loading="lazy"
                    sizes="min(92vw, 640px)"
                    src={coverImage}
                    unoptimized
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3">
                  <span className="text-sm font-semibold text-slate-700">
                    {currentEvent.interested_count} students interested
                  </span>
                  {finished ? (
                    <EndedActionLabel />
                  ) : (
                    <InterestedButton disabled={updatingInterest} event={currentEvent} onClick={toggleInterest} />
                  )}
                </div>
                {finished && (
                  <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600">
                    This event has ended
                  </p>
                )}
                <p className="text-sm leading-6 text-slate-700">{currentEvent.description}</p>
                <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                  <span>Starts: {formatDate(currentEvent.start_date)}</span>
                  <span>Ends: {formatDate(currentEvent.end_date)}</span>
                  <span>Mode: {currentEvent.mode}</span>
                  <span>Venue: {currentEvent.venue || "To be announced"}</span>
                </div>
                {currentEvent.registration_link && (
                  <Button asChild className="auth-primary-cta" variant="default">
                    <a href={currentEvent.registration_link} target="_blank" rel="noreferrer">
                      Register
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            </DialogContent>
          </Dialog>
          {finished ? (
            <EndedActionLabel />
          ) : (
            <InterestedButton disabled={updatingInterest} event={currentEvent} onClick={toggleInterest} />
          )}
          <div className="sm:col-span-2 [&_button]:w-full [&_button]:border-slate-200 [&_button]:bg-white [&_button]:text-slate-800 [&_button]:shadow-sm [&_button:hover]:bg-slate-50 [&_button:hover]:text-slate-950">
            <EventShareModal disabled={finished} event={currentEvent} />
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function RecommendedTeamCard({
  team,
  loading,
  onRequest,
}: {
  team: RecommendedTeam;
  loading: boolean;
  onRequest: (team: RecommendedTeam) => void;
}) {
  return (
    <motion.div
      className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-[0_14px_42px_rgba(15,23,42,0.07)] backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-blue-200/90 hover:bg-white hover:shadow-[0_22px_62px_rgba(37,99,235,0.13)]"
      variants={cardMotion}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-lg font-bold text-slate-950">{team.team_name}</p>
          <p className="mt-1 text-sm text-slate-500">
            {team.open_slots} open slot{team.open_slots === 1 ? "" : "s"}
          </p>
        </div>
        <div className="rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 px-3 py-2 text-sm font-bold text-white shadow-md shadow-blue-500/18">
          {team.match_score}%
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {team.reason_tags.slice(0, 4).map((tag) => (
          <Badge key={tag} variant="secondary">{tag}</Badge>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        {team.reasons.slice(0, 3).map((reason) => (
          <p key={reason} className="flex gap-2 text-sm leading-6 text-slate-600">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" />
            {reason}
          </p>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {team.required_skills.slice(0, 4).map((skill) => (
          <Badge key={skill}>{skill}</Badge>
        ))}
      </div>

      <div className="mt-4 line-clamp-2 text-sm text-slate-500">
        {team.members.length ? (
          <>Members: {team.members.map((member) => member.username || member.name).join(", ")}</>
        ) : (
          "No members listed"
        )}
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <Button asChild variant="outline">
          <Link href={`/teams/${team.team_id}`}>View team</Link>
        </Button>
        <Button className="auth-primary-cta" disabled={loading} onClick={() => onRequest(team)} variant="default">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Request
        </Button>
      </div>
    </motion.div>
  );
}

function ConversationCard({
  team,
  preview,
}: {
  team: Team;
  preview?: ConversationPreview;
}) {
  const latest = preview?.latest;
  return (
    <Link
      className="group block rounded-2xl border border-slate-200/70 bg-white/86 p-4 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-blue-200/90 hover:bg-white hover:shadow-[0_18px_48px_rgba(15,23,42,0.09)]"
      href={`/teams/${team.id}/chat`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-bold text-slate-950">{team.name}</p>
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">
            {latest?.content || (latest?.event ? `${latest.sender.name} shared ${latest.event.title}` : "No messages yet.")}
          </p>
        </div>
        {preview?.unread ? (
          <span className="rounded-full bg-teal-500 px-2 py-0.5 text-xs font-bold text-white">
            {preview.unread}
          </span>
        ) : null}
      </div>
      <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-teal-700 transition group-hover:gap-3">
        Open chat
        <MessageSquare className="h-4 w-4" />
      </div>
    </Link>
  );
}

function EmptyPanel({
  actionHref,
  actionText,
  icon: Icon,
  text,
  title,
}: {
  actionHref: string;
  actionText: string;
  icon: ElementType;
  text: string;
  title: string;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300/80 bg-white/62 p-6 text-center shadow-sm backdrop-blur">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
        <Icon className="h-6 w-6" />
      </div>
      <p className="mt-4 text-lg font-bold text-slate-950">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-600">{text}</p>
      <Button asChild className="mt-5" variant="secondary">
        <Link href={actionHref}>{actionText}</Link>
      </Button>
    </div>
  );
}

function MiniSignal({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur">
      <p className="text-2xl font-black">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-blue-100">{label}</p>
    </div>
  );
}

function QuickAction({
  href,
  title,
  copy,
  icon: Icon,
}: {
  href: string;
  title: string;
  copy: string;
  icon: ElementType;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-slate-200/70 bg-white/82 p-5 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-blue-200/90 hover:bg-white hover:shadow-[0_18px_52px_rgba(37,99,235,0.11)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-md shadow-blue-500/18">
          <Icon className="h-5 w-5" />
        </div>
        <ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-teal-600" />
      </div>
      <p className="mt-4 font-bold text-slate-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{copy}</p>
    </Link>
  );
}

function Stat({
  title,
  value,
  icon: Icon,
  tone,
}: {
  title: string;
  value: number;
  icon: ElementType;
  tone: string;
}) {
  return (
    <motion.div
      className="group relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/88 p-5 shadow-[0_14px_42px_rgba(15,23,42,0.07)] backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-blue-200/90 hover:bg-white hover:shadow-[0_22px_62px_rgba(37,99,235,0.12)]"
      variants={cardMotion}
    >
      <div className={`absolute -right-10 -top-12 h-32 w-32 rounded-full bg-gradient-to-br ${tone} opacity-20 blur-2xl transition group-hover:opacity-35`} />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-500">{title}</p>
          <motion.p
            className="mt-3 text-4xl font-bold tracking-tight text-slate-950"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35 }}
          >
            {value}
          </motion.p>
        </div>
        <div className={`rounded-2xl bg-gradient-to-br ${tone} p-3 text-white shadow-lg shadow-blue-500/20`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
}

function MetadataRow({ icon: Icon, text }: { icon: ElementType; text: string }) {
  return (
    <p className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2">
      <Icon className="h-4 w-4 text-indigo-600" />
      <span className="truncate">{text}</span>
    </p>
  );
}

function MetaChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-white/88 px-3 py-1 text-xs font-bold capitalize text-slate-700 shadow-sm backdrop-blur">
      {children}
    </span>
  );
}

function StatusChip({ status }: { status: ReturnType<typeof getEventStatus> }) {
  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-bold shadow-sm backdrop-blur ${getEventStatusBadgeClass(status)}`}>
      {getEventStatusLabel(status)}
    </span>
  );
}

function InterestedButton({
  event,
  disabled = false,
  onClick,
}: {
  event: Event;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      className={
        event.is_interested
          ? "auth-primary-cta w-full min-w-[9.5rem]"
          : "w-full min-w-[9.5rem] border-slate-200 bg-white text-slate-900 shadow-sm hover:bg-slate-50 hover:text-slate-950"
      }
      disabled={disabled}
      onClick={onClick}
      type="button"
      variant={event.is_interested ? "default" : "outline"}
    >
      <Heart className={event.is_interested ? "h-4 w-4 fill-current" : "h-4 w-4"} />
      <span>{event.is_interested ? "Interested" : "Save event"}</span>
    </Button>
  );
}

function EndedActionLabel() {
  return (
    <div className="flex h-11 w-full min-w-[9.5rem] items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-500">
      Event ended
    </div>
  );
}

function sortUpcomingEvents(events: Event[]) {
  return [...events].sort(
    (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime(),
  );
}

function isVisibleMemberTeam(team: Team, viewerId?: number | null) {
  if (!team.is_current_user_member) return false;
  return hasViewerMembership(team, viewerId);
}

function hasViewerMembership(team: Team, viewerId?: number | null) {
  if (!viewerId) return false;
  return team.leader_id === viewerId || team.members.some((member) => member.user_id === viewerId);
}

function updateInterestedEvents(events: Event[], updatedEvent: Event) {
  const withoutEvent = events.filter((event) => event.id !== updatedEvent.id);
  if (!updatedEvent.is_interested || !isActiveEvent(updatedEvent)) return withoutEvent;
  return sortUpcomingEvents([...withoutEvent, updatedEvent]).slice(0, 3);
}
