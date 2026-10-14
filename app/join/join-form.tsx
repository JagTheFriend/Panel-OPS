"use client";

import { ArrowRight, Lock } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { joinRoom } from "@/lib/actions/auth";

type JoinPanelOption = { id: string; name: string; description: string | null };

export function JoinForm({ panels }: { panels: JoinPanelOption[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showDomains, setShowDomains] = useState(true);

  const { execute, isExecuting, result } = useAction(joinRoom);

  const rollNoError = result?.validationErrors?.rollNo?._errors?.[0];
  const nameError = result?.validationErrors?.name?._errors?.[0];
  const pinError = result?.validationErrors?.pin?._errors?.[0];
  const domainsField = result?.validationErrors?.panelIds as
    | { _errors?: string[] }
    | undefined;
  const domainsError = domainsField?._errors?.[0];
  const serverError = result?.serverError?.message;
  const domainsMissing = panels.length > 0 && selected.size === 0;

  const toggle = (id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (isExecuting) return;
        const form = new FormData(event.currentTarget);
        execute({
          rollNo: String(form.get("rollNo") ?? "").trim(),
          name: String(form.get("name") ?? "").trim(),
          pin: String(form.get("pin") ?? ""),
          panelIds: Array.from(selected),
        });
      }}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Roll number" htmlFor="rollNo" error={rollNoError}>
          <Input
            id="rollNo"
            name="rollNo"
            placeholder="210042"
            autoComplete="username"
            autoCapitalize="none"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={20}
            spellCheck={false}
            required
            autoFocus
            onChange={(event) => {
              event.target.value = event.target.value.replace(/\D+/g, "");
            }}
          />
        </Field>
        <Field
          label="Name"
          htmlFor="name"
          hint="Shown to coordinators on the board"
          error={nameError}
        >
          <Input
            id="name"
            name="name"
            placeholder="Diya Patel"
            autoComplete="name"
            required
          />
        </Field>
      </div>

      <Field
        label="Room PIN"
        htmlFor="pin"
        error={pinError}
        hint="Shared PIN given by the room coordinator"
      >
        <div className="relative">
          <Lock className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-3" />
          <Input
            id="pin"
            name="pin"
            type="password"
            inputMode="numeric"
            placeholder="••••"
            className="pl-10 tracking-[0.35em]"
            autoComplete="current-password"
            required
          />
        </div>
      </Field>

      {panels.length > 0 ? (
        <div className="rounded-xl border border-line bg-surface-2/60 p-3.5">
          <button
            type="button"
            onClick={() => setShowDomains((value) => !value)}
            className="flex w-full items-center justify-between text-left text-[13px] font-medium text-ink-2"
          >
            <span>
              Domains you are joining{" "}
              <span className="text-ink-3">
                ({selected.size} selected
                {selected.size === 0 ? " — pick at least one" : ""})
              </span>
            </span>
            <span className="text-ink-3">{showDomains ? "−" : "+"}</span>
          </button>

          {domainsError ? (
            <p
              role="alert"
              className="mt-2 rounded-lg border border-danger/25 bg-danger-soft px-3 py-2 text-sm text-danger-ink"
            >
              {domainsError}
            </p>
          ) : null}

          {showDomains ? (
            <div className="mt-3 grid max-h-52 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
              {panels.map((panel) => {
                const checked = selected.has(panel.id);
                return (
                  <label
                    key={panel.id}
                    className={
                      "flex cursor-pointer items-start gap-2.5 rounded-lg border p-2.5 transition-colors " +
                      (checked
                        ? "border-brand/40 bg-brand-soft"
                        : "border-line bg-surface hover:border-line-strong")
                    }
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 accent-[var(--color-brand)]"
                      checked={checked}
                      onChange={() => toggle(panel.id)}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-medium text-ink">
                        {panel.name}
                      </span>
                      {panel.description ? (
                        <span className="block truncate text-xs text-ink-3">
                          {panel.description}
                        </span>
                      ) : null}
                    </span>
                  </label>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}

      {serverError ? (
        <p
          role="alert"
          className="rounded-lg border border-danger/25 bg-danger-soft px-3 py-2 text-sm text-danger-ink"
        >
          {serverError}
        </p>
      ) : null}

      <Button
        type="submit"
        size="lg"
        className="w-full"
        loading={isExecuting}
        disabled={isExecuting || domainsMissing}
      >
        {isExecuting ? (
          "Joining…"
        ) : (
          <>
            Enter the room
            <ArrowRight className="size-4" />
          </>
        )}
      </Button>
    </form>
  );
}
