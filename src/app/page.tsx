import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CalendarDays, CheckCircle2, Compass, Trophy, Users } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { StoryBehindVibeTribe } from "@/components/layout/StoryBehindVibeTribe";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    title: "Discover Hackathons",
    icon: Trophy,
    copy: "Explore competitions, workshops, and student events shared by active campus clubs.",
  },
  {
    title: "Find Teammates",
    icon: Compass,
    copy: "Search students by skills, interests, branch, and year to find the right collaborators.",
  },
  {
    title: "Build Teams",
    icon: Users,
    copy: "Create project teams, request to join teams, and organize around skill needs.",
  },
  {
    title: "Join Student Clubs",
    icon: CalendarDays,
    copy: "Follow club activity and participate in the events that match your goals.",
  },
];

const steps = [
  "Create your profile",
  "Discover events and clubs",
  "Match with teammates",
  "Build and compete together",
];

export default function LandingPage() {
  return (
    <main>
      <Navbar />
      <section className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1800&q=80"
          alt="Students collaborating around laptops"
          className="absolute inset-0 h-full w-full object-cover"
          fill
          priority
          sizes="100vw"
          unoptimized
        />
        <div className="absolute inset-0 bg-slate-950/60" />
        <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col justify-center px-4 py-20 text-white sm:px-6 lg:px-8">
          <p className="mb-4 max-w-max rounded-full border border-white/30 px-4 py-2 text-sm font-medium backdrop-blur">
            Student collaboration ecosystem
          </p>
          <h1 className="max-w-4xl text-5xl font-bold leading-tight sm:text-6xl lg:text-7xl">
            Find your vibe. Build your tribe.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-100">
            VibeTribe helps students discover hackathons, connect with teammates, join clubs, and build project teams based on skills and interests.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" variant="gradient">
              <Link href="/auth">
                Get Started <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/auth">Login</Link>
            </Button>
          </div>
        </div>
      </section>

      <StoryBehindVibeTribe />

      <section className="mx-auto max-w-7xl px-4 pb-24 pt-16 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-600">Features</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Everything students need to move from idea to team.
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            Discover opportunities, find collaborators, and turn skills into momentum.
          </p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="bg-white/80">
                <CardHeader>
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-teal-100 text-blue-700">
                    <Icon className="h-5 w-5" />
                  </span>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-slate-600">{feature.copy}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="bg-slate-950 py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-300">How it works</p>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">From profile to project team.</h2>
              <p className="mt-4 leading-7 text-slate-300">
                Start with who you are, then discover the people, clubs, and events that fit what you want to build next.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {steps.map((step, index) => (
                <div key={step} className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-400 font-bold text-slate-950">
                      {index + 1}
                    </span>
                    <CheckCircle2 className="h-5 w-5 text-teal-300" />
                  </div>
                  <p className="mt-5 text-lg font-semibold">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 px-4 text-sm text-slate-500 sm:flex-row sm:px-6 lg:px-8">
          <p>VibeTribe</p>
          <p>Find your vibe. Build your tribe.</p>
        </div>
      </footer>
    </main>
  );
}
