import { DoorOpen, Home } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Header } from "@/components/shell/header";
import { PendingLinkContent } from "@/components/shell/pending-link";
import { Badge } from "@/components/ui/badge";
import { Card, EmptyState } from "@/components/ui/empty-state";
import { getCurrentUser } from "@/lib/auth";
import { getRoomsForUser } from "@/lib/data/queries";
import { CreateRoomForm, JoinRoomForm } from "./room-forms";

export const metadata = { title: "Rooms" };

export default async function RoomsPage() {
  await connection();
  const user = await getCurrentUser();
  if (!user) redirect("/api/session/clear");

  const rooms = await getRoomsForUser(user.id);

  return (
    <>
      <Header user={{ name: user.name, email: user.email }} room={null} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-7 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Your rooms
            </h1>
            <p className="mt-1 text-sm text-ink-2">
              Open a room to see its boards, or join another with its code and
              PIN.
            </p>
          </div>

          {rooms.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {rooms.map((room, index) => (
                <Link
                  key={room.id}
                  href={`/rooms/${room.id}/board`}
                  className="group animate-fade-up"
                  style={{ animationDelay: `${index * 45}ms` }}
                >
                  <PendingLinkContent>
                    <Card className="h-full p-5 transition-colors group-hover:border-brand/40">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="truncate font-semibold tracking-tight text-ink group-hover:text-brand-ink">
                            {room.name}
                          </h2>
                          <p className="mt-1 text-xs text-ink-3">
                            Code{" "}
                            <span className="font-mono font-semibold text-ink-2">
                              {room.code}
                            </span>{" "}
                            · {room.panelCount}{" "}
                            {room.panelCount === 1 ? "panel" : "panels"}
                          </p>
                        </div>
                        <Badge
                          tone={room.role === "ADMIN" ? "brand" : "neutral"}
                        >
                          {room.role}
                        </Badge>
                      </div>
                      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-ink">
                        Open board
                        <DoorOpen className="size-4 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </Card>
                  </PendingLinkContent>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Home className="size-5" />}
              title="You are not in any room yet"
              description="Create your own room below, or join one with the code and PIN from its coordinator."
            />
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <CreateRoomForm />
            <JoinRoomForm />
          </div>
        </div>
      </main>
    </>
  );
}
