"use client";

import { CalendarDays, ExternalLink, Heart, Loader2, MapPin, UserPlus, Users, Video } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EventShareModal } from "@/components/team-chat/EventShareModal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getEventStatus, getEventStatusBadgeClass, getEventStatusLabel, isFinishedEvent } from "@/lib/eventStatus";
import { formatDate } from "@/lib/utils";
import { queryKeys } from "@/lib/queryKeys";
import { markEventInterested, removeEventInterest, listEventTeammates } from "@/services/eventService";
import { createTeam } from "@/services/teamService";
import type { Event, EventTeammateRecommendation } from "@/types/event";
import type { TeamPayload } from "@/types/team";

const EVENT_PLACEHOLDER_IMAGE = "/event-placeholder.svg";

export function EventCard({
  event,
  onInterestChange,
}: {
  event: Event;
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
      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border shadow-[0_14px_42px_rgba(15,23,42,0.07)] backdrop-blur transition-all duration-300 hover:-translate-y-1 ${
        finished
          ? "border-slate-200/80 bg-slate-100/88 grayscale-[0.2] hover:border-slate-300 hover:bg-slate-100"
          : "border-slate-200/70 bg-white/90 hover:border-blue-200/90 hover:bg-white hover:shadow-[0_22px_62px_rgba(37,99,235,0.14)]"
      }`}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
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
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/15 to-transparent" />
        <div className="absolute left-3 right-3 top-3 flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <StatusPill status={status} />
            <MetaPill>{currentEvent.event_type}</MetaPill>
            <MetaPill>{currentEvent.mode}</MetaPill>
          </div>
          <span className="rounded-full bg-white/92 px-3 py-1 text-xs font-bold text-indigo-700 shadow-sm backdrop-blur">
            {currentEvent.interested_count} interested
          </span>
        </div>
        <h3 className="absolute bottom-3 left-3 right-3 line-clamp-2 text-xl font-bold tracking-tight text-white">
          {currentEvent.title}
        </h3>
      </div>

      <div className="relative flex flex-1 flex-col space-y-4 p-5">
        {finished && (
          <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600">
            This event has ended
          </p>
        )}
        <p className="line-clamp-2 text-sm leading-6 text-slate-600">{currentEvent.description}</p>
        <div className="grid gap-2 text-sm text-slate-700">
          <MetadataChip icon={CalendarDays} text={formatDate(currentEvent.start_date)} />
          <MetadataChip
            icon={currentEvent.mode === "online" ? Video : MapPin}
            text={currentEvent.venue || currentEvent.mode}
          />
        </div>
        <div className="mt-auto grid gap-2 sm:grid-cols-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full border-slate-200 bg-white text-slate-900 shadow-sm hover:bg-slate-50 hover:text-slate-950" variant="outline">
                View details
              </Button>
            </DialogTrigger>
            <DialogContent>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <DialogTitle>{currentEvent.title}</DialogTitle>
                <StatusPill status={status} />
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
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                  <span className="text-sm font-semibold text-slate-700">
                    {currentEvent.interested_count} interested
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
                      Register <ExternalLink className="h-4 w-4" />
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
          <div className="sm:col-span-2">
            <EventTeammatesDialog event={currentEvent} />
          </div>
          <div className="sm:col-span-2 [&_button]:w-full [&_button]:border-slate-200 [&_button]:bg-white [&_button]:text-slate-800 [&_button]:shadow-sm [&_button:hover]:bg-slate-50 [&_button:hover]:text-slate-950">
            <EventShareModal disabled={finished} event={currentEvent} />
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function EventTeammatesDialog({ event }: { event: Event }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: `${event.title} team`,
    required_skills: "",
    max_members: "4",
  });
  const queryClient = useQueryClient();
  const finished = isFinishedEvent(event);
  const { data: teammates = [], isLoading } = useQuery({
    queryKey: ["events", event.id, "teammates"],
    queryFn: () => listEventTeammates(event.id),
    enabled: open,
    staleTime: 60 * 1000,
  });
  const createEventTeam = useMutation({
    mutationFn: (payload: TeamPayload) => createTeam(payload),
    onSuccess: async () => {
      toast.success("Event team created");
      await queryClient.invalidateQueries({ queryKey: queryKeys.teams });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not create event team");
    },
  });

  function submitTeam(eventSubmit: React.FormEvent<HTMLFormElement>) {
    eventSubmit.preventDefault();
    if (finished) return;
    createEventTeam.mutate({
      name: form.name,
      description: `Formed for ${event.title}.`,
      event_id: event.id,
      hackathon_category: event.event_type === "hackathon" ? event.title : null,
      interests: [event.title],
      preferred_roles: [],
      required_skills: form.required_skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean),
      max_members: Number(form.max_members),
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" disabled={finished} variant="secondary">
          <Users className="h-4 w-4" />
          Find teammates for this event
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[88vh] overflow-y-auto">
        <DialogTitle>Find teammates for {event.title}</DialogTitle>
        <DialogDescription>
          Students here also marked this event as interested. Create an event team, then reach out with a focused invite.
        </DialogDescription>
        <div className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <form className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4" onSubmit={submitTeam}>
            <p className="font-bold text-slate-950">Create team for this event</p>
            <div className="mt-4 space-y-3">
              <div className="space-y-2">
                <Label htmlFor={`event-team-name-${event.id}`}>Team name</Label>
                <Input
                  id={`event-team-name-${event.id}`}
                  value={form.name}
                  onChange={(inputEvent) => setForm({ ...form, name: inputEvent.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`event-team-skills-${event.id}`}>Required skills</Label>
                <Input
                  id={`event-team-skills-${event.id}`}
                  placeholder="Frontend, pitch, backend"
                  value={form.required_skills}
                  onChange={(inputEvent) => setForm({ ...form, required_skills: inputEvent.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`event-team-size-${event.id}`}>Max members</Label>
                <Input
                  id={`event-team-size-${event.id}`}
                  type="number"
                  min="2"
                  max="50"
                  value={form.max_members}
                  onChange={(inputEvent) => setForm({ ...form, max_members: inputEvent.target.value })}
                  required
                />
              </div>
              <Button className="auth-primary-cta w-full" disabled={createEventTeam.isPending || finished} variant="default">
                {createEventTeam.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Create event team
              </Button>
            </div>
          </form>
          <div className="space-y-3">
            <p className="font-bold text-slate-950">Interested students</p>
            {isLoading ? (
              <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">Loading event matches...</div>
            ) : teammates.length ? (
              teammates.map((teammate) => <EventTeammateRow key={teammate.id} teammate={teammate} />)
            ) : (
              <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">
                No other interested students yet. Your team can be the first signal.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EventTeammateRow({ teammate }: { teammate: EventTeammateRecommendation }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <Avatar className="h-11 w-11">
          <AvatarImage src={teammate.profile_image_url ?? undefined} />
          <AvatarFallback>{teammate.name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-bold text-slate-950">{teammate.name}</p>
              <p className="text-sm font-semibold text-indigo-700">
                @{teammate.username || `student_${teammate.id}`}
              </p>
            </div>
            <Badge className="shrink-0">{teammate.match_score}%</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {[teammate.branch, teammate.college, teammate.year ? `Year ${teammate.year}` : null]
              .filter(Boolean)
              .join(" / ") || "Student"}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {teammate.skills.slice(0, 5).map((skill) => (
              <Badge key={skill} variant="secondary">{skill}</Badge>
            ))}
            {teammate.reason_tags.slice(0, 3).map((tag) => (
              <Badge className="border-indigo-100 bg-indigo-50 text-indigo-700" key={tag} variant="secondary">{tag}</Badge>
            ))}
          </div>
          <Button className="mt-3 w-full" variant="outline" onClick={() => toast.info(`Reach out to @${teammate.username || teammate.name} after creating your event team.`)}>
            <UserPlus className="h-4 w-4" />
            Invite to event team
          </Button>
        </div>
      </div>
    </div>
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
          ? "auth-primary-cta w-full min-w-[9rem]"
          : "w-full min-w-[9rem] border-slate-200 bg-white text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:text-slate-950"
      }
      disabled={disabled}
      onClick={onClick}
      type="button"
      variant={event.is_interested ? "default" : "outline"}
    >
      <Heart className={event.is_interested ? "h-4 w-4 fill-current" : "h-4 w-4"} />
      {event.is_interested ? "Interested" : "Save event"}
    </Button>
  );
}

function EndedActionLabel() {
  return (
    <div className="flex h-11 w-full min-w-[9rem] items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-500">
      Event ended
    </div>
  );
}

function MetaPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold capitalize text-slate-700 shadow-sm backdrop-blur">
      {children}
    </span>
  );
}

function StatusPill({ status }: { status: ReturnType<typeof getEventStatus> }) {
  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-bold shadow-sm backdrop-blur ${getEventStatusBadgeClass(status)}`}>
      {getEventStatusLabel(status)}
    </span>
  );
}

function MetadataChip({
  icon: Icon,
  text,
}: {
  icon: React.ElementType;
  text: string;
}) {
  return (
    <p className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/90 px-3 py-2">
      <Icon className="h-4 w-4 shrink-0 text-indigo-600" />
      <span className="truncate">{text}</span>
    </p>
  );
}
