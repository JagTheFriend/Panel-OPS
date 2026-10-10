"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowLeft,
  Check,
  Clock,
  Pencil,
  Play,
  RotateCcw,
  Timer,
  Trash2,
} from "lucide-react";
import { type SyntheticEvent, useState } from "react";
import { ElapsedTimer } from "@/components/board/elapsed-timer";
import { RelativeTime } from "@/components/board/relative-time";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field, Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import type { CandidateStatus } from "@/lib/logic/candidates";
import { cn, formatDuration } from "@/lib/utils";

export type BoardCandidate = {
  id: string;
  rollNo: string;
  name: string | null;
  status: CandidateStatus;
  joinedAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
};

export type CandidateCardProps = {
  candidate: BoardCandidate;
  busy?: boolean;
  overlay?: boolean;
  onStatusChange?: (candidate: BoardCandidate, status: CandidateStatus) => void;
  onRemove?: (candidate: BoardCandidate) => Promise<boolean>;
  onRename?: (candidate: BoardCandidate, name: string) => Promise<boolean>;
};

const stopEvent = (event: SyntheticEvent) => {
  event.stopPropagation();
};

export function CandidateCard({
  candidate,
  busy,
  overlay,
  onStatusChange,
  onRemove,
  onRename,
}: CandidateCardProps) {
  const [renaming, setRenaming] = useState(false);
  const [confirmingRemoval, setConfirmingRemoval] = useState(false);
  const [draftName, setDraftName] = useState(candidate.name ?? "");
  const [nameError, setNameError] = useState<string | null>(null);
  const [savingName, setSavingName] = useState(false);
  const [removing, setRemoving] = useState(false);

  const interactive = !overlay;
  const holdActions = busy || !interactive;

  const openRename = () => {
    setDraftName(candidate.name ?? "");
    setNameError(null);
    setRenaming(true);
  };

  const saveName = async () => {
    const trimmed = draftName.trim();
    if (!trimmed) {
      setNameError("Name cannot be empty.");
      return;
    }
    if (!onRename) return;
    setSavingName(true);
    const saved = await onRename(candidate, trimmed);
    setSavingName(false);
    if (saved) setRenaming(false);
  };

  const removeCandidate = async () => {
    if (!onRemove) return;
    setRemoving(true);
    const removed = await onRemove(candidate);
    setRemoving(false);
    if (removed) setConfirmingRemoval(false);
  };

  const duration =
    candidate.startedAt && candidate.completedAt
      ? formatDuration(
          candidate.completedAt.getTime() - candidate.startedAt.getTime(),
        )
      : null;

  const meta = buildMeta(candidate, duration);

  return (
    <div
      className={cn(
        "relative flex flex-col gap-2 rounded-xl border border-line bg-surface p-3 shadow-card transition-shadow hover:shadow-pop",
        overlay && "pointer-events-none shadow-drag",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-mono text-[13px] font-semibold tracking-tight text-ink">
            {candidate.rollNo}
          </p>
          {candidate.name ? (
            <p className="mt-0.5 truncate text-[13px] text-ink-2">
              {candidate.name}
            </p>
          ) : null}
        </div>

        <div className="-mt-1 -mr-1 flex shrink-0 items-center">
          <button
            type="button"
            aria-label={`Edit name for ${candidate.rollNo}`}
            disabled={!interactive}
            onClick={(event) => {
              event.stopPropagation();
              openRename();
            }}
            onPointerDown={stopEvent}
            onKeyDown={stopEvent}
            className={cn(
              "flex size-7 items-center justify-center rounded-lg text-ink-3 transition hover:bg-surface-2 hover:text-ink disabled:opacity-45",
              overlay && "disabled:opacity-100",
            )}
          >
            <Pencil className="size-3.5" />
          </button>
          {onRemove ? (
            <button
              type="button"
              aria-label={`Remove ${candidate.rollNo}`}
              disabled={!interactive}
              onClick={(event) => {
                event.stopPropagation();
                setConfirmingRemoval(true);
              }}
              onPointerDown={stopEvent}
              onKeyDown={stopEvent}
              className={cn(
                "flex size-7 items-center justify-center rounded-lg text-ink-3 transition hover:bg-danger-soft hover:text-danger-ink disabled:opacity-45",
                overlay && "disabled:opacity-100",
              )}
            >
              <Trash2 className="size-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      {meta ? (
        <div className="flex flex-wrap items-center gap-1.5">{meta}</div>
      ) : null}

      <div className="mt-0.5 flex items-center gap-2">
        {candidate.status === "WAITING" ? (
          <Button
            type="button"
            variant="primary"
            size="sm"
            className={cn("flex-1", overlay && "disabled:opacity-100")}
            loading={busy}
            disabled={holdActions}
            onPointerDown={stopEvent}
            onKeyDown={stopEvent}
            onClick={(event) => {
              event.stopPropagation();
              onStatusChange?.(candidate, "IN_INTERVIEW");
            }}
          >
            {!busy ? <Play className="size-3.5" /> : null}
            Start
          </Button>
        ) : null}

        {candidate.status === "IN_INTERVIEW" ? (
          <>
            <Button
              type="button"
              variant="success"
              size="sm"
              className={cn("flex-1", overlay && "disabled:opacity-100")}
              loading={busy}
              disabled={holdActions}
              onPointerDown={stopEvent}
              onKeyDown={stopEvent}
              onClick={(event) => {
                event.stopPropagation();
                onStatusChange?.(candidate, "DONE");
              }}
            >
              {!busy ? <Check className="size-3.5" /> : null}
              Done
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className={cn("shrink-0 px-2", overlay && "disabled:opacity-100")}
              aria-label="Send back to waiting"
              title="Back to waiting"
              disabled={holdActions}
              onPointerDown={stopEvent}
              onKeyDown={stopEvent}
              onClick={(event) => {
                event.stopPropagation();
                onStatusChange?.(candidate, "WAITING");
              }}
            >
              <ArrowLeft className="size-3.5" />
            </Button>
          </>
        ) : null}

        {candidate.status === "DONE" ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className={cn("flex-1", overlay && "disabled:opacity-100")}
            loading={busy}
            disabled={holdActions}
            onPointerDown={stopEvent}
            onKeyDown={stopEvent}
            onClick={(event) => {
              event.stopPropagation();
              onStatusChange?.(candidate, "WAITING");
            }}
          >
            {!busy ? <RotateCcw className="size-3.5" /> : null}
            Reopen
          </Button>
        ) : null}
      </div>

      {interactive ? (
        <Modal
          open={renaming}
          onClose={() => setRenaming(false)}
          title="Edit participant"
          description={`Update the name shown on ${candidate.rollNo}'s card.`}
          className="max-w-md"
          footer={
            <>
              <Button
                type="button"
                variant="secondary"
                disabled={savingName}
                onClick={() => setRenaming(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                loading={savingName}
                disabled={savingName || !draftName.trim()}
                onClick={saveName}
              >
                Save name
              </Button>
            </>
          }
        >
          <Field
            label="Name"
            htmlFor={`rename-${candidate.id}`}
            error={nameError}
          >
            <Input
              id={`rename-${candidate.id}`}
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              placeholder="Full name"
              maxLength={60}
              autoFocus
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  saveName();
                }
              }}
            />
          </Field>
        </Modal>
      ) : null}

      {interactive ? (
        <ConfirmDialog
          open={confirmingRemoval}
          onClose={() => setConfirmingRemoval(false)}
          onConfirm={removeCandidate}
          loading={removing}
          title="Remove participant?"
          description={`${candidate.rollNo} will be taken out of this panel's queue. This cannot be undone.`}
          confirmLabel="Remove"
          cancelLabel="Keep"
        />
      ) : null}
    </div>
  );
}

function buildMeta(candidate: BoardCandidate, duration: string | null) {
  if (candidate.status === "WAITING") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-ink-3">
        <Clock className="size-3.5" />
        Joined <RelativeTime at={candidate.joinedAt} />
      </span>
    );
  }

  if (candidate.status === "IN_INTERVIEW") {
    return (
      <>
        {candidate.startedAt ? (
          <Badge tone="live" title="Interview elapsed time">
            <Timer className="size-3" />
            <ElapsedTimer startedAt={candidate.startedAt} />
          </Badge>
        ) : null}
      </>
    );
  }

  if (duration) {
    return (
      <Badge tone="brand">
        <Timer className="size-3" />
        {duration} interview
      </Badge>
    );
  }

  if (candidate.completedAt) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-ink-3">
        <Check className="size-3.5" />
        Finished <RelativeTime at={candidate.completedAt} />
      </span>
    );
  }

  return null;
}

export function SortableCandidateCard(props: CandidateCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: props.candidate.id,
    data: { status: props.candidate.status },
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(isDragging && "opacity-40")}
      {...attributes}
      {...listeners}
    >
      <CandidateCard {...props} />
    </div>
  );
}
