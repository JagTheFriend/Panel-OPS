import { Columns3, Plus, RadioTower } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { BoardEmptyCta, PanelCard } from "@/components/board/panel-card";
import { Badge } from "@/components/ui/badge";
import { Card, EmptyState } from "@/components/ui/empty-state";
import { LiveDot } from "@/components/ui/spinner";
import { getCurrentUser } from "@/lib/auth";
import { getBoardOverview } from "@/lib/data/queries";

export const metadata = { title: "Board" };
export const instant = false;

const tiles = [
  { key: "panels", label: "Active panels" },
  { key: "waiting", label: "Waiting" },
  { key: "interviewing", label: "In interview" },
  { key: "done", label: "Done" },
] as const;

export default async function BoardPage() {
  await connection();
  const user = await getCurrentUser();
  if (!user) redirect("/join");

  const panels = await getBoardOverview(user.id, user.role === "ADMIN");

  const totals = {
    panels: panels.length,
    waiting: panels.reduce((sum, p) => sum + p.waiting, 0),
    interviewing: panels.reduce((sum, p) => sum + p.interviewing, 0),
    done: panels.reduce((sum, p) => sum + p.done, 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Live board</h1>
          <p className="mt-1 text-sm text-ink-2">
            Queues and interview progress across your domain panels.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Badge tone="live" className="px-2.5 py-1">
            <LiveDot />
            Live
          </Badge>
          {user.role === "ADMIN" ? (
            <Link
              href="/admin/panels"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand px-3.5 text-sm font-medium text-white shadow-card transition hover:bg-brand-hover active:scale-[0.98]"
            >
              <Plus className="size-4" />
              New panel
            </Link>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((tile) => (
          <Card key={tile.key} className="p-4">
            <p className="text-[11px] font-semibold tracking-wider text-ink-3 uppercase">
              {tile.label}
            </p>
            <p className="mt-1.5 font-mono text-3xl font-semibold tracking-tight text-ink tabular-nums">
              {totals[tile.key]}
            </p>
          </Card>
        ))}
      </div>

      {panels.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {panels.map((panel, index) => (
            <div
              key={panel.id}
              className="animate-fade-up"
              style={{ animationDelay: `${index * 45}ms` }}
            >
              <PanelCard panel={panel} />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Columns3 className="size-5" />}
          title="No active panels yet"
          description="Admins create domain panels from the control room — they will show up here instantly."
          action={<BoardEmptyCta />}
        />
      )}

      <p className="flex items-center gap-2 pt-2 text-xs text-ink-3">
        <RadioTower className="size-3.5" />
        Updates land as soon as somebody acts — no refresh needed.
      </p>
    </div>
  );
}
