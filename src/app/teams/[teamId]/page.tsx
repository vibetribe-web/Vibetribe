"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, Crown, Loader2, MessageSquare, Save, Send, Settings, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useRequireAuth } from "@/hooks/useAuth";
import { useDelayedLoading } from "@/hooks/useDelayedLoading";
import { getEventStatus, getEventStatusBadgeClass, getEventStatusLabel, isFinishedEvent } from "@/lib/eventStatus";
import { listEvents } from "@/services/eventService";
import {
  getTeam,
  listTeamMessages,
  removeTeamMember,
  sendTeamMessage,
  shareEventToTeam,
  updateTeam,
  updateTeamMemberRole,
} from "@/services/teamService";
import type { Event } from "@/types/event";
import type { TeamDetail, TeamMember, TeamMessage } from "@/types/team";

export default function TeamWorkspacePage() {
  const auth = useRequireAuth();
  const params = useParams<{ teamId: string }>();
  const teamId = Number(params.teamId);
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [messages, setMessages] = useState<TeamMessage[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const showWorkspaceSkeleton = useDelayedLoading(loading);
  const [conversationError, setConversationError] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [shareContentByEvent, setShareContentByEvent] = useState<Record<number, string>>({});
  const [sharingEventId, setSharingEventId] = useState<number | null>(null);
  const [savingTeam, setSavingTeam] = useState(false);
  const [busyMemberId, setBusyMemberId] = useState<number | null>(null);
  const [manageForm, setManageForm] = useState({
    name: "",
    description: "",
    max_members: 5,
    required_skills: "",
  });

  const orderedMembers = useMemo(() => orderMembers(members), [members]);
  const leaderCount = useMemo(() => members.filter((member) => member.role === "leader").length, [members]);
  const openSlots = Math.max((team?.max_members ?? 0) - members.length, 0);
  const isLeader = Boolean(team?.is_current_user_leader);
  const isMember = Boolean(team?.is_current_user_member);

  const syncTeam = useCallback((teamData: TeamDetail) => {
    setTeam(teamData);
    setMembers(teamData.members);
    setManageForm({
      name: teamData.name,
      description: teamData.description || "",
      max_members: teamData.max_members,
      required_skills: teamData.required_skills.join(", "),
    });
  }, []);

  const loadMessages = useCallback(
    async (showErrors = false) => {
      if (!teamId || !auth.isAuthenticated) return;
      try {
        const messageData = await listTeamMessages(teamId);
        setMessages(messageData.items);
        setConversationError(null);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not load conversation";
        setConversationError(message);
        if (showErrors) toast.error(message);
      }
    },
    [auth.isAuthenticated, teamId],
  );

  useEffect(() => {
    if (!auth.isAuthenticated || !teamId) return;

    async function loadWorkspace() {
      setLoading(true);
      try {
        const [teamData, eventData] = await Promise.all([
          getTeam(teamId),
          listEvents().catch(() => []),
        ]);
        syncTeam(teamData);
        setEvents(eventData);
        if (teamData.is_current_user_member) {
          await loadMessages(true);
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not load team workspace");
      } finally {
        setLoading(false);
      }
    }

    loadWorkspace();
  }, [auth.isAuthenticated, loadMessages, syncTeam, teamId]);

  useEffect(() => {
    if (!auth.isAuthenticated || !teamId || !isMember) return;
    const intervalId = window.setInterval(() => loadMessages(false), 12000);
    return () => window.clearInterval(intervalId);
  }, [auth.isAuthenticated, isMember, loadMessages, teamId]);

  async function handleSend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = messageText.trim();
    if (!content) return;
    setSending(true);
    try {
      const message = await sendTeamMessage(teamId, content);
      setMessages((current) => [...current, message]);
      setMessageText("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send message");
    } finally {
      setSending(false);
    }
  }

  async function handleShare(eventId: number) {
    const event = events.find((item) => item.id === eventId);
    if (event && isFinishedEvent(event)) return;
    setSharingEventId(eventId);
    try {
      const message = await shareEventToTeam(teamId, eventId, shareContentByEvent[eventId]);
      setMessages((current) => [...current, message]);
      setShareContentByEvent((current) => ({ ...current, [eventId]: "" }));
      toast.success("Event shared");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not share event");
    } finally {
      setSharingEventId(null);
    }
  }

  async function handleSaveTeam(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingTeam(true);
    try {
      const updatedTeam = await updateTeam(teamId, {
        name: manageForm.name,
        description: manageForm.description || null,
        max_members: manageForm.max_members,
        required_skills: splitList(manageForm.required_skills),
      });
      syncTeam(updatedTeam);
      toast.success("Team updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update team");
    } finally {
      setSavingTeam(false);
    }
  }

  async function handleMemberRole(member: TeamMember, role: TeamMember["role"]) {
    setBusyMemberId(member.user_id);
    try {
      const updatedTeam = await updateTeamMemberRole(teamId, member.user_id, role);
      syncTeam(updatedTeam);
      toast.success(role === "leader" ? "Member promoted" : "Member demoted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update member role");
    } finally {
      setBusyMemberId(null);
    }
  }

  async function handleRemoveMember(member: TeamMember) {
    setBusyMemberId(member.user_id);
    try {
      const updatedTeam = await removeTeamMember(teamId, member.user_id);
      syncTeam(updatedTeam);
      toast.success("Member removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remove member");
    } finally {
      setBusyMemberId(null);
    }
  }

  return (
    <main>
      <Navbar />
      <div className="flex min-h-[calc(100vh-4rem)]">
        <Sidebar />
        <section className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {showWorkspaceSkeleton ? (
            <TeamWorkspaceSkeleton />
          ) : team ? (
            <div className="mx-auto max-w-6xl space-y-6">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <Link className="text-sm font-medium text-slate-500 hover:text-slate-900" href="/teams">
                    Back to teams
                  </Link>
                  <h1 className="mt-2 text-3xl font-bold text-slate-950">{team.name}</h1>
                  <p className="mt-2 max-w-2xl text-slate-600">
                    {team.description || "A collaboration space for planning hackathons, projects, and team events."}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <Metric label="Members" value={`${members.length}/${team.max_members}`} />
                  <Metric label="Open slots" value={String(openSlots)} />
                  <Metric label="Messages" value={String(messages.length)} />
                </div>
              </div>

              {!isMember ? (
                <Card className="bg-white/90">
                  <CardHeader>
                    <CardTitle>Private team workspace</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm leading-6 text-slate-600">
                      Join this team to access its conversation, member workspace, and private collaboration tools.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {team.required_skills.length ? (
                        team.required_skills.map((skill) => (
                          <Badge key={skill} variant="secondary">{skill}</Badge>
                        ))
                      ) : (
                        <Badge variant="secondary">No required skills listed</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
              <Tabs defaultValue="conversation" className="space-y-5">
                <TabsList>
                  <TabsTrigger className="gap-2" value="conversation">
                    <MessageSquare className="h-4 w-4" />
                    Conversation
                  </TabsTrigger>
                  <TabsTrigger className="gap-2" value="members">
                    <Users className="h-4 w-4" />
                    Members
                  </TabsTrigger>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  {isLeader && (
                    <TabsTrigger className="gap-2" value="manage">
                      <Settings className="h-4 w-4" />
                      Manage
                    </TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="conversation">
                  <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
                    <Card className="bg-white/90">
                      <CardHeader>
                        <CardTitle>Team conversation</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {conversationError ? (
                          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                            {conversationError}
                          </div>
                        ) : (
                          <ScrollArea className="h-[28rem] pr-2">
                            <div className="space-y-4">
                              {messages.length ? (
                                messages.map((message) => <MessageRow key={message.id} message={message} />)
                              ) : (
                                <div className="flex h-72 flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 text-center">
                                  <MessageSquare className="h-8 w-8 text-slate-300" />
                                  <p className="mt-3 font-semibold text-slate-800">No messages yet</p>
                                  <p className="mt-1 text-sm text-slate-500">Start the team discussion here.</p>
                                </div>
                              )}
                            </div>
                          </ScrollArea>
                        )}

                        <form className="flex gap-2" onSubmit={handleSend}>
                          <Input
                            value={messageText}
                            onChange={(event) => setMessageText(event.target.value)}
                            placeholder="Message your team"
                            disabled={Boolean(conversationError)}
                          />
                          <Button type="submit" disabled={sending || Boolean(conversationError) || !messageText.trim()}>
                            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            Send
                          </Button>
                        </form>
                      </CardContent>
                    </Card>

                    <Card className="bg-white/90">
                      <CardHeader>
                        <CardTitle>Share events</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[32rem] pr-2">
                          <div className="space-y-4">
                            {events.slice(0, 8).map((event) => (
                              <div key={event.id} className={`rounded-lg border p-3 ${isFinishedEvent(event) ? "border-slate-200 bg-slate-100/80 grayscale-[0.2]" : "border-slate-200 bg-white"}`}>
                                <EventPreview event={event} />
                                {isFinishedEvent(event) && (
                                  <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600">
                                    This event has ended
                                  </p>
                                )}
                                <Textarea
                                  className="mt-3 min-h-16"
                                  disabled={isFinishedEvent(event)}
                                  placeholder="Add a note"
                                  value={shareContentByEvent[event.id] ?? ""}
                                  onChange={(inputEvent) =>
                                    setShareContentByEvent((current) => ({
                                      ...current,
                                      [event.id]: inputEvent.target.value,
                                    }))
                                  }
                                />
                                <Button
                                  className="mt-3 w-full"
                                  variant="outline"
                                  disabled={sharingEventId === event.id || Boolean(conversationError) || isFinishedEvent(event)}
                                  onClick={() => handleShare(event.id)}
                                >
                                  {sharingEventId === event.id && <Loader2 className="h-4 w-4 animate-spin" />}
                                  Share to chat
                                </Button>
                              </div>
                            ))}
                            {!events.length && <p className="text-sm text-slate-500">No events are available to share yet.</p>}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="members">
                  <Card className="bg-white/90">
                    <CardHeader>
                      <CardTitle>Members</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 md:grid-cols-2">
                      {orderedMembers.map((member) => (
                        <MemberRow
                          key={member.user_id}
                          busy={busyMemberId === member.user_id}
                          canDemote={isLeader && member.role === "leader" && leaderCount > 1}
                          canManage={isLeader}
                          canPromote={isLeader && member.role === "member"}
                          canRemove={isLeader && (member.role !== "leader" || leaderCount > 1)}
                          currentUserId={auth.user?.id ?? null}
                          member={member}
                          onDemote={() => handleMemberRole(member, "member")}
                          onPromote={() => handleMemberRole(member, "leader")}
                          onRemove={() => handleRemoveMember(member)}
                        />
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="overview">
                  <Card className="bg-white/90">
                    <CardHeader>
                      <CardTitle>Team overview</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div className="flex flex-wrap gap-2">
                        {team.required_skills.length ? (
                          team.required_skills.map((skill) => (
                            <Badge key={skill} variant="secondary">{skill}</Badge>
                          ))
                        ) : (
                          <Badge variant="secondary">No required skills listed</Badge>
                        )}
                      </div>
                      <div className="grid gap-3 md:grid-cols-3">
                        <Metric label="Leader" value={orderedMembers.find((member) => member.role === "leader")?.name ?? team.leader?.name ?? "Team leader"} />
                        <Metric label="Open slots" value={String(openSlots)} />
                        <Metric label="Team size" value={`${members.length}/${team.max_members}`} />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {isLeader && (
                  <TabsContent value="manage">
                    <Card className="bg-white/90">
                      <CardHeader>
                        <CardTitle>Manage team</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSaveTeam}>
                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700" htmlFor="manage-team-name">Team name</label>
                            <Input
                              id="manage-team-name"
                              required
                              value={manageForm.name}
                              onChange={(event) => setManageForm((current) => ({ ...current, name: event.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700" htmlFor="manage-team-size">Max members</label>
                            <Input
                              id="manage-team-size"
                              min={Math.max(2, members.length)}
                              max={50}
                              type="number"
                              value={manageForm.max_members}
                              onChange={(event) => setManageForm((current) => ({ ...current, max_members: Number(event.target.value) }))}
                            />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-semibold text-slate-700" htmlFor="manage-team-description">Description</label>
                            <Textarea
                              id="manage-team-description"
                              value={manageForm.description}
                              onChange={(event) => setManageForm((current) => ({ ...current, description: event.target.value }))}
                            />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-semibold text-slate-700" htmlFor="manage-team-skills">Required skills</label>
                            <Input
                              id="manage-team-skills"
                              placeholder="React, FastAPI, UI/UX"
                              value={manageForm.required_skills}
                              onChange={(event) => setManageForm((current) => ({ ...current, required_skills: event.target.value }))}
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Button className="auth-primary-cta w-full sm:w-auto" disabled={savingTeam} type="submit" variant="default">
                              {savingTeam ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                              Save changes
                            </Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}
              </Tabs>
              )}
            </div>
          ) : (
            <p className="text-slate-600">Team not found.</p>
          )}
        </section>
      </div>
    </main>
  );
}

function MessageRow({ message }: { message: TeamMessage }) {
  return (
    <div className="flex gap-3">
      <Avatar className="h-10 w-10">
        {message.sender.profile_image_url && <AvatarImage src={message.sender.profile_image_url} alt={message.sender.name} />}
        <AvatarFallback>{initials(message.sender.name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-2">
          <p className="font-semibold text-slate-900">{message.sender.name}</p>
          {message.message_type === "event_share" && (
            <span className="text-sm text-slate-500">shared an event</span>
          )}
          <time className="text-xs text-slate-400">{formatDateTime(message.created_at)}</time>
        </div>
        {message.content && <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">{message.content}</p>}
        {message.event && <SharedEventCard event={message.event} />}
      </div>
    </div>
  );
}

function SharedEventCard({ event }: { event: NonNullable<TeamMessage["event"]> }) {
  const status = getEventStatus(event);
  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
      {event.image_url && (
        <div
          aria-label={event.title}
          className="h-32 w-full bg-cover bg-center"
          role="img"
          style={{ backgroundImage: `url(${event.image_url})` }}
        />
      )}
      <div className="space-y-3 p-4">
        <div>
          <StatusBadge status={status} />
          <p className="font-semibold text-slate-950">{event.title}</p>
          <p className="mt-1 text-sm text-slate-500">
            {capitalize(event.mode)} • {formatDate(event.start_date)} • {event.club_name}
          </p>
        </div>
        <Button asChild size="sm" variant="secondary">
          <Link href="/events">View Event</Link>
        </Button>
      </div>
    </div>
  );
}

function EventPreview({ event }: { event: Event }) {
  const status = getEventStatus(event);
  return (
    <div className="flex gap-3">
      <div className="h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
        {event.image_url ? (
          <div
            aria-label={event.title}
            className="h-full w-full bg-cover bg-center"
            role="img"
            style={{ backgroundImage: `url(${event.image_url})` }}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <CalendarDays className="h-5 w-5 text-slate-400" />
          </div>
        )}
      </div>
      <div className="min-w-0">
        <StatusBadge status={status} />
        <p className="line-clamp-2 font-semibold text-slate-900">{event.title}</p>
        <p className="mt-1 text-sm text-slate-500">
          {capitalize(event.mode)} • {formatDate(event.start_date)}
        </p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: ReturnType<typeof getEventStatus> }) {
  return (
    <span className={`mb-1 inline-flex rounded-full border px-2 py-0.5 text-xs font-bold ${getEventStatusBadgeClass(status)}`}>
      {getEventStatusLabel(status)}
    </span>
  );
}

function MemberRow({
  busy,
  canDemote,
  canManage,
  canPromote,
  canRemove,
  currentUserId,
  member,
  onDemote,
  onPromote,
  onRemove,
}: {
  busy: boolean;
  canDemote: boolean;
  canManage: boolean;
  canPromote: boolean;
  canRemove: boolean;
  currentUserId: number | null;
  member: TeamMember;
  onDemote: () => void;
  onPromote: () => void;
  onRemove: () => void;
}) {
  const isCurrentUser = currentUserId === member.user_id;
  return (
    <div className="flex flex-col gap-3 rounded-lg bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback>{initials(member.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-900">{member.name}</p>
          <p className="truncate text-sm text-slate-500">{member.email}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={member.role === "leader" ? "default" : "secondary"}>
          {member.role === "leader" ? "Leader" : "Member"}
        </Badge>
        {canManage && (
          <>
            {canPromote && (
              <Button disabled={busy} size="sm" variant="outline" onClick={onPromote}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />}
                Promote
              </Button>
            )}
            {canDemote && (
              <Button disabled={busy} size="sm" variant="outline" onClick={onDemote}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
                Demote
              </Button>
            )}
            {canRemove && (
              <Button disabled={busy || isCurrentUser} size="sm" variant="outline" onClick={onRemove}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Remove
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/80 p-3 ring-1 ring-slate-200">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function TeamWorkspaceSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Skeleton className="h-28" />
      <Skeleton className="h-[36rem]" />
    </div>
  );
}

function orderMembers(members: TeamMember[]) {
  return [...members].sort((a, b) => {
    if (a.role === b.role) return a.name.localeCompare(b.name);
    return a.role === "leader" ? -1 : 1;
  });
}

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
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
