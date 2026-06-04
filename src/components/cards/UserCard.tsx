"use client";

import { Send, Sparkles, UserPlus } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { usernameLabel } from "@/lib/userDisplay";
import type { Team } from "@/types/team";
import type { User } from "@/types/user";

export function UserCard({
  user,
  teams,
  onRequest,
  onSelect,
}: {
  user: User;
  teams: Team[];
  onRequest: (user: User, team?: Team) => void;
  onSelect?: (user: User, team?: Team) => void;
}) {
  const targetTeam = teams.find((team) => team.leader_id === user.id);
  const skillCount = user.skills?.length ?? 0;
  const compatibility = Math.min(96, 58 + skillCount * 7 + (targetTeam ? 10 : 0));

  return (
    <motion.article
      className="group relative h-full cursor-pointer overflow-hidden rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-[0_14px_42px_rgba(15,23,42,0.07)] backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-blue-200/90 hover:bg-white hover:shadow-[0_22px_62px_rgba(37,99,235,0.13)]"
      onClick={() => onSelect?.(user, targetTeam)}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <div className="relative flex h-full flex-col">
        <div className="flex items-start gap-4">
          <div className="relative">
            <Avatar className="h-16 w-16 border-4 border-white shadow-md shadow-slate-900/10">
              <AvatarImage src={user.profile_image_url ?? undefined} />
              <AvatarFallback className="bg-gradient-to-br from-violet-600 via-blue-600 to-teal-500 text-lg font-black text-white">
                {user.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-white bg-emerald-400 shadow-sm" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-bold tracking-tight text-slate-950">{user.name}</h3>
            <p className="mt-1 truncate text-sm font-semibold text-indigo-700">{usernameLabel(user)}</p>
            <p className="mt-1 text-sm text-slate-500">
              {user.branch || "Student"}{user.year ? ` · Year ${user.year}` : ""}
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/90 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              <span className="text-sm font-bold text-slate-800">Compatibility</span>
            </div>
            <span className="text-sm font-bold text-indigo-700">{compatibility}%</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-blue-500 to-violet-500 transition-all duration-500"
              style={{ width: `${compatibility}%` }}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {user.skills?.slice(0, 5).map((skill) => (
            <Badge className="rounded-full bg-slate-100 text-slate-700 hover:bg-slate-100" key={skill} variant="secondary">
              {skill}
            </Badge>
          ))}
          {!user.skills?.length && <Badge className="rounded-full" variant="secondary">No skills yet</Badge>}
        </div>

        <div className="mt-auto pt-5">
          <Button
            className="w-full border-slate-200 bg-white text-slate-900 shadow-sm hover:bg-slate-50 hover:text-slate-950"
            variant="outline"
            onClick={(event) => {
              event.stopPropagation();
              onRequest(user, targetTeam);
            }}
          >
            {targetTeam ? <Send className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            {targetTeam ? "Send request" : "View profile"}
          </Button>
        </div>
      </div>
    </motion.article>
  );
}
