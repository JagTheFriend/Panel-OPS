"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { joinPanel, leavePanel } from "@/lib/actions/panels";
import { cn } from "@/lib/utils";

export type DirectoryPanel = {
  id: string;
  name: string;
  description: string | null;
  queueCount: number;
  joined: boolean;
};

const actionBase =
  "inline-flex h-9.5 select-none items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition-all duration-150 active:scale-[0.98]";

function PanelStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-surface-2/70 px-2 py-2 text-center">
      <p className="font-mono text-lg leading-tight font-semibold tracking-tight text-ink tabular-nums">
        {value}
      </p>
      <p className="mt-0.5 text-[10px] font-semibold tracking-wider text-ink-3 uppercase">
        {label}
      </p>
    </div>
  );
}

export function DirectoryPanelCard({
  panel,
  roomId,
}: {
  panel: DirectoryPanel;
  roomId: string;
}) {
  const router = useRouter();
  const { push } = useToast();

  const join = useAction(joinPanel, {
    onSuccess: () => {
      push({
        title: "Panel joined",
        description: `${panel.name} now appears on your board.`,
        tone: "success",
      });
      router.refresh();
    },
    onError: ({ error }) => {
      push({
        title: "Could not join panel",
        description: error.serverError?.message,
        tone: "error",
      });
    },
  });

  const leave = useAction(leavePanel, {
    onSuccess: () => {
      push({
        title: "Panel left",
        description: `You are no longer staffing ${panel.name}.`,
        tone: "success",
      });
      router.refresh();
    },
    onError: ({ error }) => {
      push({
        title: "Could not leave panel",
        description: error.serverError?.message,
        tone: "error",
      });
    },
  });

  return (
    <Card className="flex h-full flex-col gap-4 p-5 transition-shadow hover:shadow-pop">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-[15px] font-semibold tracking-tight text-ink">
            {panel.name}
          </h3>
          {panel.joined ? <Badge tone="brand">Joined</Badge> : null}
        </div>
        {panel.description ? (
          <p className="mt-1 line-clamp-2 text-[13px] text-ink-2">
            {panel.description}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-line bg-line">
        <PanelStat label="In queue" value={panel.queueCount} />
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-2">
        {panel.joined ? (
          <>
            <Link
              href={`/rooms/${roomId}/board/${panel.id}`}
              className={cn(
                actionBase,
                "bg-brand text-white shadow-sm hover:bg-brand-hover",
              )}
            >
              <ArrowUpRight className="size-4" />
              Open board
            </Link>
            <Button
              variant="ghost"
              loading={leave.isExecuting}
              onClick={() => leave.execute({ roomId, panelId: panel.id })}
            >
              Leave
            </Button>
          </>
        ) : (
          <>
            <Button
              loading={join.isExecuting}
              onClick={() => join.execute({ roomId, panelId: panel.id })}
            >
              Join
            </Button>
            <Link
              href={`/rooms/${roomId}/board/${panel.id}`}
              className={cn(
                actionBase,
                "border border-line-strong bg-surface text-ink shadow-card hover:bg-surface-2",
              )}
            >
              View board
            </Link>
          </>
        )}
      </div>
    </Card>
  );
}
