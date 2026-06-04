"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Shield, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { UserSelector } from "@/components/users/UserSelector";
import { useRequireAuth } from "@/hooks/useAuth";
import { useDelayedLoading } from "@/hooks/useDelayedLoading";
import { userDisplayLabel, userSafeContext } from "@/lib/userDisplay";
import { getFriendlyErrorMessage } from "@/services/api";
import { getAdminDashboard, listAdminRequests, listAdminUsers } from "@/services/adminService";
import { assignLeader, createClub, deactivateClub, listAdminClubs, updateClub } from "@/services/clubService";
import type { AdminDashboard } from "@/types/admin";
import type { ClubAdmin } from "@/types/club";
import type { JoinRequest } from "@/types/request";
import type { User } from "@/types/user";

export default function AdminPage() {
  const router = useRouter();
  const auth = useRequireAuth();
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [clubs, setClubs] = useState<ClubAdmin[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [clubForm, setClubForm] = useState({ name: "", description: "" });
  const [leaderSelections, setLeaderSelections] = useState<Record<number, User | null>>({});
  const [userSearch, setUserSearch] = useState("");
  const [savingClub, setSavingClub] = useState(false);
  const showAdminSkeleton = useDelayedLoading(loading);

  const load = useCallback(async () => {
    if (!auth.isAuthenticated) return;
    if (auth.user && !auth.user.is_admin) {
      router.replace("/dashboard");
      return;
    }
    setLoading(true);
    try {
      const [stats, clubData, userData, requestData] = await Promise.all([
        getAdminDashboard(),
        listAdminClubs(),
        listAdminUsers(),
        listAdminRequests(),
      ]);
      setDashboard(stats);
      setClubs(clubData);
      setUsers(userData);
      setRequests(requestData);
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error, "Could not load admin data."));
    } finally {
      setLoading(false);
    }
  }, [auth.isAuthenticated, auth.user, router]);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  async function handleCreateClub(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingClub(true);
    try {
      await createClub({ name: clubForm.name, description: clubForm.description || null });
      toast.success("Club created");
      setClubForm({ name: "", description: "" });
      await load();
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error, "Could not create club."));
    } finally {
      setSavingClub(false);
    }
  }

  async function toggleClub(club: ClubAdmin) {
    try {
      if (club.is_active) await deactivateClub(club.id);
      else await updateClub(club.id, { is_active: true });
      toast.success("Club updated");
      await load();
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error, "Could not update club."));
    }
  }

  async function addLeader(clubId: number, userId: number) {
    try {
      await assignLeader(clubId, userId);
      toast.success("Leader assigned");
      await load();
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error, "Could not assign leader."));
    }
  }

  const visibleUsers = users.filter((user) => {
    const term = userSearch.trim().toLowerCase();
    if (!term) return true;
    return [user.name, user.username, user.branch, user.college, user.year ? String(user.year) : ""]
      .filter(Boolean)
      .some((item) => item!.toLowerCase().includes(term));
  });

  return (
    <main>
      <Navbar />
      <div className="flex min-h-[calc(100vh-4rem)]">
        <Sidebar />
        <section className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-semibold text-teal-600">Admin</p>
              <h1 className="text-3xl font-bold">Platform management</h1>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="auth-primary-cta shrink-0" variant="default">
                  <Shield className="h-4 w-4" />
                  Create Club
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogTitle>Create club</DialogTitle>
                <DialogDescription>Add a club shell, then assign leaders from registered users.</DialogDescription>
                <form className="mt-5 space-y-4" onSubmit={handleCreateClub}>
                  <div className="space-y-2">
                    <Label htmlFor="club-name">Club name</Label>
                    <Input id="club-name" required value={clubForm.name} onChange={(event) => setClubForm({ ...clubForm, name: event.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="club-description">Description</Label>
                    <Textarea id="club-description" value={clubForm.description} onChange={(event) => setClubForm({ ...clubForm, description: event.target.value })} />
                  </div>
                  <Button className="auth-primary-cta w-full" variant="default" disabled={savingClub}>
                    {savingClub && <Loader2 className="h-4 w-4 animate-spin" />}
                    Save club
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="mb-8 grid gap-5 md:grid-cols-4">
            {showAdminSkeleton ? (
              Array.from({ length: 4 }).map((_, index) => <StatSkeleton key={index} />)
            ) : (
              <>
                <Stat label="Users" value={dashboard?.users_count ?? 0} />
                <Stat label="Teams" value={dashboard?.teams_count ?? 0} />
                <Stat label="Requests" value={dashboard?.requests_count ?? 0} />
                <Stat label="Pending" value={dashboard?.pending_requests_count ?? 0} />
              </>
            )}
          </div>

          <Tabs defaultValue="clubs">
            <TabsList>
              <TabsTrigger value="clubs">Clubs Management</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="events">Events Oversight</TabsTrigger>
            </TabsList>
            <TabsContent value="clubs">
              <div className="grid gap-5">
                {showAdminSkeleton
                  ? Array.from({ length: 3 }).map((_, index) => <AdminClubSkeleton key={index} />)
                  : clubs.map((club) => (
                  <Card key={club.id}>
                    <CardHeader>
                      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                        <div>
                          <CardTitle>{club.name}</CardTitle>
                          <p className="mt-1 text-sm text-slate-500">{club.description}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant={club.is_active ? "default" : "secondary"}>{club.is_active ? "active" : "inactive"}</Badge>
                          <Button size="sm" variant="outline" onClick={() => toggleClub(club)}>
                            <Trash2 className="h-4 w-4" />
                            {club.is_active ? "Deactivate" : "Reactivate"}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {club.leaders.map((leader) => (
                          <Badge key={leader.user_id} variant="secondary">{leader.name}</Badge>
                        ))}
                        {!club.leaders.length && <Badge variant="secondary">No leaders</Badge>}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <div className="flex w-full flex-col gap-2 sm:flex-row">
                          <UserSelector
                            users={users}
                            value={leaderSelections[club.id]?.id ?? null}
                            onChange={(user) =>
                              setLeaderSelections((current) => ({
                                ...current,
                                [club.id]: user,
                              }))
                            }
                            placeholder="Search students..."
                          />
                          <Button
                            disabled={!leaderSelections[club.id]}
                            onClick={() => {
                              const selectedUser = leaderSelections[club.id];
                              if (selectedUser) void addLeader(club.id, selectedUser.id);
                            }}
                          >
                            <UserPlus className="h-4 w-4" />
                            Assign leader
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {!loading && !clubs.length && <p className="text-sm text-slate-500">No clubs yet.</p>}
              </div>
            </TabsContent>
            <TabsContent value="users">
              <div className="mb-4">
                <Input
                  value={userSearch}
                  onChange={(event) => setUserSearch(event.target.value)}
                  placeholder="Search students..."
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {showAdminSkeleton
                  ? Array.from({ length: 6 }).map((_, index) => <UserRowSkeleton key={index} />)
                  : visibleUsers.map((user) => (
                  <Card key={user.id}>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold">{userDisplayLabel(user, users)}</p>
                          <p className="text-sm text-slate-500">
                            {userSafeContext(user) || "Student profile"}
                          </p>
                        </div>
                        {user.is_admin && <Badge>admin</Badge>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="events">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {showAdminSkeleton
                  ? Array.from({ length: 6 }).map((_, index) => <UserRowSkeleton key={index} />)
                  : requests.map((request) => (
                  <Card key={request.id}>
                    <CardContent className="p-5">
                      <p className="font-semibold">{request.team?.name || "Selected team"}</p>
                      <p className="text-sm text-slate-500">
                        From {request.from_user?.username || request.from_user?.full_name || request.from_user?.name || "a teammate"}
                      </p>
                      <Badge className="mt-3" variant={request.status === "pending" ? "default" : "secondary"}>{request.status}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-slate-500">{label}</p>
        <p className="mt-2 text-3xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function StatSkeleton() {
  return (
    <Card>
      <CardContent className="p-5">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="mt-3 h-9 w-16" />
      </CardContent>
    </Card>
  );
}

function AdminClubSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full max-w-xl" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-7 w-16 rounded-full" />
            <Skeleton className="h-9 w-28 rounded-xl" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-7 w-24 rounded-full" />
          <Skeleton className="h-7 w-20 rounded-full" />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Skeleton className="h-10 flex-1 rounded-xl" />
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );
}

function UserRowSkeleton() {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
          <Skeleton className="h-7 w-16 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}
