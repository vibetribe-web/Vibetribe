import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Club } from "@/types/club";

export function ClubCard({
  club,
  selected = false,
  onSelect,
}: {
  club: Club;
  selected?: boolean;
  onSelect?: (club: Club) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(club)}
      className="w-full text-left"
    >
      <Card
        className={`h-full min-h-44 transition hover:-translate-y-0.5 hover:shadow-lg ${
          selected ? "border-indigo-300 bg-indigo-50/40 shadow-lg shadow-indigo-100/60" : ""
        }`}
      >
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Users className="h-5 w-5" />
            </span>
            <Badge variant="secondary">Active</Badge>
          </div>
          <CardTitle>{club.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="line-clamp-3 text-sm text-slate-600">
            {club.description || "A student club building moments, projects, and teams."}
          </p>
        </CardContent>
      </Card>
    </button>
  );
}
