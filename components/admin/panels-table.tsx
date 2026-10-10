"use client";

import { ChevronRight, Pencil, Plus, Trash2, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { Fragment, useState } from "react";
import {
  CreatePanelModal,
  EditPanelModal,
} from "@/components/admin/panel-form";
import { PanelMembers } from "@/components/admin/panel-members";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { deletePanel } from "@/lib/actions/panels";
import { cn } from "@/lib/utils";

export type ControlPanel = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdById: string;
  createdByRollNo: string;
  queueCount: number;
  members: {
    userId: string;
    rollNo: string;
    name: string | null;
    role: "ADMIN" | "USER";
    joinedAt: string;
    isCreator: boolean;
  }[];
};

const headings = [
  { label: "Panel", className: "px-4 py-2.5 text-left" },
  { label: "Members", className: "px-3 py-2.5 text-left" },
  { label: "Queue", className: "hidden px-3 py-2.5 text-right lg:table-cell" },
  {
    label: "Created by",
    className: "hidden px-3 py-2.5 text-left lg:table-cell",
  },
  { label: "Actions", className: "px-4 py-2.5 text-right" },
] as const;

export function PanelsControl({ panels }: { panels: ControlPanel[] }) {
  const router = useRouter();
  const { push } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<ControlPanel | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ControlPanel | null>(null);

  const remove = useAction(deletePanel, {
    onSuccess: ({ input }) => {
      const deleted = panels.find((panel) => panel.id === input.panelId);
      setDeleteTarget(null);
      push({
        title: "Panel deleted",
        description: deleted
          ? `“${deleted.name}” and its queue were removed.`
          : undefined,
        tone: "success",
      });
      router.refresh();
    },
    onError: ({ error }) => {
      setDeleteTarget(null);
      push({
        title: "Could not delete panel",
        description: error.serverError?.message,
        tone: "error",
      });
    },
  });

  if (panels.length === 0) {
    return (
      <div className="space-y-4">
        <EmptyState
          icon={<Plus className="size-5" />}
          title="No panels yet"
          description="Create the first domain panel to start routing candidates through the queue."
          action={
            <Button onClick={() => setCreateOpen(true)}>New panel</Button>
          }
        />
        <CreatePanelModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
        />
      </div>
    );
  }

  const inactive = panels.filter((panel) => !panel.isActive).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-2">
          <span className="font-semibold text-ink">{panels.length}</span>{" "}
          {panels.length === 1 ? "panel" : "panels"}
          {inactive > 0 ? (
            <>
              {" · "}
              <span className="font-semibold text-ink">{inactive}</span>{" "}
              inactive
            </>
          ) : null}
        </p>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          New panel
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line bg-surface shadow-card">
        <table className="w-full min-w-[21rem] text-sm sm:min-w-[36rem] lg:min-w-[51rem]">
          <thead>
            <tr className="border-b border-line bg-surface-2/70 text-[11px] font-semibold tracking-wider text-ink-3 uppercase">
              {headings.map((heading) => (
                <th
                  key={heading.label}
                  scope="col"
                  className={heading.className}
                >
                  {heading.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {panels.map((panel) => {
              const expanded = expandedId === panel.id;
              return (
                <Fragment key={panel.id}>
                  <tr
                    className={cn(
                      "transition-colors hover:bg-surface-2/60",
                      !panel.isActive && "bg-surface-2/40",
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "min-w-0 line-clamp-2 text-[13px] font-semibold sm:line-clamp-1",
                            panel.isActive ? "text-ink" : "text-ink-2",
                          )}
                        >
                          {panel.name}
                        </span>
                        {!panel.isActive ? (
                          <Badge tone="warning">Inactive</Badge>
                        ) : null}
                      </div>
                      {panel.description ? (
                        <p className="mt-0.5 max-w-md line-clamp-2 text-xs text-ink-3 sm:line-clamp-1">
                          {panel.description}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedId(expanded ? null : panel.id)
                        }
                        aria-expanded={expanded}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-ink-2 transition hover:bg-surface hover:text-ink"
                      >
                        <Users className="size-3.5" />
                        <span className="font-mono tabular-nums">
                          {panel.members.length}
                        </span>
                        <ChevronRight
                          className={cn(
                            "size-3.5 transition-transform",
                            expanded && "rotate-90",
                          )}
                        />
                        <span className="sr-only">members of {panel.name}</span>
                      </button>
                    </td>
                    <td className="hidden px-3 py-3 text-right font-mono text-ink-2 tabular-nums lg:table-cell">
                      {panel.queueCount}
                    </td>
                    <td className="hidden px-3 py-3 font-mono text-xs text-ink-2 lg:table-cell">
                      {panel.createdByRollNo}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditing(panel)}
                          aria-label={`Edit ${panel.name}`}
                        >
                          <Pencil className="size-3.5" />
                          <span className="sr-only sm:not-sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-danger-ink hover:bg-danger-soft"
                          onClick={() => setDeleteTarget(panel)}
                          aria-label={`Delete ${panel.name}`}
                        >
                          <Trash2 className="size-3.5" />
                          <span className="sr-only sm:not-sr-only">Delete</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                  {expanded ? (
                    <tr className="bg-surface-2/40">
                      <td colSpan={headings.length} className="px-4 py-4">
                        <PanelMembers panel={panel} />
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <CreatePanelModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
      <EditPanelModal
        open={editing !== null}
        panel={editing}
        onClose={() => setEditing(null)}
      />
      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            remove.execute({ panelId: deleteTarget.id });
          }
        }}
        title={deleteTarget ? `Delete “${deleteTarget.name}”?` : "Delete panel"}
        description="This permanently removes the queue for this panel — every candidate waiting or in interview at it is deleted too."
        confirmLabel="Delete panel"
        loading={remove.isExecuting}
      />
    </div>
  );
}
