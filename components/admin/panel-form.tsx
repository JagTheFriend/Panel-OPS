"use client";

import { UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";
import type { ControlPanel } from "@/components/admin/panels-table";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { createPanel, updatePanel } from "@/lib/actions/panels";
import { cn } from "@/lib/utils";

function PanelFormFields({
  idPrefix,
  defaults,
  nameError,
  descriptionError,
  active,
  onActiveChange,
}: {
  idPrefix: string;
  defaults?: {
    name: string;
    description: string | null;
  };
  nameError?: string;
  descriptionError?: string;
  active?: boolean;
  onActiveChange?: (value: boolean) => void;
}) {
  return (
    <div className="space-y-4">
      <Field
        label="Domain name"
        htmlFor={`${idPrefix}-name`}
        error={nameError}
        hint="Unique across the room — e.g. the hiring domain or team"
      >
        <Input
          id={`${idPrefix}-name`}
          name="name"
          defaultValue={defaults?.name ?? ""}
          placeholder="frontend@example.com"
          minLength={2}
          maxLength={60}
          required
          autoFocus
        />
      </Field>

      <Field
        label="Description"
        htmlFor={`${idPrefix}-description`}
        error={descriptionError}
        hint="Optional — shown on the panel cards"
      >
        <Input
          id={`${idPrefix}-description`}
          name="description"
          defaultValue={defaults?.description ?? ""}
          placeholder="React and Node queues, mixed panels"
          maxLength={300}
        />
      </Field>

      {onActiveChange ? (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-line bg-surface-2/70 px-3.5 py-3">
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-ink">Panel active</p>
            <p className="mt-0.5 text-xs text-ink-3">
              Inactive panels stay in the control room but disappear from the
              directory and board.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={Boolean(active)}
            aria-label="Panel active"
            onClick={() => onActiveChange(!active)}
            className={cn(
              "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
              active ? "bg-brand" : "bg-line-strong",
            )}
          >
            <span
              className={cn(
                "size-5 rounded-full bg-white shadow-card transition-transform",
                active ? "translate-x-5.5" : "translate-x-0.5",
              )}
            />
          </button>
        </div>
      ) : null}
    </div>
  );
}

function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="rounded-lg border border-danger/25 bg-danger-soft px-3 py-2 text-sm text-danger-ink"
    >
      {message}
    </p>
  );
}

export function CreatePanelModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { push } = useToast();
  const { execute, isExecuting, result, reset } = useAction(createPanel, {
    onSuccess: () => {
      push({
        title: "Panel created",
        description: "It is live in the directory and on the board.",
        tone: "success",
      });
      onClose();
      router.refresh();
    },
  });

  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  const nameError = result?.validationErrors?.name?._errors?.[0];
  const descriptionError = result?.validationErrors?.description?._errors?.[0];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New panel"
      description="Panels show up in the directory the moment they are created."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isExecuting}>
            Cancel
          </Button>
          <Button type="submit" form="create-panel-form" loading={isExecuting}>
            Create panel
          </Button>
        </>
      }
    >
      <form
        id="create-panel-form"
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          execute({
            name: String(form.get("name") ?? ""),
            description: String(form.get("description") ?? "") || undefined,
          });
        }}
      >
        <PanelFormFields
          idPrefix="create"
          nameError={nameError}
          descriptionError={descriptionError}
        />

        <FormError message={result?.serverError?.message} />

        <p className="flex items-center gap-2 text-xs text-ink-3">
          <UserPlus className="size-3.5" />
          You are automatically joined to panels you create.
        </p>
      </form>
    </Modal>
  );
}

export function EditPanelModal({
  open,
  panel,
  onClose,
}: {
  open: boolean;
  panel: ControlPanel | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [activeDraft, setActiveDraft] = useState<{
    id: string;
    value: boolean;
  } | null>(null);

  const { execute, isExecuting, result, reset } = useAction(updatePanel, {
    onSuccess: () => {
      push({
        title: "Panel updated",
        description: panel ? `“${panel.name}” saved.` : undefined,
        tone: "success",
      });
      onClose();
      router.refresh();
    },
  });

  useEffect(() => {
    if (open) {
      reset();
      setActiveDraft(null);
    }
  }, [open, reset]);

  const isActive =
    panel && activeDraft?.id === panel.id
      ? activeDraft.value
      : (panel?.isActive ?? true);

  const nameError = result?.validationErrors?.name?._errors?.[0];
  const descriptionError = result?.validationErrors?.description?._errors?.[0];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={panel ? `Edit “${panel.name}”` : "Edit panel"}
      description="Membership is managed from the Members control in the panel row."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isExecuting}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="edit-panel-form"
            loading={isExecuting}
            disabled={isExecuting || !panel}
          >
            Save changes
          </Button>
        </>
      }
    >
      <form
        id="edit-panel-form"
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!panel) return;
          const form = new FormData(event.currentTarget);
          execute({
            id: panel.id,
            name: String(form.get("name") ?? ""),
            description: String(form.get("description") ?? "") || undefined,
            isActive,
          });
        }}
      >
        <PanelFormFields
          idPrefix="edit"
          defaults={
            panel
              ? {
                  name: panel.name,
                  description: panel.description,
                }
              : undefined
          }
          nameError={nameError}
          descriptionError={descriptionError}
          active={isActive}
          onActiveChange={
            panel
              ? (value) => setActiveDraft({ id: panel.id, value })
              : undefined
          }
        />

        <FormError message={result?.serverError?.message} />
      </form>
    </Modal>
  );
}
