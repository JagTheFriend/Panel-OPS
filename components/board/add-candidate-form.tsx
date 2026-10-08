"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { type FormEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/empty-state";
import { Field, Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { addCandidate } from "@/lib/actions/candidates";

export function AddCandidateForm({
  panelId,
  closed,
}: {
  panelId: string;
  closed?: boolean;
}) {
  const router = useRouter();
  const { push } = useToast();
  const { executeAsync, isExecuting } = useAction(addCandidate);
  const rollRef = useRef<HTMLInputElement>(null);

  const [rollNo, setRollNo] = useState("");
  const [name, setName] = useState("");
  const [rollError, setRollError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isExecuting || closed) return;

    setRollError(null);
    setFormError(null);

    const candidateRoll = rollNo.trim();
    const candidateName = name.trim();
    const result = await executeAsync({
      panelId,
      rollNo: candidateRoll,
      name: candidateName || undefined,
    });

    if (result.data) {
      setRollNo("");
      setName("");
      push({ title: `${candidateRoll} joined the queue`, tone: "success" });
      router.refresh();
      rollRef.current?.focus();
      return;
    }

    const validationMessage =
      result.validationErrors?.rollNo?._errors?.[0] ??
      result.validationErrors?.name?._errors?.[0] ??
      result.validationErrors?.panelId?._errors?.[0];
    const message =
      validationMessage ??
      result.serverError?.message ??
      "Could not add this participant.";

    if (result.validationErrors) {
      setRollError(message);
    } else {
      setFormError(message);
    }
    push({
      title: "Could not add participant",
      description: message,
      tone: "error",
    });
  };

  return (
    <Card className="flex h-full flex-col border-brand/20 p-5">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-ink">
          <Plus className="size-4.5" />
        </span>
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight text-ink">
            Add participant
          </h2>
          <p className="text-xs text-ink-3">
            {closed
              ? "This panel is paused for new check-ins."
              : "Queue somebody for the next free slot."}
          </p>
        </div>
      </div>

      <form className="mt-4 flex flex-1 flex-col gap-3.5" onSubmit={onSubmit}>
        <Field label="Roll number" htmlFor="candidate-roll" error={rollError}>
          <Input
            ref={rollRef}
            id="candidate-roll"
            name="rollNo"
            placeholder="21CS0042"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            value={rollNo}
            onChange={(event) => setRollNo(event.target.value)}
            disabled={closed || isExecuting}
            maxLength={20}
            required
          />
        </Field>

        <Field
          label="Name"
          htmlFor="candidate-name"
          hint="Optional — shown on their card"
        >
          <Input
            id="candidate-name"
            name="name"
            placeholder="Diya Patel"
            autoComplete="off"
            maxLength={60}
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={closed || isExecuting}
          />
        </Field>

        {formError ? (
          <p
            role="alert"
            className="rounded-lg border border-danger/25 bg-danger-soft px-3 py-2 text-xs font-medium text-danger-ink"
          >
            {formError}
          </p>
        ) : null}

        <Button
          type="submit"
          size="lg"
          className="mt-auto h-10 w-full"
          loading={isExecuting}
          disabled={closed || isExecuting}
        >
          {!isExecuting ? <Plus className="size-4" /> : null}
          {isExecuting ? "Adding…" : "Add to queue"}
        </Button>
      </form>
    </Card>
  );
}
