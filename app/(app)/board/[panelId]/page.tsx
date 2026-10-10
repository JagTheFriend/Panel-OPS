import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { AddCandidateForm } from "@/components/board/add-candidate-form";
import { JoinPanelCta } from "@/components/board/join-panel-cta";
import { KanbanBoard } from "@/components/board/kanban-board";
import { PanelHeader } from "@/components/board/panel-header";
import { getCurrentUser } from "@/lib/auth";
import { getPanelBoard } from "@/lib/data/queries";

export const metadata = { title: "Panel board" };
export const instant = false;

export default async function PanelBoardPage({
  params,
}: {
  params: Promise<{ panelId: string }>;
}) {
  const { panelId } = await params;
  await connection();
  const [panel, user] = await Promise.all([
    getPanelBoard(panelId),
    getCurrentUser(),
  ]);

  if (!panel) notFound();
  if (!user) redirect("/join");

  const isMember = user.role === "ADMIN" || user.panelIds.includes(panel.id);
  if (!isMember) {
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
