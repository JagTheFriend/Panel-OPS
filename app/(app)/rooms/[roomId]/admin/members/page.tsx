import { redirect } from "next/navigation";
import { connection } from "next/server";
import { type MemberRow, MembersTable } from "@/components/admin/members-table";
import { Card } from "@/components/ui/empty-state";
import { getCurrentUser, getRoomContext } from "@/lib/auth";
import { listRoomMembers } from "@/lib/data/queries";

export const metadata = { title: "Members" };
export const instant = false;

const tiles = [
  { key: "total", label: "Total members" },
  { key: "admins", label: "Admins" },
  { key: "users", label: "Users" },
] as const;

export default async function AdminMembersPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  await connection();

  const user = await getCurrentUser();
  if (!user) redirect("/api/session/clear");

  const roomCtx = await getRoomContext(roomId, user.id);
  if (!roomCtx) redirect("/rooms");
  if (roomCtx.role !== "ADMIN") redirect(`/rooms/${roomId}/board`);

  const members = await listRoomMembers(roomId);

  const rows: MemberRow[] = members.map((member) => ({
    id: member.id,
    name: member.name,
    email: member.email,
    role: member.role,
    joinedAt: member.joinedAt.toISOString(),
    panelCount: member.panelCount,
  }));

  const totals = {
    total: rows.length,
    admins: rows.filter((row) => row.role === "ADMIN").length,
    users: rows.filter((row) => row.role === "USER").length,
  };

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="text-2xl font-semibold tracking-tight">Members</h1>
        <p className="mt-1 text-sm text-ink-2">
          Everyone in this room — roles decide who can run the control room.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
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

      <MembersTable members={rows} roomId={roomId} currentUserId={user.id} />
    </div>
  );
}
