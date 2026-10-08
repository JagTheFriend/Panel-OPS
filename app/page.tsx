import { ArrowRight, Gauge, Layers3, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: Gauge,
    title: "Live station board",
    description:
      "See exactly which stations are occupied and free across every domain panel, updating in real time.",
  },
  {
    icon: Layers3,
    title: "Kanban by domain",
    description:
      "Waiting → In interview → Done. Drag candidates across columns as the day progresses.",
  },
  {
    icon: Users,
    title: "Built for the room",
    description:
      "Coordinators add participants as they walk in; panelists mark interviews done with one tap.",
  },
  {
    icon: ShieldCheck,
    title: "Admin control",
    description:
      "Create, edit and retire domain panels, manage members and control who has access.",
  },
];

export default function HomePage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(79,70,229,0.12),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(16,185,129,0.10),transparent_50%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
      />

      <header className="relative z-10 mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white shadow-card">
            P
          </span>
          <span className="text-sm font-semibold tracking-tight">PanelOps</span>
        </div>
        <Link
          href="/join"
          className="inline-flex h-9 items-center rounded-lg border border-line-strong bg-surface px-4 text-sm font-medium shadow-card transition hover:bg-surface-2"
        >
          Enter the room
        </Link>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 py-14 sm:px-6">
        <div className="max-w-2xl animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand-soft px-3 py-1 text-xs font-semibold tracking-wide text-brand-ink">
            <span className="size-1.5 animate-pulse-soft rounded-full bg-brand" />
            Live recruitment operations
          </span>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Every panel. Every station. One live board.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-2 sm:text-lg">
            PanelOps keeps track of empty stations across your recruitment
            domain panels — so nobody waits at a busy desk while another sits
            empty.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href="/join"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-medium text-white shadow-card transition hover:bg-brand-hover active:scale-[0.98]"
            >
              Enter the room
              <ArrowRight className="size-4" />
            </Link>
            <span className="text-sm text-ink-3">
              Roll number + room PIN — no signup required.
            </span>
          </div>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="animate-fade-up rounded-2xl border border-line bg-surface/80 p-5 shadow-card backdrop-blur-sm"
              style={{ animationDelay: `${120 + index * 70}ms` }}
            >
              <span className="flex size-9 items-center justify-center rounded-lg bg-brand-soft text-brand-ink">
                <feature.icon className="size-4.5" />
              </span>
              <h2 className="mt-3 text-sm font-semibold">{feature.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-2">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </main>

      <footer className="relative z-10 border-t border-line/70 py-5">
        <p className="mx-auto max-w-6xl px-4 text-xs text-ink-3 sm:px-6">
          Built for recruitment coordinators · Panels update live for everyone
          in the room.
        </p>
      </footer>
    </div>
  );
}
