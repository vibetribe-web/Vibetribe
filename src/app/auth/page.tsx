import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import { Navbar } from "@/components/layout/Navbar";

export default function AuthPage() {
  return (
    <main>
      <Navbar />
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-600">
            Welcome to VibeTribe
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Your next project team is closer than it feels.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
            Login or create an account to access recommendations, team workflows, and member-only club event tools.
          </p>
        </div>
        <Suspense>
          <AuthForm />
        </Suspense>
      </section>
    </main>
  );
}
