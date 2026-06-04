"use client";

import { Check, Loader2, MessageSquare, Send, Users, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { respondToRequest } from "@/services/requestService";
import { queryKeys } from "@/lib/queryKeys";
import type { JoinRequest } from "@/types/request";

export function RequestCard({
  request,
  mode,
  onChanged,
}: {
  request: JoinRequest;
  mode: "incoming" | "sent";
  onChanged?: () => void;
}) {
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const queryClient = useQueryClient();
  const teamName = request.team?.name || "your selected team";
  const fromUserName =
    request.from_user?.username ||
    request.from_user?.full_name ||
    request.from_user?.name ||
    "a teammate";

  async function respond(status: "accepted" | "rejected") {
    setBusy(true);
    try {
      await respondToRequest(request.id, {
        status,
        reply_message: reply || null,
      });
      toast.success(`Request ${status}`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.myRequests }),
        queryClient.invalidateQueries({ queryKey: queryKeys.teamRequests(request.team_id) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.teams }),
      ]);
      onChanged?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not respond");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="overflow-hidden bg-white/90">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
              {mode === "incoming" ? <Users className="h-5 w-5" /> : <Send className="h-5 w-5" />}
            </div>
            <div className="min-w-0">
              <CardTitle className="truncate text-base">{teamName}</CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                {mode === "incoming" ? `From ${fromUserName}` : `Request sent to ${teamName}`}
              </p>
            </div>
          </div>
          <Badge
            className={
              request.status === "accepted"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : request.status === "rejected"
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : "border-indigo-200 bg-indigo-50 text-indigo-700"
            }
            variant="secondary"
          >
            {request.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-2xl border border-slate-100 bg-slate-50/85 p-4">
          <p className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
            <MessageSquare className="h-3.5 w-3.5" />
            Message
          </p>
          <p className="text-sm leading-6 text-slate-700">
            {request.message || `${fromUserName} did not add a note yet.`}
          </p>
        </div>
        {request.reply_message && (
          <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-sm leading-6 text-slate-700">
            <span className="mb-1 block text-xs font-bold uppercase tracking-[0.14em] text-blue-500">Reply</span>
            {request.reply_message}
          </div>
        )}
        {mode === "incoming" && request.status === "pending" && (
          <div className="space-y-3">
            <Input placeholder="Reply message" value={reply} onChange={(event) => setReply(event.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <Button className="auth-primary-cta" disabled={busy} variant="default" onClick={() => respond("accepted")}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Accept
              </Button>
              <Button disabled={busy} variant="outline" onClick={() => respond("rejected")}>
                <X className="h-4 w-4" />
                Reject
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
