import { ArrowUpRight, DoorOpen } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/empty-state";

export type BoardPanel = {
  id: string;
  name: string;
  description: string | null;
  joined: boolean;
  waiting: number;
  interviewing: number;
  done: number;
};

export function PanelCard({ panel }: { panel: BoardPanel }) {
  return (
    <Card className="group relative flex flex-col gap-4 p-5 transition-shadow hover:shadow-pop">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-[15px] font-semibold tracking-tight text-ink">
              {panel.name}
            </h3>
            {panel.joined ? <Badge tone="brand">Joined</Badge> : null}
          </div>
          {panel.description ? (
            <p className="mt-0.5 line-clamp-2 text-[13px] text-ink-2">
              {panel.description}
            </p>
          ) : null}
        </div>
        <Link
          href={`/board/${panel.id}`}
          aria-label={`Open ${panel.name} board`}
          className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-line bg-surface text-ink-3 transition group-hover:border-brand/40 group-hover:bg-brand-soft group-hover:text-brand-ink"
        >
          <ArrowUpRight className="size-4" />
        </Link>
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-1.5">
        <Badge tone="warning" dot>
          {panel.waiting} waiting
        </Badge>
        <Badge tone="live" dot>
          {panel.interviewing} live
        </Badge>
        <Badge tone="brand">{panel.done} done</Badge>
      </div>

      <Link
        href={`/board/${panel.id}`}
        className="absolute inset-0 rounded-2xl"
        aria-hidden="true"
        tabIndex={-1}
      />
    </Card>
  );
}

export function BoardEmptyCta() {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-ink-2">
      <DoorOpen className="size-4" />
      Panels created by admins appear here automatically.
    </span>
  );
}
