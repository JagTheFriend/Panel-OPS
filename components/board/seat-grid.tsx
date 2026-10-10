import { LayoutGrid } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

export function SeatGrid({
  seatCount,
  occupants,
  freeSeats,
}: {
  seatCount: number;
  occupants: { seat: number; rollNo: string }[];
  freeSeats: number;
}) {
  const bySeat = new Map(
    occupants.map((occupant) => [occupant.seat, occupant.rollNo]),
  );

  return (
    <Card className="self-start p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-live-soft text-live-ink">
            <LayoutGrid className="size-4.5" />
          </span>
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight text-ink">
              Stations
            </h2>
            <p className="text-xs text-ink-3">
              {seatCount} {seatCount === 1 ? "booth" : "booths"} on this panel
            </p>
          </div>
        </div>
        <Badge
          tone={freeSeats === 0 ? "danger" : "live"}
          dot
          className="px-2.5 py-1"
        >
          {freeSeats}/{seatCount} free
        </Badge>
      </div>

      <div
        role="img"
        aria-label={`${freeSeats} of ${seatCount} stations free`}
        className="mt-4 flex flex-wrap gap-2"
      >
        {Array.from({ length: seatCount }, (_, index) => index + 1).map(
          (seat) => {
            const rollNo = bySeat.get(seat);
            return (
              <span
                key={seat}
                title={
                  rollNo
                    ? `Station ${seat} — interviewing ${rollNo}`
                    : `Station ${seat} — free`
                }
                className={cn(
                  "inline-flex h-9 min-w-20 max-w-full items-center gap-1.5 rounded-lg border px-2.5 font-mono text-xs shadow-card",
                  rollNo
                    ? "border-live bg-live text-white"
                    : "border-line-strong bg-surface text-ink-3",
                )}
              >
                <span
                  className={cn(
                    "shrink-0 tabular-nums",
                    rollNo && "text-white/70",
                  )}
                >
                  {seat}
                </span>
                {rollNo ? (
                  <span className="truncate font-semibold">{rollNo}</span>
                ) : (
                  <span className="truncate text-ink-3">free</span>
                )}
              </span>
            );
          },
        )}
      </div>
    </Card>
  );
}
