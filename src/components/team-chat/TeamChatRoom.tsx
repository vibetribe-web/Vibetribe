"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronDown, Loader2, MessageSquare, Send, Users } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { markTeamChatSeen } from "@/lib/teamChatNotifications";
import { cn } from "@/lib/utils";
import { getTeam, listTeamMessages, sendTeamMessage } from "@/services/teamService";
import type { User } from "@/types/user";
import type { TeamDetail, TeamMember, TeamMessage } from "@/types/team";

type OptimisticTeamMessage = TeamMessage & { pending?: boolean; failed?: boolean };

export function TeamChatRoom({ teamId, currentUser }: { teamId: number; currentUser: User }) {
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [messages, setMessages] = useState<OptimisticTeamMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [newMessages, setNewMessages] = useState(0);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const latestMessageIdRef = useRef(0);
  const nextBeforeIdRef = useRef<number | null>(null);

  const orderedMembers = useMemo(() => orderMembers(members), [members]);
  const sharedEvents = useMemo(
    () => messages.filter((message) => message.message_type === "event_share" && message.event),
    [messages],
  );
  const latestMessageId = messages.reduce((latest, message) => Math.max(latest, message.id), 0);

  useEffect(() => {
    latestMessageIdRef.current = latestMessageId;
  }, [latestMessageId]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior, block: "end" });
  }, []);

  const mergeMessages = useCallback((incoming: TeamMessage[]) => {
    setMessages((current) => {
      const optimistic = current.filter((message) => message.pending);
      const byId = new Map<number, OptimisticTeamMessage>();
      [...current.filter((message) => !message.pending), ...incoming].forEach((message) => {
        byId.set(message.id, message);
      });
      return [...Array.from(byId.values()), ...optimistic].sort((a, b) => a.id - b.id);
    });
  }, []);

  const loadMessages = useCallback(
    async (mode: "initial" | "poll" | "older" = "initial") => {
      if (mode === "older") setLoadingOlder(true);
      try {
        const page = await listTeamMessages(teamId, {
          limit: mode === "poll" ? 30 : 50,
          beforeId: mode === "older" ? nextBeforeIdRef.current ?? undefined : undefined,
          suppressNetworkErrorLog: mode === "poll",
        });
        if (mode === "older") {
          setMessages((current) => [...page.items, ...current].sort((a, b) => a.id - b.id));
        } else {
          const previousLatest = latestMessageIdRef.current;
          mergeMessages(page.items);
          const incomingLatest = page.items.reduce((latest, message) => Math.max(latest, message.id), 0);
          if (mode === "poll" && incomingLatest > previousLatest && !isNearBottom(scrollRef.current)) {
            setNewMessages((count) => count + page.items.filter((message) => message.id > previousLatest).length);
          }
        }
        setHasMore(page.has_more);
        nextBeforeIdRef.current = page.next_before_id ?? null;
        setForbidden(false);
      } catch (error) {
        if (isForbiddenError(error)) setForbidden(true);
        if (mode !== "poll") toast.error(error instanceof Error ? error.message : "Could not load team chat");
      } finally {
        setLoading(false);
        setLoadingOlder(false);
      }
    },
    [mergeMessages, teamId],
  );

  useEffect(() => {
    async function loadShell() {
      setLoading(true);
      try {
        const teamData = await getTeam(teamId);
        setTeam(teamData);
        setMembers(teamData.members);
        await loadMessages("initial");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not load team");
        setLoading(false);
      }
    }

    loadShell();
  }, [loadMessages, teamId]);

  useEffect(() => {
    if (loading || forbidden) return;
    scrollToBottom("auto");
  }, [forbidden, loading, scrollToBottom]);

  useEffect(() => {
    if (!latestMessageId) return;
    markTeamChatSeen(teamId, latestMessageId);
  }, [latestMessageId, teamId]);

  useEffect(() => {
    if (forbidden) return;
    const interval = window.setInterval(() => loadMessages("poll"), 12000);
    return () => window.clearInterval(interval);
  }, [forbidden, loadMessages]);

  async function submitMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = content.trim();
    if (!text) return;

    const optimisticId = Date.now() * -1;
    const optimistic: OptimisticTeamMessage = {
      id: optimisticId,
      team_id: teamId,
      sender: {
        id: currentUser.id,
        name: currentUser.name,
        username: currentUser.username,
        profile_image_url: currentUser.profile_image_url,
      },
      message_type: "text",
      content: text,
      event: null,
      created_at: new Date().toISOString(),
      pending: true,
    };

    setMessages((current) => [...current, optimistic]);
    setContent("");
    setSending(true);
    requestAnimationFrame(() => scrollToBottom());

    try {
      const saved = await sendTeamMessage(teamId, text);
      setMessages((current) => current.map((message) => (message.id === optimisticId ? saved : message)));
    } catch (error) {
      setMessages((current) =>
        current.map((message) => (message.id === optimisticId ? { ...message, failed: true, pending: false } : message)),
      );
      toast.error(error instanceof Error ? error.message : "Could not send message");
    } finally {
      setSending(false);
    }
  }

  if (loading) return <TeamChatSkeleton />;

  if (forbidden) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
        <p className="font-semibold">Forbidden</p>
        <p className="mt-2 text-sm">Only accepted team members can open this team conversation.</p>
      </div>
    );
  }

  if (!team) return <p className="text-slate-600">Team not found.</p>;

  return (
    <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[20rem_minmax(0,1fr)]">
      <aside className="space-y-4">
        <Card className="overflow-hidden border-white/80 bg-white/90 shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
          <div className="bg-gradient-to-br from-violet-600 via-blue-600 to-teal-500 p-5 text-white">
            <Link className="text-sm text-white/80 hover:text-white" href="/teams">
              Back to teams
            </Link>
            <h1 className="mt-3 text-2xl font-bold">{team.name}</h1>
            <p className="mt-2 line-clamp-3 text-sm text-white/80">
              {team.description || "Private team space for hackathon and project collaboration."}
            </p>
          </div>
          <CardContent className="grid grid-cols-2 gap-3 p-4">
            <Metric label="Members" value={`${members.length}/${team.max_members}`} />
            <Metric label="Open slots" value={String(Math.max(team.max_members - members.length, 0))} />
          </CardContent>
        </Card>

        <Card className="border-white/80 bg-white/90 shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
          <CardContent className="p-4">
            <div className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
              <Users className="h-4 w-4" />
              Members
            </div>
            <div className="space-y-2">
              {orderedMembers.map((member) => (
                <div key={member.user_id} className="flex items-center justify-between gap-2 rounded-2xl bg-slate-50 p-2 transition hover:bg-blue-50/70">
                  <div className="flex min-w-0 items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gradient-to-br from-blue-100 to-teal-100 text-xs font-bold text-slate-800">{initials(member.name)}</AvatarFallback>
                    </Avatar>
                    <span className="truncate text-sm font-medium text-slate-800">{member.name}</span>
                  </div>
                  {member.role === "leader" && <Badge>Leader</Badge>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/80 bg-white/90 shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
          <CardContent className="p-4">
            <div className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
              <CalendarDays className="h-4 w-4" />
              Shared events
            </div>
            <div className="space-y-2">
              {sharedEvents.slice(-4).map((message) => (
                <Link
                  key={message.id}
                  href="/events"
                  className="block rounded-xl bg-slate-50 p-3 transition hover:bg-slate-100"
                >
                  <p className="line-clamp-1 text-sm font-semibold text-slate-900">{message.event?.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{message.event?.club_name}</p>
                </Link>
              ))}
              {!sharedEvents.length && <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">No events shared yet.</p>}
            </div>
          </CardContent>
        </Card>
      </aside>

      <section className="flex h-[calc(100vh-7.5rem)] min-h-[34rem] flex-col overflow-hidden rounded-3xl border border-white/80 bg-white/88 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl">
        <div className="border-b border-slate-100 bg-white/80 px-5 py-4 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-slate-950">Team conversation</p>
              <p className="text-sm text-slate-500">Async planning for hackathons, projects, and shared events.</p>
            </div>
            <Badge variant="secondary">{messages.filter((message) => !message.pending).length} messages</Badge>
          </div>
        </div>

        <ScrollArea
          className="relative flex-1 bg-gradient-to-b from-slate-50/70 to-white px-4 py-4"
          onScroll={(event) => {
            if (isNearBottom(event.currentTarget)) {
              setNewMessages(0);
              markTeamChatSeen(teamId, latestMessageId);
            }
          }}
          ref={scrollRef}
        >
          {hasMore && (
            <div className="mb-4 flex justify-center">
              <Button disabled={loadingOlder} onClick={() => loadMessages("older")} size="sm" variant="outline">
                {loadingOlder && <Loader2 className="h-4 w-4 animate-spin" />}
                Load older
              </Button>
            </div>
          )}
          {messages.length ? (
            <div className="space-y-5">
              {messages.map((message) => (
                <MessageBubble currentUserId={currentUser.id} key={message.id} message={message} />
              ))}
            </div>
          ) : (
            <div className="flex h-full min-h-80 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white/70 text-center shadow-sm">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-teal-100 text-teal-700">
                <MessageSquare className="h-7 w-7" />
              </div>
              <p className="mt-4 text-lg font-black text-slate-900">Start the team conversation</p>
              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                Messages, links, and shared event cards will appear here in chronological order.
              </p>
            </div>
          )}
          <div ref={bottomRef} />
        </ScrollArea>

        {newMessages > 0 && (
          <div className="flex justify-center border-t border-slate-100 bg-white px-4 py-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                scrollToBottom();
                setNewMessages(0);
                markTeamChatSeen(teamId, latestMessageId);
              }}
            >
              <ChevronDown className="h-4 w-4" />
              {newMessages} new message{newMessages === 1 ? "" : "s"}
            </Button>
          </div>
        )}

        <form className="sticky bottom-0 flex gap-2 border-t border-slate-100 bg-white/90 p-4 shadow-[0_-16px_40px_rgba(15,23,42,0.06)] backdrop-blur" onSubmit={submitMessage}>
          <Input
            className="h-12 rounded-2xl bg-slate-50/80"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Message your team or paste a link"
          />
          <Button className="auth-primary-cta h-12 px-5" disabled={sending || !content.trim()} type="submit" variant="default">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send
          </Button>
        </form>
      </section>
    </div>
  );
}

function MessageBubble({ currentUserId, message }: { currentUserId: number; message: OptimisticTeamMessage }) {
  const mine = message.sender.id === currentUserId;
  return (
    <motion.div
      className={cn("flex gap-3", mine && "flex-row-reverse", message.failed && "opacity-70")}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
        {message.sender.profile_image_url && <AvatarImage src={message.sender.profile_image_url} alt={message.sender.name} />}
        <AvatarFallback className="bg-gradient-to-br from-blue-100 to-teal-100 font-bold text-slate-800">{initials(message.sender.name)}</AvatarFallback>
      </Avatar>
      <div className={cn("min-w-0 max-w-[min(42rem,85%)]", mine && "text-right")}>
        <div className={cn("flex flex-wrap items-baseline gap-2", mine && "justify-end")}>
          <p className="font-semibold text-slate-950">{message.sender.username || message.sender.name}</p>
          <time className="text-xs text-slate-400">{formatDateTime(message.created_at)}</time>
          {message.pending && <span className="text-xs text-slate-400">Sending...</span>}
          {message.failed && <span className="text-xs text-rose-500">Not sent</span>}
        </div>
        {message.content && (
          <div className={cn(
            "mt-2 rounded-3xl px-4 py-3 text-left text-sm leading-6 shadow-sm",
            mine ? "bg-gradient-to-br from-slate-950 to-blue-900 text-white" : "border border-slate-100 bg-white text-slate-700",
          )}>
            <p className="whitespace-pre-wrap">{renderLinkedText(message.content, mine)}</p>
          </div>
        )}
        {message.event && <SharedEventCard event={message.event} />}
      </div>
    </motion.div>
  );
}

function SharedEventCard({ event }: { event: NonNullable<TeamMessage["event"]> }) {
  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
      {event.image_url ? (
        <div
          aria-label={event.title}
          className="h-40 w-full bg-cover bg-center"
          role="img"
          style={{ backgroundImage: `url(${event.image_url})` }}
        />
      ) : (
        <div className="h-28 bg-gradient-to-br from-violet-600 via-blue-600 to-teal-500" />
      )}
      <div className="space-y-3 p-4">
        <div>
          <p className="font-semibold text-slate-950">{event.title}</p>
          <p className="mt-1 text-sm text-slate-500">
            {event.club_name} • {formatDate(event.start_date)} • {capitalize(event.mode)}
          </p>
          <p className="mt-1 text-sm text-slate-500">{event.venue || "Location to be announced"}</p>
        </div>
        <p className="line-clamp-3 text-sm leading-6 text-slate-600">{event.description}</p>
        <Button asChild size="sm" variant="secondary">
          <Link href="/events">Open Event</Link>
        </Button>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function TeamChatSkeleton() {
  return (
    <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[20rem_minmax(0,1fr)]">
      <div className="space-y-4">
        <Skeleton className="h-56 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
      <Skeleton className="h-[calc(100vh-7.5rem)] min-h-[34rem] rounded-2xl" />
    </div>
  );
}

function orderMembers(members: TeamMember[]) {
  return [...members].sort((a, b) => {
    if (a.role === b.role) return a.name.localeCompare(b.name);
    return a.role === "leader" ? -1 : 1;
  });
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function isNearBottom(element: HTMLElement | null) {
  if (!element) return true;
  return element.scrollHeight - element.scrollTop - element.clientHeight < 120;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function isForbiddenError(error: unknown) {
  return typeof error === "object" && error !== null && "status" in error && error.status === 403;
}

function renderLinkedText(text: string, inverted = false) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return parts.map((part, index) => {
    if (!/^https?:\/\//.test(part)) return part;
    return (
      <a
        className={cn("font-medium underline-offset-2 hover:underline", inverted ? "text-teal-100" : "text-blue-600")}
        href={part}
        key={`${part}-${index}`}
        rel="noreferrer"
        target="_blank"
      >
        {part}
      </a>
    );
  });
}
