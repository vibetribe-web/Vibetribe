"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { LogOut, Menu, UserCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationDropdown } from "@/components/layout/NotificationDropdown";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const privateLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/events", label: "Events" },
  { href: "/clubs", label: "Clubs" },
  { href: "/discover", label: "Discover" },
  { href: "/requests", label: "Requests" },
  { href: "/teams", label: "Teams" },
  { href: "/profile", label: "Profile" },
];

const publicLinks = [
  { href: "/", label: "Home" },
  { href: "/#about", label: "About" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const currentUser = auth.isHydrated && auth.isAuthenticated ? auth.user : null;
  const isSignedIn = Boolean(currentUser);
  const links = isSignedIn ? privateLinks : publicLinks;

  useEffect(() => {
    if (!isSignedIn) return;
    ["/dashboard", "/events", "/clubs", "/teams"].forEach((route) => {
      router.prefetch(route);
    });
  }, [isSignedIn, router]);

  function handlePublicLinkClick(
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) {
    if (href !== "/#about") return;
    const aboutSection = document.getElementById("about");
    if (pathname === "/" && aboutSection) {
      event.preventDefault();
      window.history.pushState(null, "", "/#about");
      aboutSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/65 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex h-14 shrink-0 items-center gap-3">
          <Image
            src="/vibetribe-app-mark.png"
            alt=""
            width={56}
            height={48}
            priority
            aria-hidden="true"
            className="block h-12 w-14 object-contain"
          />
          <span className="bg-gradient-to-r from-cyan-500 via-blue-600 to-fuchsia-600 bg-clip-text text-2xl font-black tracking-tight text-transparent">
            VibeTribe
          </span>
        </Link>
        <nav className="hidden items-center gap-0.5 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={(event) => handlePublicLinkClick(event, link.href)}
              className={cn(
                "rounded-xl px-3 py-1.5 text-sm font-semibold text-slate-600 transition-all duration-200 hover:bg-blue-50/80 hover:text-blue-950",
                pathname === link.href && "bg-slate-950 text-white shadow-sm hover:bg-slate-950 hover:text-white",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2.5 md:flex">
          {currentUser ? (
            <>
              <NotificationDropdown />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-xl p-1 transition hover:bg-slate-100">
                    <Avatar>
                      <AvatarImage src={currentUser.profile_image_url ?? undefined} />
                      <AvatarFallback>{currentUser.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-2">
                  <div className="mb-1 border-b border-slate-100 px-2 pb-2">
                    <p className="truncate text-sm font-semibold text-slate-950">{currentUser.name}</p>
                    <p className="truncate text-xs text-slate-500">{currentUser.email}</p>
                  </div>
                  {currentUser.is_admin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin">Admin</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <UserCircle className="h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                    onClick={auth.logout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button
                asChild
                className="auth-nav-login px-4"
                variant="outline"
              >
                <Link href="/auth">Login</Link>
              </Button>
              <Button
                asChild
                className="auth-primary-cta px-5"
                variant="default"
              >
                <Link href="/auth">Get Started</Link>
              </Button>
            </>
          )}
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button className="md:hidden" size="icon" variant="ghost">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle className="sr-only">Navigation menu</SheetTitle>
            </SheetHeader>
            <div className="mt-8 grid gap-2">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={(event) => handlePublicLinkClick(event, link.href)}
                className={cn(
                  "rounded-xl px-3 py-2.5 font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-950",
                  pathname === link.href && "bg-slate-950 text-white hover:bg-slate-950 hover:text-white",
                )}
                >
                  {link.label}
                </Link>
              ))}
              {currentUser?.is_admin && (
                <Link href="/admin" className="rounded-xl px-3 py-2 font-medium">
                  Admin
                </Link>
              )}
              {isSignedIn ? (
                <Button variant="outline" className="mt-3" onClick={auth.logout}>
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              ) : (
                <>
                  <Button
                    asChild
                    className="auth-nav-login mt-3"
                    variant="outline"
                  >
                    <Link href="/auth">Login</Link>
                  </Button>
                  <Button
                    asChild
                    className="auth-primary-cta"
                    variant="default"
                  >
                    <Link href="/auth">Get Started</Link>
                  </Button>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
