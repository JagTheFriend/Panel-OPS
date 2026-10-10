"use client";

import { ArrowLeft, DoorOpen } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { joinPanel } from "@/lib/actions/panels";

export function JoinPanelCta({
  panel,
}: {
  panel: { id: string; name: string; description: string | null };
}) {
  const router = useRouter();
  const { push } = useToast();
  const { executeAsync, isExecuting } = useAction(joinPanel);
  const [error, setError] = useState<string | null>(null);

  const join = async () => {
    setError(null);
    const result = await executeAsync({ panelId: panel.id });
    if (result.data) {
      push({ title: `Joined ${panel.name}`, tone: "success" });
      router.refresh();
      return;
    }
    const message =
      result.serverError?.message ?? "Could not join this panel. Try again.";
    setError(message);
    push({
      title: "Could not join this panel",
      description: message,
      tone: "error",
    });
  };

  return (
    <div className="animate-fade-up mx-auto w-full max-w-xl space-y-5 pt-2">
      <Link
        href="/board"
        className="group inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 text-xs font-medium text-ink-2 shadow-card transition hover:border-brand/40 hover:text-brand-ink"
      >
        <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
        All panels
      </Link>

      <Card className="overflow-hidden">
        <div className="flex items-center gap-3 border-b border-line bg-brand-soft/70 px-6 py-5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface text-brand-ink shadow-card">
            <DoorOpen className="size-4.5" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-wider text-brand-ink uppercase">
              Invite only
            </p>
            <h1 className="truncate text-lg font-semibold tracking-tight text-ink">
              {panel.name}
            </h1>
          </div>
        </div>

        <div className="px-6 py-7 text-center">
          <h2 className="text-base font-semibold text-ink">
            You are not a member of this panel
          </h2>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-ink-2">
            Join to see the queue and follow interviews as they happen on the
            room display.
          </p>

          {error ? (
            <p
              role="alert"
              className="mx-auto mt-4 max-w-sm rounded-lg border border-danger/25 bg-danger-soft px-3 py-2 text-sm text-danger-ink"
            >
              {error}
            </p>
          ) : null}

          <div className="mt-6 flex flex-col gap-2.5">
            <Button
              type="button"
              size="lg"
              loading={isExecuting}
              disabled={isExecuting}
              onClick={join}
            >
              {!isExecuting ? <DoorOpen className="size-4" /> : null}
              Join this panel
            </Button>
            <Link
              href="/board"
              className="inline-flex h-9.5 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium text-ink-2 transition-colors hover:text-ink"
            >
              <ArrowLeft className="size-4" />
              Back to the board
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
