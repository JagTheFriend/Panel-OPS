import { redirect } from "next/navigation";
import { connection } from "next/server";
import { PanelsDirectory } from "@/components/panels/panels-directory";
import { getCurrentUser } from "@/lib/auth";
import { getDirectoryPanels } from "@/lib/data/queries";

export const metadata = { title: "Panels" };
export const instant = false;

export default async function PanelsPage() {
  await connection();
  const user = await getCurrentUser();
  if (!user) redirect("/api/session/clear");

  const panels = await getDirectoryPanels(user.id, user.role === "ADMIN");

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="text-2xl font-semibold tracking-tight">Panels</h1>
        <p className="mt-1 text-sm text-ink-2">
          {user.role === "ADMIN"
            ? "Every domain panel — join the ones you work at."
            : "The domains you picked at check-in — each one runs its own interview queue."}
        </p>
      </div>

      <PanelsDirectory panels={panels} />
    </div>
  );
}
