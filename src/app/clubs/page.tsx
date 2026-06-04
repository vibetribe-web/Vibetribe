"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Edit, ImagePlus, Loader2, Plus, Sparkles, Trash2, UploadCloud, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { EventCard } from "@/components/cards/EventCard";
import { ClubCard } from "@/components/cards/ClubCard";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Navbar } from "@/components/layout/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { UserSelector } from "@/components/users/UserSelector";
import { useAuth } from "@/hooks/useAuth";
import { useDelayedLoading } from "@/hooks/useDelayedLoading";
import { queryKeys, staleTimes } from "@/lib/queryKeys";
import {
  addClubMember,
  createClubEvent,
  deleteClubEvent,
  demoteClubLeader,
  getClubEvents,
  listClubMembers,
  listClubs,
  promoteClubMember,
  removeClubMember,
  updateClubEvent,
} from "@/services/clubService";
import { uploadEventPoster, validatePosterFile } from "@/services/posterUploadService";
import { listUsers } from "@/services/userService";
import type { Event, EventPayload } from "@/types/event";
import type { User } from "@/types/user";

export default function ClubsPage() {
  const [selectedClubId, setSelectedClubId] = useState<number | null>(null);
  const [memberUser, setMemberUser] = useState<User | null>(null);
  const [eventOpen, setEventOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const auth = useAuth();
  const queryClient = useQueryClient();

  const { data: clubs = [], isLoading: loading } = useQuery({
    queryKey: queryKeys.clubs,
    queryFn: listClubs,
    enabled: auth.isAuthenticated,
    staleTime: staleTimes.clubs,
  });
  const showClubsSkeleton = useDelayedLoading(loading);

  const selectedClub = clubs.find((club) => club.id === selectedClubId) ?? null;
  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: selectedClubId ? queryKeys.clubEvents(selectedClubId) : ["clubs", "none", "events"],
    queryFn: () => getClubEvents(selectedClubId as number),
    enabled: Boolean(selectedClubId),
    staleTime: staleTimes.events,
  });
  const showClubEventsSkeleton = useDelayedLoading(eventsLoading);
  const { data: members = [], isSuccess: canAccessMembers } = useQuery({
    queryKey: selectedClubId ? queryKeys.clubMembers(selectedClubId) : ["clubs", "members", "none"],
    queryFn: () => listClubMembers(selectedClubId as number),
    enabled: Boolean(selectedClubId) && auth.isAuthenticated,
    retry: false,
    staleTime: staleTimes.clubs,
  });
  const { data: users = [] } = useQuery({
    queryKey: queryKeys.users,
    queryFn: () => listUsers(),
    enabled: Boolean(selectedClubId) && (auth.user?.is_admin || canAccessMembers),
    staleTime: staleTimes.users,
  });

  const currentMembership = members.find((member) => member.user_id === auth.user?.id);
  const canAccessClubTools = Boolean(auth.user?.is_admin || canAccessMembers);
  const canEditClubEvents = canAccessClubTools;
  const canManageClub = Boolean(auth.user?.is_admin || currentMembership?.role === "leader");

  async function refreshClubWorkspace() {
    if (!selectedClub) return;
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.clubEvents(selectedClub.id) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.clubs }),
      queryClient.invalidateQueries({ queryKey: queryKeys.clubMembers(selectedClub.id) }),
    ]);
  }

  async function handleMemberAction(action: "add" | "remove" | "promote" | "demote", userId: number) {
    if (!selectedClub) return;
    try {
      if (action === "add") await addClubMember(selectedClub.id, userId);
      if (action === "remove") await removeClubMember(selectedClub.id, userId);
      if (action === "promote") await promoteClubMember(selectedClub.id, userId);
      if (action === "demote") await demoteClubLeader(selectedClub.id, userId);
      toast.success("Club membership updated");
      setMemberUser(null);
      await refreshClubWorkspace();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update member");
    }
  }

  async function handleDeleteEvent(event: Event) {
    try {
      await deleteClubEvent(event.club_id, event.id);
      toast.success("Event deleted");
      await refreshClubWorkspace();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete event");
    }
  }

  return (
    <ProtectedRoute>
      <main>
      <Navbar />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-sm font-semibold text-indigo-700">Campus communities</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950">Clubs</h1>
          <p className="mt-3 max-w-2xl text-slate-600">Browse student communities, then choose one to explore its focus and upcoming opportunities.</p>
        </div>
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(20rem,0.82fr)_minmax(0,1.18fr)]">
          <div className="grid content-start gap-5 sm:grid-cols-2 lg:grid-cols-1">
            {showClubsSkeleton
              ? Array.from({ length: 4 }).map((_, index) => <ClubCardSkeleton key={index} />)
              : clubs.map((club) => (
                  <ClubCard
                    key={club.id}
                    club={club}
                    selected={selectedClubId === club.id}
                    onSelect={(nextClub) => setSelectedClubId(nextClub.id)}
                  />
                ))}
          </div>
          <div className="space-y-5">
            {!selectedClub ? (
              <EmptyClubSelection />
            ) : (
              <>
                <Card className="overflow-hidden border-white/75 bg-white/82 shadow-[0_18px_56px_rgba(15,23,42,0.08)] backdrop-blur">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
                      <div className="max-w-2xl">
                        <p className="text-sm font-bold text-indigo-700">Club spotlight</p>
                        <CardTitle className="mt-2 text-3xl leading-tight">{selectedClub.name}</CardTitle>
                        <p className="mt-4 text-sm leading-6 text-slate-600">
                          {selectedClub.description || "A student club building moments, projects, and teams."}
                        </p>
                      </div>
                      {canEditClubEvents && (
                        <Dialog open={eventOpen} onOpenChange={setEventOpen}>
                          <DialogTrigger asChild>
                            <Button className="auth-primary-cta shrink-0" variant="default" onClick={() => setEditingEvent(null)}>
                              <Plus className="h-4 w-4" />
                              Create event
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-h-[88vh] overflow-y-auto pb-0">
                            <DialogTitle>{editingEvent ? "Edit event" : "Create club event"}</DialogTitle>
                            <DialogDescription>Club members can post and update opportunities for this community.</DialogDescription>
                            <ClubEventForm
                              event={editingEvent}
                              clubId={selectedClub.id}
                              onSaved={async () => {
                                setEventOpen(false);
                                setEditingEvent(null);
                                await refreshClubWorkspace();
                              }}
                            />
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
                          <CalendarDays className="h-6 w-6" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-slate-500">Activities</p>
                          <p className="text-xl font-bold text-slate-950">
                            {selectedClub.event_count ?? events.length} event{(selectedClub.event_count ?? events.length) === 1 ? "" : "s"}
                          </p>
                        </div>
                      </div>
                      <Button
                        className="w-full sm:w-auto"
                        variant="secondary"
                        onClick={() => document.getElementById("club-events")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                      >
                        View Events
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {canAccessClubTools && (
                  <Card className="border-dashed bg-white/72">
                    <CardHeader>
                      <CardTitle>Club management</CardTitle>
                      <p className="text-sm text-slate-500">
                        Club members can add students. Leaders and admins can manage roles.
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <UserSelector
                          users={users}
                          value={memberUser?.id ?? null}
                          onChange={setMemberUser}
                          placeholder="Search students..."
                        />
                        <Button disabled={!memberUser} onClick={() => memberUser && handleMemberAction("add", memberUser.id)}>
                          <UserPlus className="h-4 w-4" />
                          Add member
                        </Button>
                      </div>
                      <div className="grid gap-3">
                        {members.map((member) => (
                          <div key={member.user_id} className="flex flex-col justify-between gap-3 rounded-xl bg-slate-50 p-3 sm:flex-row sm:items-center">
                            <div>
                              <p className="font-semibold">{member.name}</p>
                              <p className="text-sm text-slate-500">{member.role}</p>
                            </div>
                            {canManageClub && member.user_id !== auth.user?.id && (
                              <div className="flex flex-wrap gap-2">
                                <Button size="sm" variant="ghost" onClick={() => handleMemberAction(member.role === "leader" ? "demote" : "promote", member.user_id)}>
                                  {member.role === "leader" ? "Demote" : "Promote"}
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleMemberAction("remove", member.user_id)}>
                                  Remove
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <section id="club-events" className="rounded-2xl border border-white/75 bg-white/70 p-4 shadow-[0_14px_44px_rgba(15,23,42,0.06)] backdrop-blur">
                  <div className="mb-4 flex items-end justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-bold tracking-tight text-slate-950">Club Events</h2>
                      <p className="mt-1 text-sm text-slate-600">Public opportunities from {selectedClub.name}.</p>
                    </div>
                    <Badge variant="secondary">{events.length} event{events.length === 1 ? "" : "s"}</Badge>
                  </div>
                  <div className="grid gap-5 md:grid-cols-2">
                    {showClubEventsSkeleton
                      ? Array.from({ length: 2 }).map((_, index) => <ClubEventSkeleton key={index} />)
                      : events.map((event) => (
                          <div
                            key={event.id}
                            className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_14px_42px_rgba(15,23,42,0.07)]"
                          >
                            <div className="[&_article]:rounded-none [&_article]:border-0 [&_article]:shadow-none">
                              <EventCard
                                event={event}
                                onInterestChange={(updatedEvent) => {
                                  queryClient.setQueryData<Event[]>(queryKeys.clubEvents(selectedClub.id), (current = []) =>
                                    current.map((item) => (item.id === updatedEvent.id ? updatedEvent : item)),
                                  );
                                }}
                              />
                            </div>
                            {(canEditClubEvents || canManageClub) && (
                              <div className={`grid gap-2 border-t border-slate-100 bg-slate-50/70 p-3 ${canManageClub ? "grid-cols-2" : "grid-cols-1"}`}>
                                {canEditClubEvents && (
                                <Button variant="outline" onClick={() => { setEditingEvent(event); setEventOpen(true); }}>
                                  <Edit className="h-4 w-4" />
                                  Edit
                                </Button>
                                )}
                                {canManageClub && (
                                <Button variant="outline" onClick={() => handleDeleteEvent(event)}>
                                  <Trash2 className="h-4 w-4" />
                                  Delete
                                </Button>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                  </div>
                  {!eventsLoading && !events.length && (
                    <div className="rounded-2xl border border-dashed border-slate-300/80 bg-white/70 p-8 text-center text-sm text-slate-500">
                      No events posted for this club yet.
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        </div>
      </section>
      </main>
    </ProtectedRoute>
  );
}

function ClubEventForm({
  clubId,
  event,
  onSaved,
}: {
  clubId: number;
  event: Event | null;
  onSaved: () => Promise<void>;
}) {
  const [form, setForm] = useState<EventPayload>({
    title: event?.title ?? "",
    description: event?.description ?? "",
    event_type: event?.event_type ?? "event",
    mode: event?.mode ?? "offline",
    venue: event?.venue ?? "",
    start_date: event?.start_date ? event.start_date.slice(0, 16) : "",
    end_date: event?.end_date ? event.end_date.slice(0, 16) : "",
    registration_link: event?.registration_link ?? "",
    image_url: event?.image_url ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState(event?.image_url ?? "");
  const [posterRemoved, setPosterRemoved] = useState(false);
  const [posterError, setPosterError] = useState("");

  async function save(eventSubmit: React.FormEvent<HTMLFormElement>) {
    eventSubmit.preventDefault();
    setSaving(true);
    try {
      let posterUrl = posterRemoved ? null : form.image_url || null;
      if (posterFile) {
        posterUrl = await uploadEventPoster(posterFile, clubId);
      }

      const payload = {
        ...form,
        start_date: new Date(form.start_date).toISOString(),
        end_date: new Date(form.end_date).toISOString(),
        venue: form.venue || null,
        registration_link: form.registration_link || null,
        image_url: posterUrl,
      };

      if (event) await updateClubEvent(clubId, event.id, payload);
      else await createClubEvent(clubId, payload);
      toast.success(event ? "Event updated" : "Event created");
      await onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save event");
    } finally {
      setSaving(false);
    }
  }

  function handlePosterChange(file: File | null) {
    setPosterError("");
    if (!file) {
      setPosterFile(null);
      setPosterPreview("");
      setPosterRemoved(true);
      setForm((current) => ({ ...current, image_url: null }));
      return;
    }

    const validationMessage = validatePosterFile(file);
    if (validationMessage) {
      setPosterError(validationMessage);
      return;
    }

    setPosterFile(file);
    setPosterRemoved(false);
    setForm((current) => ({ ...current, image_url: current.image_url || "" }));
    setPosterPreview(URL.createObjectURL(file));
  }

  useEffect(() => {
    return () => {
      if (posterPreview.startsWith("blob:")) URL.revokeObjectURL(posterPreview);
    };
  }, [posterPreview]);

  return (
    <form className="mt-5 space-y-4 pb-24" onSubmit={save}>
      <div className="space-y-2">
        <Label htmlFor="event-title">Title</Label>
        <Input id="event-title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="event-description">Description</Label>
        <Textarea id="event-description" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <select className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm" value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value as EventPayload["event_type"] })}>
          <option value="event">Event</option>
          <option value="hackathon">Hackathon</option>
        </select>
        <select className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm" value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value as EventPayload["mode"] })}>
          <option value="offline">Offline</option>
          <option value="online">Online</option>
          <option value="hybrid">Hybrid</option>
        </select>
        <Input type="datetime-local" required value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
        <Input type="datetime-local" required value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
      </div>
      <Input placeholder="Venue" value={form.venue ?? ""} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
      <Input placeholder="Registration link" value={form.registration_link ?? ""} onChange={(e) => setForm({ ...form, registration_link: e.target.value })} />
      <PosterUploadField
        error={posterError}
        previewUrl={posterPreview}
        onChange={handlePosterChange}
      />
      <div className="sticky bottom-0 z-20 -mx-6 border-t border-slate-200 bg-white/95 px-6 py-4 shadow-[0_-14px_34px_rgba(15,23,42,0.08)] backdrop-blur">
        <Button className="auth-primary-cta h-12 w-full text-base font-bold" variant="default" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {saving ? "Saving..." : event ? "Save changes" : "Create event"}
        </Button>
      </div>
    </form>
  );
}

function EmptyClubSelection() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300/80 bg-white/72 p-10 text-center shadow-sm backdrop-blur">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
        <Sparkles className="h-7 w-7" />
      </div>
      <h2 className="mt-5 text-2xl font-black text-slate-950">Select a Club</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
        Choose a club from the list to view its details, activities, and upcoming events.
      </p>
    </div>
  );
}

function ClubCardSkeleton() {
  return (
    <div className="min-h-44 rounded-2xl border border-white/80 bg-white/82 p-6 shadow-sm backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-11 w-11 rounded-xl" />
        <Skeleton className="h-7 w-16 rounded-full" />
      </div>
      <div className="mt-6 space-y-3">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  );
}

function ClubEventSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_14px_42px_rgba(15,23,42,0.07)]">
      <div className="p-4">
        <Skeleton className="aspect-[16/9] rounded-xl" />
        <div className="mt-5 space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-7 w-4/5" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="grid gap-2 pt-2 sm:grid-cols-2">
            <Skeleton className="h-10 rounded-2xl" />
            <Skeleton className="h-10 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

function PosterUploadField({
  previewUrl,
  error,
  onChange,
}: {
  previewUrl: string;
  error: string;
  onChange: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);

  function selectFiles(fileList: FileList | null) {
    const file = fileList?.[0];
    if (file) onChange(file);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor="event-poster">Upload Poster</Label>
        <p className="text-xs font-medium text-slate-500">JPG, PNG, WEBP &bull; Max 2 MB</p>
      </div>
      <input
        ref={inputRef}
        id="event-poster"
        className="sr-only"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(inputEvent) => selectFiles(inputEvent.target.files)}
      />
      <div
        className={[
          "relative overflow-hidden rounded-2xl border border-dashed bg-white shadow-[0_14px_40px_rgba(15,23,42,0.08)] transition",
          dragging ? "border-indigo-400 ring-4 ring-indigo-100" : "border-slate-200 hover:border-indigo-300",
        ].join(" ")}
        onDragOver={(dragEvent) => {
          dragEvent.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(dropEvent) => {
          dropEvent.preventDefault();
          setDragging(false);
          selectFiles(dropEvent.dataTransfer.files);
        }}
      >
        {previewUrl ? (
          <div className="space-y-3 bg-slate-50/80 p-3">
            <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 px-1">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <ImagePlus className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-950">Poster selected</p>
                  <p className="text-xs text-slate-500">Ready to upload when you save</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
                <Button
                  className="border-indigo-200 bg-indigo-50 text-indigo-700 shadow-sm hover:bg-indigo-100 hover:text-indigo-800"
                  type="button"
                  variant="outline"
                  onClick={() => inputRef.current?.click()}
                >
                  <ImagePlus className="h-4 w-4" />
                  Change
                </Button>
                <Button
                  className="border-red-200 bg-red-50 text-red-700 shadow-sm hover:bg-red-100 hover:text-red-800"
                  type="button"
                  variant="outline"
                  onClick={() => onChange(null)}
                >
                  <X className="h-4 w-4" />
                  Remove
                </Button>
              </div>
            </div>
            <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-slate-100 shadow-inner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="Selected event poster preview" className="h-full w-full object-cover" src={previewUrl} />
            </div>
          </div>
        ) : (
          <button
            className="flex min-h-48 w-full flex-col items-center justify-center gap-3 px-4 py-8 text-center"
            type="button"
            onClick={() => inputRef.current?.click()}
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-inner">
              <UploadCloud className="h-6 w-6" />
            </span>
            <span className="text-sm font-bold text-slate-950">Drag & drop your poster here</span>
            <span className="text-sm text-slate-500">or click to upload</span>
          </button>
        )}
      </div>
      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
    </div>
  );
}
