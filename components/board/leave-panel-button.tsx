"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { leavePanel } from "@/lib/actions/panels";

export function LeavePanelButton({
  panelId,
  memberCount,
}: {
  panelId: string;
  memberCount: number;
}) {
  const router = useRouter();
  const { push } = useToast();
  const { executeAsync, isExecuting } = useAction(leavePanel);
  const [open, setOpen] = useState(false);

  const confirmLeave = async () => {
    const result = await executeAsync({ panelId });
    if (result.data) {
      setOpen(false);
      push({ title: "You left the panel", tone: "info" });
      router.push("/board");
      return;
    }
    push({
      title: "Could not leave the panel",
      description: result.serverError?.message ?? "Please try again.",
      tone: "error",
    });
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 px-2.5 text-xs"
        onClick={() => setOpen(true)}
      >
        <LogOut className="size-3.5" />
        Leave panel
      </Button>

      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={confirmLeave}
        loading={isExecuting}
        title="Leave this panel?"
        description={
          memberCount > 1
            ? "You will lose access to this queue until somebody adds you back."
            : "You are the last member on this panel — it will be left without anyone on the roster."
        }
        confirmLabel="Leave panel"
        cancelLabel="Stay"
      />
    </>
  );
}
