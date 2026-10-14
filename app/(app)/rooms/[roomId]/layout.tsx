import { redirect } from "next/navigation";
import { connection } from "next/server";
import { type ReactNode, Suspense } from "react";
import { Header } from "@/components/shell/header";
import { getCurrentUser, getRoomContext } from "@/lib/auth";

async function RoomShell({
  roomId,
  children,
}: {
  roomId: string;
  children: ReactNode;
}) {
  await connection();

  const user = await getCurrentUser();
  if (!user) redirect("/api/session/clear");

  const roomCtx = await getRoomContext(roomId, user.id);
  if (!roomCtx) redirect("/rooms");

  return (
    <>
      <Header
        user={{ name: user.name, email: user.email }}
        room={{
          id: roomCtx.room.id,
          name: roomCtx.room.name,
          role: roomCtx.role,
        }}
      />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-7 sm:px-6 lg:px-8">
        {children}
      </main>
    </>
  );
}

export default async function RoomLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;

  return (
    <Suspense
      fallback={
        <div className="h-16 border-b border-line bg-surface">
          <div className="mx-auto h-full max-w-7xl px-4 sm:px-6 lg:px-8" />
        </div>
      }
    >
      <RoomShell roomId={roomId}>{children}</RoomShell>
    </Suspense>
  );
}
