"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Sparkles, UserRoundSearch, Users } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { UserCard } from "@/components/cards/UserCard";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useRequireAuth } from "@/hooks/useAuth";
import { useDelayedLoading } from "@/hooks/useDelayedLoading";
import { queryKeys, staleTimes } from "@/lib/queryKeys";
import { usernameLabel } from "@/lib/userDisplay";
import { getFriendlyErrorMessage } from "@/services/api";
import { createJoinRequest } from "@/services/requestService";
import { listTeams } from "@/services/teamService";
import { listUsers } from "@/services/userService";
import type { Team } from "@/types/team";
import type { User } from "@/types/user";

export default function DiscoverPage() {
  const auth = useRequireAuth();
  const viewerId = auth.user?.id ?? null;
  const [skill, setSkill] = useState("");
  const [college, setCollege] = useState("");
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const [selected, setSelected] = useState<{ user: User; team?: Team } | null>(null);
  const [requestTarget, setRequestTarget] = useState<{ user: User; team?: Team } | null>(null);
  const [message, setMessage] = useState("");

  const { data: allUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: queryKeys.users,
    queryFn: () => listUsers(),
    enabled: auth.isAuthenticated,
    staleTime: staleTimes.users,
  });
  const { data: teams = [], isLoading: teamsLoading } = useQuery({
    queryKey: queryKeys.teamsForUser(viewerId),
    queryFn: listTeams,
    enabled: auth.isAuthenticated && Boolean(viewerId),
    staleTime: staleTimes.teams,
  });
  const users = useMemo(
    () => allUsers.filter((user) => user.id !== auth.user?.id),
    [allUsers, auth.user?.id],
  );
  const loading = usersLoading || teamsLoading;
  const showDiscoverSkeleton = useDelayedLoading(loading);

  const filtered = useMemo(
    () =>
      users.filter((user) => {
        const skillMatch =
          !skill ||
          user.skills?.some((item) => item.toLowerCase().includes(skill.toLowerCase()));
        const branchMatch =
          !branch || user.branch?.toLowerCase().includes(branch.toLowerCase());
        const collegeMatch =
          !college || user.college?.toLowerCase().includes(college.toLowerCase());
        const yearMatch = !year || String(user.year ?? "") === year;
        return skillMatch && collegeMatch && branchMatch && yearMatch;
      }),
    [branch, college, skill, users, year],
  );

  async function sendRequest() {
    if (!requestTarget?.team) {
      toast.info("This student has no public leader team to request yet.");
      return;
    }
    try {
      await createJoinRequest({
        team_id: requestTarget.team.id,
        message: message || `I would like to collaborate with ${requestTarget.user.name}.`,
      });
      toast.success("Request sent");
      setRequestTarget(null);
      setMessage("");
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error, "Could not send request."));
    }
  }

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
            initial={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.4 }}
          >
            <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-indigo-50/80 px-3 py-1 text-sm font-bold text-indigo-700">
                  <Sparkles className="h-4 w-4" />
                  Intelligent matching
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Discover collaborators</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                  Search students by skills, college, branch, and year to find people who fit your next build.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:min-w-72">
                <DiscoverSignal label="Students" value={users.length} />
                <DiscoverSignal label="Matches" value={filtered.length} />
              </div>
            </div>
          </motion.div>

          <div className="mb-6 rounded-2xl border border-white/75 bg-white/74 p-3 shadow-[0_12px_38px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          <div className="grid gap-3 lg:grid-cols-[1fr_0.75fr_0.75fr_0.4fr]">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <Input className="h-12 rounded-xl border-white/80 bg-white pl-12 text-base shadow-sm focus:ring-blue-100" placeholder="Search skill, e.g. React or Python" value={skill} onChange={(event) => setSkill(event.target.value)} />
            </div>
            <Input className="h-12 rounded-xl border-white/80 bg-white shadow-sm" placeholder="College" value={college} onChange={(event) => setCollege(event.target.value)} />
            <Input className="h-12 rounded-xl border-white/80 bg-white shadow-sm" placeholder="Branch" value={branch} onChange={(event) => setBranch(event.target.value)} />
            <Input className="h-12 rounded-xl border-white/80 bg-white shadow-sm" placeholder="Year" value={year} onChange={(event) => setYear(event.target.value)} />
          </div>
          </div>
          <motion.div
            animate="show"
            className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
            initial="hidden"
            transition={{ staggerChildren: 0.06 }}
          >
            {showDiscoverSkeleton
              ? Array.from({ length: 6 }).map((_, index) => <UserCardSkeleton key={index} />)
              : filtered.map((user) => (
                <motion.div
                  key={user.id}
                  variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
                >
                  <UserCard
                    user={user}
                    teams={teams}
                    onSelect={(requestUser, team) => setSelected({ user: requestUser, team })}
                    onRequest={(requestUser, team) => setRequestTarget({ user: requestUser, team })}
                  />
                </motion.div>
                ))}
          </motion.div>
          {!loading && !filtered.length && (
            <div className="mt-8 rounded-2xl border border-dashed border-slate-300/80 bg-white/72 p-10 text-center shadow-sm backdrop-blur-xl">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
                <UserRoundSearch className="h-7 w-7" />
              </div>
              <h2 className="mt-5 text-2xl font-black text-slate-950">No collaborators found</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
                Try a broader skill, remove a filter, or search by branch to uncover more students.
              </p>
            </div>
          )}
          </div>
        </section>
      </div>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          <DialogTitle>Collaboration profile</DialogTitle>
          <DialogDescription>Academic and skill details are shown after opening a profile.</DialogDescription>
          {selected && (
            <div className="mt-5 space-y-5">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selected.user.profile_image_url ?? undefined} />
                  <AvatarFallback>{selected.user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-semibold text-slate-950">{selected.user.name}</p>
                  <p className="text-sm font-medium text-indigo-700">
                    {usernameLabel(selected.user)}
                  </p>
                  <p className="text-sm text-slate-500">
                    {selected.user.year ? `Year ${selected.user.year}` : "Student"}
                  </p>
                </div>
              </div>
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <Info label="Branch / Department" value={selected.user.branch} />
                <Info label="College" value={selected.user.college} />
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-700">Skills</p>
                <div className="flex flex-wrap gap-2">
                  {selected.user.skills?.length ? (
                    selected.user.skills.map((item) => <Badge key={item} variant="secondary">{item}</Badge>)
                  ) : (
                    <Badge variant="secondary">No skills added</Badge>
                  )}
                </div>
              </div>
              <Button
                className="auth-primary-cta w-full"
                variant="default"
                onClick={() => {
                  setRequestTarget(selected);
                  setSelected(null);
                }}
              >
                Send Request
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(requestTarget)} onOpenChange={(open) => !open && setRequestTarget(null)}>
        <DialogContent>
          <DialogTitle>Send collaboration request</DialogTitle>
          <DialogDescription>
            {requestTarget?.team
              ? `Request to join ${requestTarget.team.name}, led by ${requestTarget.user.name}.`
              : `${requestTarget?.user.name} does not currently lead a public team.`}
          </DialogDescription>
          <div className="mt-4 space-y-4">
            <Textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Share why you want to collaborate" />
            <Button className="auth-primary-cta w-full" variant="default" onClick={sendRequest}>
              Send Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 font-medium text-slate-700">{value || "Not added"}</p>
    </div>
  );
}

function UserCardSkeleton() {
  return (
    <div className="h-80 rounded-2xl border border-white/80 bg-white/82 p-5 shadow-sm backdrop-blur">
      <div className="flex items-start gap-4">
        <Skeleton className="h-16 w-16 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
      <div className="mt-6 space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Skeleton className="h-7 w-20 rounded-full" />
        <Skeleton className="h-7 w-16 rounded-full" />
        <Skeleton className="h-7 w-24 rounded-full" />
      </div>
      <div className="mt-7 grid grid-cols-2 gap-2">
        <Skeleton className="h-11 rounded-xl" />
        <Skeleton className="h-11 rounded-xl" />
      </div>
    </div>
  );
}

function DiscoverSignal({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/80 bg-white/75 p-4 shadow-sm backdrop-blur">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-indigo-600" />
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">{label}</p>
      </div>
      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{value}</p>
    </div>
  );
}
