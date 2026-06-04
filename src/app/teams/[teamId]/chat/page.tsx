"use client";

import { useParams } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { TeamChatRoom } from "@/components/team-chat/TeamChatRoom";
import { Skeleton } from "@/components/ui/skeleton";
import { useRequireAuth } from "@/hooks/useAuth";

export default function TeamChatPage() {
  const auth = useRequireAuth();
  const params = useParams<{ teamId: string }>();
  const teamId = Number(params.teamId);

  return (
    <ProtectedRoute>
      <main>
        <Navbar />
        <div className="flex min-h-[calc(100vh-4rem)]">
          <Sidebar />
          <section className="flex-1 bg-gradient-to-br from-slate-50 via-white to-blue-50/40 px-4 py-6 sm:px-6 lg:px-8">
            {auth.user && teamId ? (
              <TeamChatRoom currentUser={auth.user} teamId={teamId} />
            ) : (
              <Skeleton className="mx-auto h-[36rem] max-w-7xl rounded-2xl" />
            )}
          </section>
        </div>
      </main>
    </ProtectedRoute>
  );
}
