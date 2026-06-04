"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Compass, Inbox, LayoutDashboard, Shield, Users, UserRound } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/requests", label: "Requests", icon: Inbox },
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/clubs", label: "Clubs", icon: Users },
  { href: "/teams", label: "Teams", icon: Users },
  { href: "/profile", label: "Profile", icon: UserRound },
];

export function Sidebar() {
  const pathname = usePathname();
  const auth = useAuth();
  const visibleItems = auth.user?.is_admin
    ? [...items, { href: "/admin", label: "Admin", icon: Shield }]
    : items;

  return (
    <aside className="hidden w-60 shrink-0 border-r border-slate-200/70 bg-white/72 p-3.5 backdrop-blur lg:block">
      <div className="sticky top-[4.25rem] space-y-1.5">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 transition-all duration-200 hover:bg-blue-50/85 hover:text-blue-950",
                pathname === item.href && "bg-slate-950 text-white shadow-sm shadow-slate-900/10 hover:bg-slate-950 hover:text-white",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
