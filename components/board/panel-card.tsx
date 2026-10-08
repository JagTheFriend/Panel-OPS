import { ArrowUpRight, DoorOpen, Users } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

export type BoardPanel = {
  id: string;
  name: string;
  description: string | null;
  seatCount: number;
  memberCount: number;
  joined: boolean;
  waiting: number;
  interviewing: number;
  done: number;
  occupied: number;
  freeSeats: number;
};

function SeatStrip({
  occupied,
  seatCount,
}: {
  occupied: number;
  seatCount: number;
}) {
  return (
    <div
      role="img"
      className="flex flex-wrap gap-1.5"
      aria-label={`${occupied} of ${seatCount} stations occupied`}
    >
      {Array.from({ length: seatCount }, (_, i) => i + 1).map((seat) => {
        const isTaken = seat <= occupied;
        return (
          <span
            key={seat}
            title={
              isTaken ? `Station ${seat} — occupied` : `Station ${seat} — free`
            }
            className={cn(
              "size-3.5 rounded-[5px] border transition-colors",
              isTaken
                ? "border-live/60 bg-live"
                : "border-line-strong bg-surface",
            )}
          />
        );
      })}
    </div>
  );
}

export function PanelCard({ panel }: { panel: BoardPanel }) {
  const occupancy =
    panel.seatCount > 0
      ? Math.round((panel.occupied / panel.seatCount) * 100)
      : 0;

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

      <div className="flex items-center justify-between gap-3">
        <SeatStrip occupied={panel.occupied} seatCount={panel.seatCount} />
        <span className="shrink-0 font-mono text-xs font-medium text-ink-2">
          {panel.freeSeats}/{panel.seatCount} free
        </span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            occupancy >= 100
              ? "bg-danger"
              : occupancy >= 66
                ? "bg-wait"
                : "bg-live",
          )}
          style={{
            width: `${Math.max(occupancy, panel.occupied > 0 ? 6 : 0)}%`,
          }}
        />
      </div>

      <div className="mt-auto flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone="warning" dot>
            {panel.waiting} waiting
          </Badge>
          <Badge tone="live" dot>
            {panel.interviewing} live
          </Badge>
          <Badge tone="brand">{panel.done} done</Badge>
        </div>
        <span className="inline-flex items-center gap-1 text-xs text-ink-3">
          <Users className="size-3.5" />
          {panel.memberCount}
        </span>
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
