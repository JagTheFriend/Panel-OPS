"use client";

import { Search, Shield, Trash2, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useMemo, useState } from "react";
import { RelativeTime } from "@/components/board/relative-time";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { removeRoomMember, setRoomMemberRole } from "@/lib/actions/users";
import { cn } from "@/lib/utils";

export type MemberRow = {
  id: string;
  name: string | null;
  email: string;
  role: "ADMIN" | "USER";
  joinedAt: string;
  panelCount: number;
};

const headings = [
  { label: "Email", title: "Email", className: "px-4 py-2.5 text-left" },
  {
    label: "Name",
    title: "Name",
    className: "hidden px-3 py-2.5 text-left sm:table-cell",
  },
  { label: "Role", title: "Role", className: "px-3 py-2.5 text-left" },
  {
    label: "Panels",
    title: "Panels joined",
    className: "hidden px-3 py-2.5 text-right lg:table-cell",
  },
  {
    label: "Joined",
    title: "Joined the room",
    className: "hidden px-3 py-2.5 text-left lg:table-cell",
  },
  { label: "Actions", title: "Actions", className: "px-4 py-2.5 text-right" },
] as const;

export function MembersTable({
  members,
  roomId,
  currentUserId,
}: {
  members: MemberRow[];
  roomId: string;
  currentUserId: string;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [query, setQuery] = useState("");
  const [rolePendingId, setRolePendingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MemberRow | null>(null);

  const roleChange = useAction(setRoomMemberRole, {
    onSuccess: ({ input }) => {
      setRolePendingId(null);
      const member = members.find((item) => item.id === input.userId);
      push({
        title: "Role updated",
        description: `${member?.email ?? "Member"} is now ${input.role === "ADMIN" ? "an admin" : "a member"}.`,
        tone: "success",
      });
      router.refresh();
    },
    onError: ({ error }) => {
      setRolePendingId(null);
      push({
        title: "Could not update role",
        description: error.serverError?.message,
        tone: "error",
      });
    },
  });

  const remove = useAction(removeRoomMember, {
    onSuccess: () => {
      setDeleteTarget(null);
      push({ title: "Member removed from the room", tone: "success" });
      router.refresh();
    },
    onError: ({ error }) => {
      setDeleteTarget(null);
      push({
        title: "Could not remove member",
        description: error.serverError?.message,
        tone: "error",
      });
    },
  });

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return members;
    return members.filter(
      (member) =>
        member.email.toLowerCase().includes(needle) ||
        (member.name ?? "").toLowerCase().includes(needle),
    );
  }, [members, query]);

  if (members.length === 0) {
    return (
      <EmptyState
        icon={<Search className="size-5" />}
        title="No members yet"
        description="People appear here as soon as they join this room with its code and PIN."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-3" />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by email or name"
            aria-label="Search members"
            className="pl-10"
          />
        </div>
        <p className="text-sm text-ink-2">
          <span className="font-semibold text-ink">{filtered.length}</span>{" "}
          {filtered.length === 1 ? "member" : "members"}
          {filtered.length !== members.length ? (
            <> of {members.length}</>
          ) : null}
        </p>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Search className="size-5" />}
          title="No members match your search"
          description={`Nothing here matches “${query.trim()}”. Try another email or name.`}
          action={
            <Button variant="secondary" onClick={() => setQuery("")}>
              Clear search
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-surface shadow-card">
          <table className="w-full min-w-[22rem] text-sm sm:min-w-[30rem] lg:min-w-[48rem]">
            <thead>
              <tr className="border-b border-line bg-surface-2/70 text-[11px] font-semibold tracking-wider text-ink-3 uppercase">
                {headings.map((heading) => (
                  <th
                    key={heading.label}
                    scope="col"
                    className={heading.className}
                    title={heading.title}
                  >
                    {heading.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((member) => {
                const isSelf = member.id === currentUserId;
                return (
                  <tr
                    key={member.id}
                    className={cn(
                      "transition-colors hover:bg-surface-2/60",
                      isSelf && "bg-brand-soft/50 hover:bg-brand-soft/70",
                    )}
                  >
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2">
                        <span
                          className="max-w-[12rem] truncate font-mono text-[13px] font-semibold text-ink sm:max-w-[16rem]"
                          title={member.email}
                        >
                          {member.email}
                        </span>
                        {isSelf ? <Badge tone="brand">You</Badge> : null}
                      </span>
                    </td>
                    <td className="hidden max-w-48 px-3 py-3 text-ink-2 sm:table-cell">
                      <span className="block truncate">
                        {member.name ?? "—"}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <Badge
                        tone={member.role === "ADMIN" ? "brand" : "neutral"}
                      >
                        {member.role}
                      </Badge>
                    </td>
                    <td className="hidden px-3 py-3 text-right font-mono text-ink-2 tabular-nums lg:table-cell">
                      {member.panelCount}
                    </td>
                    <td className="hidden px-3 py-3 text-xs whitespace-nowrap text-ink-3 lg:table-cell">
                      <RelativeTime at={new Date(member.joinedAt)} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {!isSelf ? (
                          member.role === "USER" ? (
                            <Button
                              variant="secondary"
                              size="sm"
                              loading={
                                roleChange.isExecuting &&
                                rolePendingId === member.id
                              }
                              disabled={roleChange.isExecuting}
                              onClick={() => {
                                setRolePendingId(member.id);
                                roleChange.execute({
                                  roomId,
                                  userId: member.id,
                                  role: "ADMIN",
                                });
                              }}
                            >
                              <Shield className="size-3.5" />
                              <span className="sr-only sm:not-sr-only">
                                Make admin
                              </span>
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              loading={
                                roleChange.isExecuting &&
                                rolePendingId === member.id
                              }
                              disabled={roleChange.isExecuting}
                              onClick={() => {
                                setRolePendingId(member.id);
                                roleChange.execute({
                                  roomId,
                                  userId: member.id,
                                  role: "USER",
                                });
                              }}
                            >
                              <UserRound className="size-3.5" />
                              <span className="sr-only sm:not-sr-only">
                                Make member
                              </span>
                            </Button>
                          )
                        ) : null}

                        {!isSelf ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-danger-ink hover:bg-danger-soft"
                            onClick={() => setDeleteTarget(member)}
                            aria-label={`Remove ${member.email} from the room`}
                          >
                            <Trash2 className="size-3.5" />
                            <span className="sr-only sm:not-sr-only">
                              Remove
                            </span>
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            remove.execute({ roomId, userId: deleteTarget.id });
          }
        }}
        title={
          deleteTarget
            ? `Remove ${deleteTarget.email} from the room?`
            : "Remove member"
        }
        description="They lose access to this room's panels. They can rejoin any time with the room code and a PIN. It cannot be undone."
        confirmLabel="Remove member"
        loading={remove.isExecuting}
      />
    </div>
  );
}
