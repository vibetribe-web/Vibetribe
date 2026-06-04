import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { AppWarmup } from "@/components/layout/AppWarmup";
import { AppMotionShell } from "@/components/layout/AppMotionShell";
import { ClientErrorBoundary } from "@/components/layout/ClientErrorBoundary";
import { OfflineBanner } from "@/components/layout/OfflineBanner";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VibeTribe",
  description: "Find your vibe. Build your tribe.",
  icons: {
    icon: "/vibetribe-app-mark.png",
    shortcut: "/vibetribe-app-mark.png",
    apple: "/vibetribe-app-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen font-sans antialiased selection:bg-blue-200/70 selection:text-slate-950">
        <QueryProvider>
          <ClientErrorBoundary>
            <OfflineBanner />
            <AppWarmup />
            <AppMotionShell>{children}</AppMotionShell>
          </ClientErrorBoundary>
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}
