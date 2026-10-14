import { redirect } from "next/navigation";
import { connection } from "next/server";
import { PanelsDirectory } from "@/components/panels/panels-directory";
import { getCurrentUser, getRoomContext } from "@/lib/auth";
import { getDirectoryPanels } from "@/lib/data/queries";

export const metadata = { title: "Panels" };
export const instant = false;

export default async function PanelsPage({
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

  const panels = await getDirectoryPanels(roomId, user.id);

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="text-2xl font-semibold tracking-tight">Panels</h1>
        <p className="mt-1 text-sm text-ink-2">
          Every active panel in this room — join the ones you will staff.
        </p>
      </div>

      <PanelsDirectory panels={panels} roomId={roomId} />
    </div>
  );
}
