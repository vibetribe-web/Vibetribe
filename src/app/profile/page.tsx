"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Save } from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRequireAuth } from "@/hooks/useAuth";
import { usernameLabel, userSafeContext } from "@/lib/userDisplay";
import { updateCurrentUser, updateUsername } from "@/services/authService";
import { getFriendlyErrorMessage, getToken } from "@/services/api";
import type { User } from "@/types/user";

export default function ProfilePage() {
  const router = useRouter();
  const auth = useRequireAuth();

  function handleLogout() {
    auth.logout();
    router.replace("/");
  }

  return (
    <main>
      <Navbar />
      <div className="flex min-h-[calc(100vh-4rem)]">
        <Sidebar />
        <section className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="mb-8 text-3xl font-bold">Profile</h1>
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <Card>
              <CardHeader className="items-center text-center">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={auth.user?.profile_image_url ?? undefined} />
                  <AvatarFallback>{auth.user?.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <CardTitle>{auth.user?.name}</CardTitle>
                {auth.user && (
                  <p className="text-sm font-medium text-teal-700">{usernameLabel(auth.user)}</p>
                )}
                <p className="text-sm text-slate-500">
                  {auth.user ? userSafeContext(auth.user) || "Student profile" : "Student profile"}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {auth.user?.skills?.length ? (
                    auth.user.skills.map((skill) => <Badge key={skill} variant="secondary">{skill}</Badge>)
                  ) : (
                    <Badge variant="secondary">No skills yet</Badge>
                  )}
                </div>
                <Button className="w-full" variant="outline" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Edit profile</CardTitle>
              </CardHeader>
              <CardContent>
                {auth.user && (
                  <ProfileEditor
                    key={auth.user.id}
                    user={auth.user}
                    refreshUser={() => auth.getCurrentUser(true)}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}

function ProfileEditor({
  user,
  refreshUser,
}: {
  user: User;
  refreshUser: () => Promise<User | null>;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: user.name ?? "",
    username: user.username && user.username !== "pending" ? user.username : "",
    college: user.college ?? "",
    branch: user.branch ?? "",
    year: user.year ? String(user.year) : "",
    skills: user.skills?.join(", ") ?? "",
  });
  const [savingUsername, setSavingUsername] = useState(false);

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await updateCurrentUser({
        name: form.name,
        college: form.college || null,
        branch: form.branch || null,
        year: form.year ? Number(form.year) : null,
        skills: form.skills.split(",").map((skill) => skill.trim()).filter(Boolean),
      });
      await refreshUser();
      toast.success("Profile updated");
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error, "Could not update profile."));
    }
  }

  async function handleSaveUsername() {
    if (!getToken()) {
      toast.error("Please login again");
      router.replace("/auth");
      return;
    }
    const username = form.username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,30}$/.test(username)) {
      toast.error("Username must be 3-30 lowercase letters, numbers, or underscores.");
      return;
    }
    setSavingUsername(true);
    try {
      await updateUsername(username);
      await refreshUser();
      setForm((current) => ({ ...current, username }));
      toast.success("Username updated successfully");
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error, "Could not update username."));
    } finally {
      setSavingUsername(false);
    }
  }

  return (
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSave}>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="profile-avatar">Avatar URL</Label>
        <Input id="profile-avatar" disabled value={user.profile_image_url ?? ""} placeholder="Google profile image is used when available" />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="profile-username">Username</Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="profile-username"
            placeholder="Choose your unique username"
            value={form.username}
            minLength={3}
            maxLength={30}
            pattern="[a-z0-9_]{3,30}"
            onChange={(event) =>
              setForm({ ...form, username: event.target.value.toLowerCase() })
            }
          />
          <Button
            type="button"
            variant="outline"
            disabled={savingUsername}
            onClick={handleSaveUsername}
          >
            Save Username
          </Button>
        </div>
        <p className="text-xs text-slate-500">
          Current: {usernameLabel({ id: user.id, username: form.username || user.username })}
        </p>
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="profile-name">Name</Label>
        <Input id="profile-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="profile-college">College</Label>
        <Input id="profile-college" value={form.college} onChange={(event) => setForm({ ...form, college: event.target.value })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="profile-branch">Branch</Label>
        <Input id="profile-branch" value={form.branch} onChange={(event) => setForm({ ...form, branch: event.target.value })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="profile-year">Year</Label>
        <Input id="profile-year" type="number" min="1" max="6" value={form.year} onChange={(event) => setForm({ ...form, year: event.target.value })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="profile-skills">Skills</Label>
        <Input id="profile-skills" value={form.skills} onChange={(event) => setForm({ ...form, skills: event.target.value })} />
      </div>
      <Button className="auth-primary-cta h-12 sm:col-span-2" type="submit" variant="default">
        <Save className="h-4 w-4" />
        Save changes
      </Button>
    </form>
  );
}
