"use client";

import { useState } from "react";
import { Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { getFriendlyErrorMessage } from "@/services/api";
import { listMyTeams, shareEventToTeam } from "@/services/teamService";
import type { Event } from "@/types/event";
import type { TeamWorkflow } from "@/types/team";

export function EventShareModal({
  event,
  compact = false,
  disabled = false,
}: {
  event: Event;
  compact?: boolean;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [teams, setTeams] = useState<TeamWorkflow[]>([]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [sharingTeamId, setSharingTeamId] = useState<number | null>(null);

  async function loadTeams() {
    setLoading(true);
    try {
      setTeams(await listMyTeams());
    } catch {
      setTeams([]);
      toast.error("Could not load your teams");
    } finally {
      setLoading(false);
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (disabled) return;
    setOpen(nextOpen);
    if (nextOpen) void loadTeams();
  }

  async function share(teamId: number) {
    if (disabled) return;
    setSharingTeamId(teamId);
    try {
      await shareEventToTeam(teamId, event.id, note);
      toast.success("Event shared to team chat");
      setOpen(false);
      setNote("");
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error, "Could not share event."));
    } finally {
      setSharingTeamId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          aria-label={`Share ${event.title} to team`}
          className={compact ? "shrink-0" : "w-full"}
          disabled={disabled}
          size={compact ? "icon" : "default"}
          variant="secondary"
        >
          <Share2 className="h-4 w-4" />
          {!compact && "Share to Team"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Share to team chat</DialogTitle>
        <DialogDescription>Post {event.title} as a rich card in one of your team conversations.</DialogDescription>
        <div className="mt-5 space-y-4">
          <Textarea
            value={note}
            onChange={(inputEvent) => setNote(inputEvent.target.value)}
            placeholder="Add a note for your team"
          />
          <div className="space-y-2">
            {loading ? (
              <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Loading your teams...</div>
            ) : teams.length ? (
              teams.map((team) => (
                <button
                  key={team.team_id}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:bg-slate-50"
                  onClick={() => share(team.team_id)}
                  type="button"
                >
                  <span>
                    <span className="block font-semibold text-slate-900">{team.team_name}</span>
                    <span className="text-sm text-slate-500">
                      {team.member_count}/{team.max_members} members
                    </span>
                  </span>
                  {sharingTeamId === team.team_id && <Loader2 className="h-4 w-4 animate-spin text-slate-500" />}
                </button>
              ))
            ) : (
              <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                You are not a member of any teams yet.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
