import { PauseCircle } from "lucide-react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { AddCandidateForm } from "@/components/board/add-candidate-form";
import { JoinPanelCta } from "@/components/board/join-panel-cta";
import { KanbanBoard } from "@/components/board/kanban-board";
import { PanelHeader } from "@/components/board/panel-header";
import { EmptyState } from "@/components/ui/empty-state";
import { getCurrentUser } from "@/lib/auth";
import { getPanelBoard, getPanelName } from "@/lib/data/queries";

export const instant = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ panelId: string }>;
}): Promise<Metadata> {
  const { panelId } = await params;
  const name = await getPanelName(panelId);
  return { title: name ? `${name} · Panel board` : "Panel board" };
}

export default async function PanelBoardPage({
  params,
}: {
  params: Promise<{ panelId: string }>;
}) {
  const { panelId } = await params;
  await connection();

  const user = await getCurrentUser();
  if (!user) redirect("/api/session/clear");

  const panel = await getPanelBoard(panelId);
  if (!panel) notFound();

  const isMember = user.role === "ADMIN" || user.panelIds.includes(panel.id);
  if (!isMember) {
    if (!panel.isActive) {
      return (
        <div className="mx-auto w-full max-w-xl animate-fade-up pt-2">
          <EmptyState
            icon={<PauseCircle className="size-5" />}
            title={`${panel.name} is paused`}
            description="This domain is not interviewing right now. Check back with the coordinator."
          />
        </div>
      );
    }

    return (
      <JoinPanelCta
        panel={{
          id: panel.id,
          name: panel.name,
          description: panel.description,
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PanelHeader
        panel={{
          id: panel.id,
          name: panel.name,
          description: panel.description,
          isActive: panel.isActive,
        }}
        members={panel.members}
        stats={panel.stats}
        isAdmin={user.role === "ADMIN"}
      />

      {user.role === "ADMIN" ? (
        <div className="animate-fade-up" style={{ animationDelay: "50ms" }}>
          <AddCandidateForm panelId={panel.id} closed={!panel.isActive} />
        </div>
      ) : null}

      <div className="animate-fade-up" style={{ animationDelay: "100ms" }}>
        <KanbanBoard
          panelId={panel.id}
          candidates={panel.candidates}
          canRemove={user.role === "ADMIN"}
        />
      </div>
    </div>
  );
}
