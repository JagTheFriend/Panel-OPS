"use client";

import { UserMinus, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import type { ControlPanel } from "@/components/admin/panels-table";
import { RelativeTime } from "@/components/board/relative-time";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { removePanelMember } from "@/lib/actions/panels";

type PanelMember = ControlPanel["members"][number];

export function PanelMembers({ panel }: { panel: ControlPanel }) {
  const router = useRouter();
  const { push } = useToast();
  const [target, setTarget] = useState<PanelMember | null>(null);

  const remove = useAction(removePanelMember, {
    onSuccess: ({ input }) => {
      const member = panel.members.find((m) => m.userId === input.userId);
      setTarget(null);
      push({
        title: "Member removed",
        description: member
          ? `${member.name ?? member.email} no longer staffs ${panel.name}.`
          : undefined,
        tone: "success",
      });
      router.refresh();
    },
    onError: ({ error }) => {
      setTarget(null);
      push({
        title: "Could not remove member",
        description: error.serverError?.message,
        tone: "error",
      });
    },
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] font-semibold text-ink">
          Members ({panel.members.length})
        </p>
        <p className="flex items-center gap-1.5 text-xs text-ink-3">
          <UserPlus className="size-3.5" />
          Admins are automatically joined when they create a panel.
        </p>
      </div>

      {panel.members.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line-strong px-3.5 py-4 text-center text-sm text-ink-3">
          No members yet — join from the panels directory.
        </p>
      ) : (
        <ul className="space-y-2">
          {panel.members.map((member) => (
            <li
              key={member.userId}
              className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-line bg-surface px-3.5 py-2.5"
            >
              <span className="max-w-[12rem] truncate font-mono text-[13px] font-semibold text-ink">
                {member.email}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-ink-2">
                {member.name ?? "—"}
              </span>
              {member.isCreator ? <Badge tone="brand">Creator</Badge> : null}
              <span className="text-xs text-ink-3">
                Joined <RelativeTime at={new Date(member.joinedAt)} />
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="text-danger-ink hover:bg-danger-soft"
                onClick={() => setTarget(member)}
                aria-label={`Remove ${member.name ?? member.email} from ${panel.name}`}
              >
                <UserMinus className="size-3.5" />
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={target !== null}
        onClose={() => setTarget(null)}
        onConfirm={() => {
          if (target) {
            remove.execute({ panelId: panel.id, userId: target.userId });
          }
        }}
        title={
          target ? `Remove ${target.name ?? target.email}?` : "Remove member"
        }
        description={
          target
            ? `${target.name ?? target.email} will lose access to ${panel.name}. They can rejoin from the directory at any time.`
            : undefined
        }
        confirmLabel="Remove member"
        loading={remove.isExecuting}
      />
    </div>
  );
}
