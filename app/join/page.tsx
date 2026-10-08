import { Radio } from "lucide-react";
import { connection } from "next/server";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/spinner";
import { prisma } from "@/lib/db";
import { JoinForm } from "./join-form";

export const metadata = { title: "Join the room" };

async function JoinPanelSection() {
  // Panel list must be fresh at request time (people get added mid-event).
  await connection();

  const panels = await prisma.panel.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, description: true },
  });

  return (
    <div className="w-full max-w-md animate-fade-up">
      <div className="mb-6">
        <h2 className="text-xl font-semibold tracking-tight">Enter the room</h2>
        <p className="mt-1 text-sm text-ink-2">
          {panels.length > 0
            ? `${panels.length} domain panel${panels.length === 1 ? "" : "s"} are active right now.`
            : "No panels are active yet — check back with the coordinator."}
        </p>
      </div>
      <JoinForm panels={panels} />
    </div>
  );
}

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
            Check in with your roll number and get seated faster.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70">
            Your roll number identifies you for the rest of the event. Pick the
            domains you are reporting to and the live board will track your
            station from waiting to done.
          </p>
          <ul className="mt-6 space-y-2.5 text-sm text-white/80">
            <li className="flex items-center gap-2.5">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              See free stations before you walk over
            </li>
            <li className="flex items-center gap-2.5">
              <span className="size-1.5 rounded-full bg-indigo-400" />
              Panelists move you through the queue in one tap
            </li>
            <li className="flex items-center gap-2.5">
              <span className="size-1.5 rounded-full bg-amber-400" />
              Admins manage panels and members from the control room
            </li>
          </ul>
        </div>

        <p className="relative mt-10 text-xs text-white/50">
          PINs are issued by the room coordinator — ask at the desk.
        </p>
      </aside>

      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <Suspense
          fallback={
            <div className="w-full max-w-md space-y-4">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-72" />
              <Skeleton className="h-64 w-full" />
            </div>
          }
        >
          <JoinPanelSection />
        </Suspense>
      </main>
    </div>
  );
}
