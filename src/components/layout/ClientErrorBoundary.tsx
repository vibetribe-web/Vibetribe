"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

type ClientErrorBoundaryState = {
  hasError: boolean;
};

export class ClientErrorBoundary extends Component<
  { children: ReactNode },
  ClientErrorBoundaryState
> {
  state: ClientErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Client render error:", { error, errorInfo });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <section className="max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-2xl font-black text-slate-950">Something went wrong</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            We had trouble loading this page. Please refresh and try again.
          </p>
          <Button
            className="mt-5"
            type="button"
            variant="default"
            onClick={() => this.setState({ hasError: false })}
          >
            Try again
          </Button>
        </section>
      </main>
    );
  }
}
