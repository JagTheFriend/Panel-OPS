import { redirect } from "next/navigation";
import { connection } from "next/server";
import { PanelsDirectory } from "@/components/panels/panels-directory";
import { getCurrentUser } from "@/lib/auth";
import { getDirectoryPanels } from "@/lib/data/queries";

export const metadata = { title: "Panels" };

export default async function PanelsPage() {
  await connection();
  const user = await getCurrentUser();
  if (!user) redirect("/join");

  const panels = await getDirectoryPanels(user.id);

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="text-2xl font-semibold tracking-tight">Panels</h1>
        <p className="mt-1 text-sm text-ink-2">
          Join the domain panels you work at — each one runs its own interview
          queue and stations.
        </p>
      </div>

      <PanelsDirectory panels={panels} />
    </div>
  );
}
