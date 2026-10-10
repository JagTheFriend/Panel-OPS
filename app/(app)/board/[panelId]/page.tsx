import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { AddCandidateForm } from "@/components/board/add-candidate-form";
import { JoinPanelCta } from "@/components/board/join-panel-cta";
import { KanbanBoard } from "@/components/board/kanban-board";
import { PanelHeader } from "@/components/board/panel-header";
import { SeatGrid } from "@/components/board/seat-grid";
import { LiveRefresh } from "@/components/live-refresh";
import { getCurrentUser } from "@/lib/auth";
import { getPanelBoard } from "@/lib/data/queries";

export const metadata = { title: "Panel board" };

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

  const occupants: { seat: number; rollNo: string }[] = [];
  for (const candidate of panel.candidates) {
    if (candidate.status === "IN_INTERVIEW" && candidate.seatNumber !== null) {
      occupants.push({ seat: candidate.seatNumber, rollNo: candidate.rollNo });
    }
  }

  return (
    <div className="space-y-6">
      <LiveRefresh intervalMs={4000} />

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

      <div
        className="animate-fade-up grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]"
        style={{ animationDelay: "50ms" }}
      >
        <SeatGrid
          seatCount={panel.seatCount}
          occupants={occupants}
          freeSeats={panel.stats.freeSeats}
        />
        <AddCandidateForm panelId={panel.id} closed={!panel.isActive} />
      </div>

      <div className="animate-fade-up" style={{ animationDelay: "100ms" }}>
        <KanbanBoard panelId={panel.id} candidates={panel.candidates} />
      </div>
    </div>
  );
}
