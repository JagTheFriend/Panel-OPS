import { Radio } from "lucide-react";
import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/site";
import { GoogleSignIn } from "./google-button";

const joinDescription =
  "Sign in with Google — create rooms with admin and normal PINs, manage interview panels, and track candidate queues live.";

export const metadata: Metadata = {
  title: "Sign in",
  description: joinDescription,
  alternates: { canonical: "/join" },
  openGraph: {
    title: "Sign in to PanelOps",
    description: joinDescription,
    url: "/join",
    siteName: SITE_NAME,
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "Sign in to PanelOps",
    description: joinDescription,
  },
};

export default function JoinPage() {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="relative flex flex-col justify-between overflow-hidden bg-ink px-6 py-10 text-white sm:px-10 lg:w-[44%] lg:px-14 lg:py-14">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.45),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,0.25),transparent_50%)]"
        />
        <div className="relative">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-white text-sm font-bold text-ink">
              P
            </span>
            <span className="text-sm font-semibold tracking-tight">
              PanelOps
            </span>
          </div>
        </div>

        <div className="relative mt-12 lg:mt-0">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide backdrop-blur-sm">
            <Radio className="size-3.5" />
            Recruitment day · Room check-in
          </span>
          <h1 className="mt-5 text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
            Sign in once and run the room from one board.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70">
            Your Google account is your seat at the desk. Create rooms with an
            admin and a normal PIN, manage panels, and watch candidates move
            from waiting to done.
          </p>
          <ul className="mt-6 space-y-2.5 text-sm text-white/80">
            <li className="flex items-center gap-2.5">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              Room admins create, edit, and delete panels
            </li>
            <li className="flex items-center gap-2.5">
              <span className="size-1.5 rounded-full bg-indigo-400" />
              Members join a room with a PIN and pick their panels
            </li>
            <li className="flex items-center gap-2.5">
              <span className="size-1.5 rounded-full bg-amber-400" />
              Panelists move candidates through the queue in one tap
            </li>
          </ul>
        </div>

        <p className="relative mt-10 text-xs text-white/50">
          PINs are issued by the room coordinator — ask at the desk.
        </p>
      </aside>

      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md animate-fade-up space-y-6">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Welcome back
            </h2>
            <p className="mt-1 text-sm text-ink-2">
              Continue with Google to reach your rooms.
            </p>
          </div>
          <GoogleSignIn />
          <p className="text-xs text-ink-3">
            New here? Google creates your account on first sign-in — no extra
            signup step.
          </p>
        </div>
      </main>
    </div>
  );
}
