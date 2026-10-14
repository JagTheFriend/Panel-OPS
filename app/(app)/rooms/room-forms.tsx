"use client";

import { ArrowRight, Plus } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { createRoom, joinRoomByPin } from "@/lib/actions/rooms";

function FormError({ message }: { message: string | undefined }) {
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

export function CreateRoomForm() {
  const { execute, isExecuting, result } = useAction(createRoom);

  const nameError = result?.validationErrors?.name?._errors?.[0];
  const adminPinError = result?.validationErrors?.adminPin?._errors?.[0];
  const normalPinError = result?.validationErrors?.normalPin?._errors?.[0];
  const serverError = result?.serverError?.message;

  return (
    <form
      className="space-y-4 rounded-2xl border border-line bg-surface p-5 shadow-card"
      onSubmit={(event) => {
        event.preventDefault();
        if (isExecuting) return;
        const form = new FormData(event.currentTarget);
        execute({
          name: String(form.get("name") ?? "").trim(),
          adminPin: String(form.get("adminPin") ?? ""),
          normalPin: String(form.get("normalPin") ?? ""),
        });
      }}
    >
      <div>
        <h2 className="text-base font-semibold tracking-tight">
          Create a room
        </h2>
        <p className="mt-0.5 text-xs text-ink-3">
          You become its admin — set two PINs others join with.
        </p>
      </div>

      <Field label="Room name" htmlFor="roomName" error={nameError}>
        <Input
          id="roomName"
          name="name"
          placeholder="Tech Symposium 2026"
          maxLength={60}
          required
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="Admin PIN"
          htmlFor="adminPin"
          hint="Full control"
          error={adminPinError}
        >
          <Input
            id="adminPin"
            name="adminPin"
            type="password"
            inputMode="numeric"
            placeholder="••••"
            className="tracking-[0.3em]"
            minLength={4}
            maxLength={12}
            required
          />
        </Field>
        <Field
          label="Normal PIN"
          htmlFor="normalPin"
          hint="Regular members"
          error={normalPinError}
        >
          <Input
            id="normalPin"
            name="normalPin"
            type="password"
            inputMode="numeric"
            placeholder="••••"
            className="tracking-[0.3em]"
            minLength={4}
            maxLength={12}
            required
          />
        </Field>
      </div>

      <FormError message={serverError} />

      <Button type="submit" className="w-full" loading={isExecuting}>
        <Plus className="size-4" />
        {isExecuting ? "Creating…" : "Create room"}
      </Button>
    </form>
  );
}

export function JoinRoomForm() {
  const { execute, isExecuting, result } = useAction(joinRoomByPin);

  const codeError = result?.validationErrors?.code?._errors?.[0];
  const pinError = result?.validationErrors?.pin?._errors?.[0];
  const serverError = result?.serverError?.message;

  return (
    <form
      className="space-y-4 rounded-2xl border border-line bg-surface p-5 shadow-card"
      onSubmit={(event) => {
        event.preventDefault();
        if (isExecuting) return;
        const form = new FormData(event.currentTarget);
        execute({
          code: String(form.get("code") ?? "").trim(),
          pin: String(form.get("pin") ?? ""),
        });
      }}
    >
      <div>
        <h2 className="text-base font-semibold tracking-tight">Join a room</h2>
        <p className="mt-0.5 text-xs text-ink-3">
          Enter the room code with the PIN you were given.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Room code" htmlFor="joinCode" error={codeError}>
          <Input
            id="joinCode"
            name="code"
            placeholder="AB3K9Z"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            maxLength={12}
            required
          />
        </Field>
        <Field label="PIN" htmlFor="joinPin" error={pinError}>
          <Input
            id="joinPin"
            name="pin"
            type="password"
            inputMode="numeric"
            placeholder="••••"
            className="tracking-[0.3em]"
            autoComplete="off"
            minLength={4}
            maxLength={12}
            required
          />
        </Field>
      </div>

      <FormError message={serverError} />

      <Button type="submit" className="w-full" loading={isExecuting}>
        {isExecuting ? "Joining…" : "Join room"}
        <ArrowRight className="size-4" />
      </Button>
    </form>
  );
}
