"use client";

import {
  type CollisionDetection,
  closestCorners,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CheckCircle2, Clock3, GripVertical, Mic } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useCallback, useMemo, useState } from "react";
import {
  type BoardCandidate,
  CandidateCard,
  type CandidateCardProps,
  SortableCandidateCard,
} from "@/components/board/candidate-card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import {
  removeCandidate,
  reorderCandidates,
  setCandidateStatus,
  updateCandidate,
} from "@/lib/actions/candidates";
import type { CandidateStatus } from "@/lib/logic/candidates";
import { cn } from "@/lib/utils";

type CardHandlers = Pick<
  CandidateCardProps,
  "onStatusChange" | "onRemove" | "onRename"
>;

const COLUMNS = [
  {
    status: "WAITING",
    title: "Waiting",
    icon: Clock3,
    accent: "bg-wait",
    iconTone: "bg-wait-soft text-wait-ink",
    badgeTone: "warning",
    empty: {
      title: "Nobody waiting",
      description: "New check-ins land here as soon as they are added.",
    },
  },
  {
    status: "IN_INTERVIEW",
    title: "In interview",
    icon: Mic,
    accent: "bg-live",
    iconTone: "bg-live-soft text-live-ink",
    badgeTone: "live",
    empty: {
      title: "No interview running",
      description: "Press Start on a waiting candidate to move them live.",
    },
  },
  {
    status: "DONE",
    title: "Done",
    icon: CheckCircle2,
    accent: "bg-finish",
    iconTone: "bg-finish-soft text-finish-ink",
    badgeTone: "brand",
    empty: {
      title: "Nothing finished yet",
      description: "Completed interviews land here with their durations.",
    },
  },
] as const;

function isStatus(value: string): value is CandidateStatus {
  return COLUMNS.some((column) => column.status === value);
}

export function KanbanBoard({
  panelId,
  candidates,
  canRemove = true,
}: {
  panelId: string;
  candidates: BoardCandidate[];
  canRemove?: boolean;
}) {
  const router = useRouter();
  const { push } = useToast();
  const changeStatusAction = useAction(setCandidateStatus);
  const reorderAction = useAction(reorderCandidates);
  const removeAction = useAction(removeCandidate);
  const renameAction = useAction(updateCandidate);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [overStatus, setOverStatus] = useState<CandidateStatus | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const { byId, columns } = useMemo(() => {
    const map = new Map<string, BoardCandidate>();
    const grouped: Record<CandidateStatus, BoardCandidate[]> = {
      WAITING: [],
      IN_INTERVIEW: [],
      DONE: [],
    };
    for (const candidate of candidates) {
      map.set(candidate.id, candidate);
      grouped[candidate.status].push(candidate);
    }
    return { byId: map, columns: grouped };
  }, [candidates]);

  const collisionDetection = useCallback<CollisionDetection>((args) => {
    const pointer = pointerWithin(args);
    return pointer.length > 0 ? pointer : closestCorners(args);
  }, []);

  const fail = (title: string, message?: string) =>
    push({
      title,
      description: message ?? "Please refresh and try again.",
      tone: "error",
    });

  const changeStatus = async (
    candidate: BoardCandidate,
    status: CandidateStatus,
  ) => {
    if (busyId || status === candidate.status) return;
    setBusyId(candidate.id);
    const result = await changeStatusAction.executeAsync({
      id: candidate.id,
      status,
    });
    setBusyId(null);
    if (result.data) {
      router.refresh();
      return;
    }
    fail("Could not update the queue", result.serverError?.message);
  };

  const removeOne = async (candidate: BoardCandidate) => {
    if (busyId) return false;
    setBusyId(candidate.id);
    try {
      const result = await removeAction.executeAsync({ id: candidate.id });
      if (result.data) {
        router.refresh();
        return true;
      }
      fail("Could not remove participant", result.serverError?.message);
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const renameOne = async (candidate: BoardCandidate, name: string) => {
    if (busyId) return false;
    setBusyId(candidate.id);
    try {
      const result = await renameAction.executeAsync({
        id: candidate.id,
        name,
      });
      if (result.data) {
        router.refresh();
        return true;
      }
      fail("Could not update the name", result.serverError?.message);
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const handleDragStart = ({ active }: DragStartEvent) => {
    const id = String(active.id);
    setActiveId(id);
    setOverStatus(byId.get(id)?.status ?? null);
  };

  const handleDragOver = ({ over }: DragOverEvent) => {
    if (!over) {
      setOverStatus(null);
      return;
    }
    const overId = String(over.id);
    const overItem = byId.get(overId);
    setOverStatus(
      overItem ? overItem.status : isStatus(overId) ? overId : null,
    );
  };

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    setOverStatus(null);
    if (!over || busyId) return;

    const draggedId = String(active.id);
    const overId = String(over.id);
    if (draggedId === overId) return;

    const dragged = byId.get(draggedId);
    if (!dragged) return;

    const overItem = byId.get(overId);
    const targetStatus = overItem
      ? overItem.status
      : isStatus(overId)
        ? overId
        : null;
    if (!targetStatus) return;

    setBusyId(draggedId);
    try {
      if (targetStatus === dragged.status) {
        const currentIds = columns[dragged.status].map((item) => item.id);
        const fromIndex = currentIds.indexOf(draggedId);
        const toIndex = currentIds.indexOf(overId);
        if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return;

        const result = await reorderAction.executeAsync({
          panelId,
          orderedIds: arrayMove(currentIds, fromIndex, toIndex),
        });
        if (result.data) {
          router.refresh();
          return;
        }
        fail("Could not reorder the queue", result.serverError?.message);
        return;
      }

      const targetIds = columns[targetStatus].map((item) => item.id);
      const insertAt = targetIds.indexOf(overId);
      const result = await changeStatusAction.executeAsync(
        insertAt >= 0
          ? { id: draggedId, status: targetStatus, index: insertAt }
          : { id: draggedId, status: targetStatus },
      );
      if (result.data) {
        router.refresh();
        return;
      }
      fail("Could not move candidate", result.serverError?.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setOverStatus(null);
  };

  const cardProps: CardHandlers = {
    onStatusChange: changeStatus,
    onRemove: canRemove ? removeOne : undefined,
    onRename: renameOne,
  };

  const activeCandidate = activeId ? byId.get(activeId) : undefined;

  return (
    <section aria-label="Candidate queue" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[15px] font-semibold tracking-tight text-ink">
          Queue
        </h2>
        <p className="flex items-center gap-1.5 text-xs text-ink-3">
          <GripVertical className="size-3.5" />
          Drag cards between columns, or use the buttons on each card
        </p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          <div className="flex gap-4 lg:grid lg:grid-cols-3">
            {COLUMNS.map((column) => (
              <BoardColumn
                key={column.status}
                column={column}
                items={columns[column.status]}
                isTarget={activeId !== null && overStatus === column.status}
                busyId={busyId}
                cardProps={cardProps}
              />
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeCandidate ? (
            <CandidateCard candidate={activeCandidate} overlay />
          ) : null}
        </DragOverlay>
      </DndContext>
    </section>
  );
}

function BoardColumn({
  column,
  items,
  isTarget,
  busyId,
  cardProps,
}: {
  column: (typeof COLUMNS)[number];
  items: BoardCandidate[];
  isTarget: boolean;
  busyId: string | null;
  cardProps: CardHandlers;
}) {
  const { setNodeRef } = useDroppable({
    id: column.status,
    data: { status: column.status },
  });
  const ids = useMemo(() => items.map((item) => item.id), [items]);
  const Icon = column.icon;

  return (
    <section
      className={cn(
        "flex min-w-[19rem] flex-1 flex-col overflow-hidden rounded-2xl border shadow-card transition-colors lg:min-w-0",
        isTarget ? "border-brand/50" : "border-line",
      )}
    >
      <div className={cn("h-1 w-full shrink-0", column.accent)} />

      <header className="flex items-center justify-between gap-2 border-b border-line bg-surface-2/70 px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "flex size-7 items-center justify-center rounded-lg",
              column.iconTone,
            )}
          >
            <Icon className="size-4" />
          </span>
          <h3 className="text-[13px] font-semibold tracking-tight text-ink">
            {column.title}
          </h3>
        </div>
        <Badge tone={column.badgeTone}>{items.length}</Badge>
      </header>

      <div
        ref={setNodeRef}
        className={cn(
          "flex max-h-[70vh] min-h-32 flex-1 flex-col gap-2.5 overflow-y-auto overscroll-contain p-3",
          isTarget && "bg-brand-soft/40",
        )}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <AnimatePresence initial={false}>
            {items.map((candidate) => (
              <motion.div
                key={candidate.id}
                layout="position"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="shrink-0"
              >
                <SortableCandidateCard
                  candidate={candidate}
                  busy={busyId === candidate.id}
                  {...cardProps}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </SortableContext>

        {items.length === 0 ? (
          <EmptyState
            className="my-auto shrink-0 bg-surface-2/50 px-4 py-8"
            icon={<Icon className="size-5" />}
            title={column.empty.title}
            description={column.empty.description}
          />
        ) : null}
      </div>
    </section>
  );
}
