"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Filter as FilterIcon, Search, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { EventCard } from "@/components/cards/EventCard";
import { Navbar } from "@/components/layout/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useRequireAuth } from "@/hooks/useAuth";
import { EVENT_STATUS_OPTIONS, type EventStatusFilter, getEventStatus } from "@/lib/eventStatus";
import { queryKeys, staleTimes } from "@/lib/queryKeys";
import { listEvents } from "@/services/eventService";
import type { Event, EventMode, EventType } from "@/types/event";

export default function EventsPage() {
  const auth = useRequireAuth();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [type, setType] = useState<EventType | "all">("all");
  const [mode, setMode] = useState<EventMode | "all">("all");
  const [status, setStatus] = useState<EventStatusFilter>("all");

  const { data: events = [], isLoading: loading } = useQuery({
    queryKey: queryKeys.events,
    queryFn: listEvents,
    enabled: auth.isAuthenticated,
    staleTime: staleTimes.events,
  });

  const filtered = useMemo(
    () =>
      events.filter((event) => {
        const matchesQuery =
          event.title.toLowerCase().includes(query.toLowerCase()) ||
          event.description.toLowerCase().includes(query.toLowerCase());
        return (
          matchesQuery &&
          (type === "all" || event.event_type === type) &&
          (mode === "all" || event.mode === mode) &&
          (status === "all" || getEventStatus(event) === status)
        );
      }),
    [events, mode, query, status, type],
  );

  return (
    <ProtectedRoute>
      <main>
        <Navbar />
        <section className="relative overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
          <div className="relative mx-auto max-w-7xl">
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 overflow-hidden rounded-[1.75rem] border border-white/75 bg-white/76 p-6 shadow-[0_18px_56px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-8"
              initial={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.4 }}
            >
              <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
                <div>
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-indigo-50/80 px-3 py-1 text-sm font-bold text-indigo-700">
                    <Sparkles className="h-4 w-4" />
                    Campus opportunities
                  </div>
                  <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                    Events and hackathons
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                    Discover competitions, workshops, and club-led moments built for students who want to make something real.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:min-w-72">
                  <Signal label="Total events" value={events.length} />
                  <Signal label="Showing" value={filtered.length} />
                </div>
              </div>
            </motion.div>

            <div className="mb-6 rounded-2xl border border-white/75 bg-white/74 p-3 shadow-[0_12px_38px_rgba(15,23,42,0.06)] backdrop-blur-xl">
              <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto]">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <Input
                    className="h-12 rounded-xl border-white/80 bg-white pl-12 text-base shadow-sm focus:ring-blue-100"
                    placeholder="Search hackathons, workshops, clubs..."
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </div>
                <Filter label="Status" value={status} values={[...EVENT_STATUS_OPTIONS]} onChange={(value) => setStatus(value as EventStatusFilter)} />
                <Filter label="Type" value={type} values={["all", "hackathon", "event"]} onChange={(value) => setType(value as EventType | "all")} />
                <Filter label="Mode" value={mode} values={["all", "online", "offline", "hybrid"]} onChange={(value) => setMode(value as EventMode | "all")} />
              </div>
            </div>

            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <Badge className="rounded-full px-3 py-1.5 text-sm" variant="secondary">
                {filtered.length} result{filtered.length === 1 ? "" : "s"}
              </Badge>
              {(query || type !== "all" || mode !== "all" || status !== "all") && (
                <Button
                  onClick={() => {
                    setQuery("");
                    setType("all");
                    setMode("all");
                    setStatus("all");
                  }}
                  size="sm"
                  variant="ghost"
                >
                  Clear filters
                </Button>
              )}
            </div>

            <motion.div
              animate="show"
              className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
              initial="hidden"
              transition={{ staggerChildren: 0.06 }}
            >
              {loading
                ? Array.from({ length: 6 }).map((_, index) => <EventSkeleton key={index} />)
                : filtered.map((event) => (
                    <motion.div
                      key={event.id}
                      variants={{
                        hidden: { opacity: 0, y: 18 },
                        show: { opacity: 1, y: 0 },
                      }}
                    >
                      <EventCard
                        event={event}
                        onInterestChange={(updatedEvent) =>
                          queryClient.setQueryData<Event[]>(queryKeys.events, (current = []) =>
                            current.map((item) => (item.id === updatedEvent.id ? updatedEvent : item)),
                          )
                        }
                      />
                    </motion.div>
                  ))}
            </motion.div>

            {!loading && !filtered.length && (
                <div className="mt-8 rounded-2xl border border-dashed border-slate-300/80 bg-white/72 p-10 text-center shadow-sm backdrop-blur-xl">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
                  <CalendarDays className="h-7 w-7" />
                </div>
                <h2 className="mt-5 text-2xl font-black text-slate-950">No events match that search</h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
                  Try a broader keyword or reset the filters to see every opportunity available right now.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    </ProtectedRoute>
  );
}

function Filter({
  label,
  value,
  values,
  onChange,
}: {
  label: string;
  value: string;
  values: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex h-12 items-center gap-2 rounded-xl border border-white/80 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:shadow-md">
      <FilterIcon className="h-4 w-4 text-indigo-600" />
      <span className="text-slate-500">{label}</span>
      <select className="min-w-28 bg-transparent font-bold capitalize text-slate-950 outline-none" value={value} onChange={(event) => onChange(event.target.value)}>
        {values.map((item) => (
          <option key={item} value={item}>{item}</option>
        ))}
      </select>
    </label>
  );
}

function Signal({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/80 bg-white/75 p-4 shadow-sm backdrop-blur">
      <p className="text-3xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">{label}</p>
    </div>
  );
}

function EventSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/75 bg-white/70 p-4 shadow-sm backdrop-blur">
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
  );
}
