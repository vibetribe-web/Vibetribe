"use client";

import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { userDisplayLabel, usernameLabel } from "@/lib/userDisplay";
import { listUsers } from "@/services/userService";
import type { User } from "@/types/user";

export function UserSelector({
  users,
  value,
  onChange,
  placeholder = "Search students...",
}: {
  users?: User[];
  value?: number | null;
  onChange: (user: User | null) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [college, setCollege] = useState("all");
  const [branch, setBranch] = useState("all");
  const [year, setYear] = useState("all");
  const [remoteUsers, setRemoteUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const sourceUsers = users ?? remoteUsers;
  const selected = sourceUsers.find((user) => user.id === value) ?? null;
  const colleges = useMemo(() => uniqueOptions(sourceUsers.map((user) => user.college)), [sourceUsers]);
  const branches = useMemo(() => uniqueOptions(sourceUsers.map((user) => user.branch)), [sourceUsers]);
  const years = useMemo(
    () => uniqueOptions(sourceUsers.map((user) => (user.year ? String(user.year) : null))),
    [sourceUsers],
  );

  useEffect(() => {
    if (users) return;
    const timeout = window.setTimeout(() => {
      setLoading(true);
      listUsers(query)
        .then(setRemoteUsers)
        .catch(() => setRemoteUsers([]))
        .finally(() => setLoading(false));
    }, 200);
    return () => window.clearTimeout(timeout);
  }, [query, users]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return sourceUsers.filter((user) => {
      const matchesSearch =
        !term ||
        [
        user.name,
        user.username,
        user.branch,
        user.college,
        user.year ? String(user.year) : "",
      ]
        .filter(Boolean)
          .some((item) => item!.toLowerCase().includes(term));
      const matchesCollege = college === "all" || user.college === college;
      const matchesBranch = branch === "all" || user.branch === branch;
      const matchesYear = year === "all" || String(user.year ?? "") === year;
      return matchesSearch && matchesCollege && matchesBranch && matchesYear;
    });
  }, [branch, college, query, sourceUsers, year]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <span className="truncate text-left">
            {selected ? userDisplayLabel(selected, sourceUsers) : placeholder}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(94vw,640px)]">
        <Command shouldFilter={false}>
          <div className="grid gap-2 border-b border-slate-100 p-2 lg:grid-cols-[1fr_auto_auto_auto]">
            <CommandInput
              className="rounded-xl border border-slate-200 bg-white px-3"
              placeholder="Search students..."
              value={query}
              onValueChange={setQuery}
            />
            <FilterSelect label="College" value={college} values={colleges} onChange={setCollege} />
            <FilterSelect label="Branch" value={branch} values={branches} onChange={setBranch} />
            <FilterSelect label="Year" value={year} values={years} onChange={setYear} />
          </div>
          <CommandList className="max-h-72 overflow-y-auto">
            <CommandEmpty>
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching
                </span>
              ) : (
                "No users found"
              )}
            </CommandEmpty>
            <CommandGroup>
              {filtered.map((user) => (
                <CommandItem
                  key={user.id}
                  value={`${user.name} ${user.username ?? ""}`}
                  onSelect={() => {
                    onChange(user);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn("mr-2 h-4 w-4", value === user.id ? "opacity-100" : "opacity-0")}
                  />
                  <span>
                    <span className="block font-medium text-slate-900">{user.name}</span>
                    <span className="block text-xs text-slate-500">
                      {usernameLabel(user)} {user.branch ? `• ${user.branch}` : ""}{" "}
                      {user.year ? `• Year ${user.year}` : ""} {user.college ? `• ${user.college}` : ""}
                    </span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function FilterSelect({
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
    <select
      aria-label={label}
      className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100/75"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="all">{label}</option>
      {values.map((item) => (
        <option key={item} value={item}>
          {item}
        </option>
      ))}
    </select>
  );
}

function uniqueOptions(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value)))).sort((a, b) =>
    a.localeCompare(b),
  );
}
