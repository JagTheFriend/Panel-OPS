import { ArrowLeft, Radio, Settings2 } from "lucide-react";
import Link from "next/link";
import { LeavePanelButton } from "@/components/board/leave-panel-button";
import { Badge } from "@/components/ui/badge";
import { initials } from "@/lib/utils";

type PanelSummary = {
  id: string;
  roomId: string;
  name: string;
  description: string | null;
  isActive: boolean;
};

type Member = {
  id: string;
  email: string;
  name: string | null;
};

type Stats = {
  waiting: number;
  interviewing: number;
  done: number;
};

const VISIBLE_MEMBERS = 6;

export function PanelHeader({
  panel,
  members,
  stats,
  isAdmin,
}: {
  panel: PanelSummary;
  members: Member[];
  stats: Stats;
  isAdmin: boolean;
}) {
  const visibleMembers = members.slice(0, VISIBLE_MEMBERS);
  const extraMembers = members.length - visibleMembers.length;

  return (
    <header className="animate-fade-up space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/rooms/${panel.roomId}/board`}
          className="group inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 text-xs font-medium text-ink-2 shadow-card transition hover:border-brand/40 hover:text-brand-ink"
        >
          <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
          All panels
        </Link>

        <div className="flex items-center gap-2">
          {isAdmin ? (
            <Link
              href={`/rooms/${panel.roomId}/admin/panels`}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 text-xs font-medium text-ink-2 shadow-card transition hover:border-brand/40 hover:bg-brand-soft hover:text-brand-ink"
            >
              <Settings2 className="size-3.5" />
              Manage
            </Link>
          ) : null}
          {!isAdmin ? (
            <LeavePanelButton
              panelId={panel.id}
              roomId={panel.roomId}
              memberCount={members.length}
            />
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-ink">
              <Radio className="size-5" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight text-ink">
                  {panel.name}
                </h1>
                <Badge tone={panel.isActive ? "live" : "warning"} dot>
                  {panel.isActive ? "Live" : "Paused"}
                </Badge>
              </div>
              {panel.description ? (
                <p className="mt-1 max-w-2xl text-sm text-ink-2">
                  {panel.description}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-2.5">
            <div className="flex items-center gap-2">
              <div
                role="img"
                aria-label={`${members.length} panel members`}
                className="flex items-center -space-x-2"
              >
                {visibleMembers.map((member) => (
                  <span
                    key={member.id}
                    title={`${member.email}${member.name ? ` · ${member.name}` : ""}`}
                    className="flex size-8 items-center justify-center rounded-full border-2 border-surface bg-surface-2 font-mono text-[10px] font-semibold text-ink-2"
                  >
                    {initials(member.name, member.email)}
                  </span>
                ))}
                {extraMembers > 0 ? (
                  <span className="flex size-8 items-center justify-center rounded-full border-2 border-surface bg-surface-2 text-[10px] font-semibold text-ink-3">
                    +{extraMembers}
                  </span>
                ) : null}
              </div>
            </div>

            <span className="hidden h-4 w-px bg-line sm:block" />

            <div className="flex flex-wrap items-center gap-1.5">
              <Badge tone="warning" dot>
                {stats.waiting} waiting
              </Badge>
              <Badge tone="live" dot>
                {stats.interviewing} in interview
              </Badge>
              <Badge tone="brand">{stats.done} done</Badge>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
