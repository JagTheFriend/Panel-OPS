import { redirect } from "next/navigation";
import { connection } from "next/server";
import {
  type ControlPanel,
  PanelsControl,
} from "@/components/admin/panels-table";
import { Card } from "@/components/ui/empty-state";
import { getCurrentUser } from "@/lib/auth";
import { getAdminPanels } from "@/lib/data/queries";

export const metadata = { title: "Control room" };
export const instant = false;

const tiles = [
  { key: "total", label: "Total panels" },
  { key: "active", label: "Active" },
  { key: "inactive", label: "Inactive" },
  { key: "members", label: "Memberships" },
] as const;

export default async function AdminPanelsPage() {
  await connection();
  const user = await getCurrentUser();
  if (!user) redirect("/api/session/clear");
  if (user.role !== "ADMIN") redirect("/board");

  const panels = await getAdminPanels();

  const rows: ControlPanel[] = panels.map((panel) => ({
    id: panel.id,
    name: panel.name,
    description: panel.description,
    isActive: panel.isActive,
    createdById: panel.createdById,
    createdByRollNo: panel.createdBy.rollNo,
    queueCount: panel._count.candidates,
    members: panel.members.map((member) => ({
      userId: member.userId,
      rollNo: member.user.rollNo,
      name: member.user.name,
      role: member.user.role,
      joinedAt: member.joinedAt.toISOString(),
      isCreator: member.userId === panel.createdById,
    })),
  }));

  const totals = {
    total: rows.length,
    active: rows.filter((row) => row.isActive).length,
    inactive: rows.filter((row) => !row.isActive).length,
    members: rows.reduce((sum, row) => sum + row.members.length, 0),
  };

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="text-2xl font-semibold tracking-tight">Control room</h1>
        <p className="mt-1 text-sm text-ink-2">
          Create panels and decide who staffs each queue.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((tile, index) => (
          <div
            key={tile.key}
            className="animate-fade-up"
            style={{ animationDelay: `${index * 45}ms` }}
          >
            <Card className="p-4">
              <p className="text-[11px] font-semibold tracking-wider text-ink-3 uppercase">
                {tile.label}
              </p>
              <p className="mt-1.5 font-mono text-3xl font-semibold tracking-tight text-ink tabular-nums">
                {totals[tile.key]}
              </p>
            </Card>
          </div>
        ))}
      </div>

      <PanelsControl panels={rows} />
    </div>
  );
}
