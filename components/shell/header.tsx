"use client";

import {
  Check,
  Columns3,
  Copy,
  DoorOpen,
  Hash,
  LayoutDashboard,
  LogOut,
  Radio,
  Settings2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import posthog from "posthog-js";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { cn, initials } from "@/lib/utils";
import { PendingLinkContent } from "./pending-link";

type HeaderUser = {
  name: string | null;
  email: string;
};

type HeaderRoom = {
  id: string;
  name: string;
  code: string;
  role: "ADMIN" | "USER";
} | null;

function RoomCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    const copiedOk = await navigator.clipboard.writeText(code).then(
      () => true,
      () => false,
    );
    if (!copiedOk) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={copyCode}
      aria-label={`Copy room code ${code}`}
      title="Copy room code"
      className="hidden h-8 items-center gap-1.5 rounded-full border border-line bg-surface-2 px-2.5 text-xs font-medium text-ink-2 transition hover:border-brand/40 hover:text-ink sm:inline-flex"
    >
      <Hash className="size-3.5" />
      <span className="font-mono tracking-widest">{code}</span>
      {copied ? (
        <Check className="size-3.5 text-brand-ink" />
      ) : (
        <Copy className="size-3.5 text-ink-3" />
      )}
    </button>
  );
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Header({ user, room }: { user: HeaderUser; room: HeaderRoom }) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const links = room
    ? [
        {
          href: `/rooms/${room.id}/board`,
          label: "Board",
          icon: LayoutDashboard,
        },
        {
          href: `/rooms/${room.id}/panels`,
          label: "Panels",
          icon: Columns3,
        },
        ...(room.role === "ADMIN"
          ? [
              {
                href: `/rooms/${room.id}/admin/panels`,
                label: "Control",
                icon: Settings2,
              },
              {
                href: `/rooms/${room.id}/admin/members`,
                label: "Members",
                icon: Users,
              },
            ]
          : []),
      ]
    : [{ href: "/rooms", label: "Rooms", icon: DoorOpen }];

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await authClient.signOut();
      posthog.reset();
      router.push("/join");
      router.refresh();
    } catch {
      setSigningOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:gap-5 lg:px-8">
        <Link href="/rooms" className="group flex items-center gap-2.5">
          <PendingLinkContent className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white shadow-card transition-transform group-hover:scale-105">
              P
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-tight text-ink">
                PanelOps
              </span>
              <span
                className="hidden max-w-[10rem] truncate text-[10px] font-medium tracking-wider text-ink-3 uppercase sm:block"
                title={room?.name}
              >
                {room?.name ?? "Recruitment desk"}
              </span>
            </span>
          </PendingLinkContent>
        </Link>

        <nav className="min-w-0 flex-1 overflow-x-auto">
          <ul className="flex items-center gap-1">
            {links.map((link) => {
              const Icon = link.icon;
              const active = isActive(pathname, link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    title={link.label}
                    className={cn(
                      "relative inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium whitespace-nowrap transition-colors sm:px-3",
                      active
                        ? "bg-brand-soft text-brand-ink"
                        : "text-ink-2 hover:bg-surface-2 hover:text-ink",
                    )}
                  >
                    <PendingLinkContent className="inline-flex items-center gap-1.5">
                      <Icon className="size-4" />
                      <span className="sr-only sm:not-sr-only">
                        {link.label}
                      </span>
                    </PendingLinkContent>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2.5">
          {room ? <RoomCodeButton code={room.code} /> : null}
          <span className="hidden items-center gap-2 rounded-full border border-line bg-surface-2 py-1 pr-3 pl-1 sm:inline-flex">
            <span className="flex size-7 items-center justify-center rounded-full bg-brand-soft font-mono text-[11px] font-semibold text-brand-ink">
              {initials(user.name, user.email)}
            </span>
            <span className="max-w-[9rem] truncate font-mono text-xs font-medium text-ink">
              {user.email.split("@")[0]}
            </span>
            {room ? (
              <Badge tone={room.role === "ADMIN" ? "brand" : "neutral"}>
                {room.role === "ADMIN" ? <Radio className="size-3" /> : null}
                {room.role}
              </Badge>
            ) : null}
          </span>

          <Button
            variant="ghost"
            size="sm"
            aria-label="Sign out"
            loading={signingOut}
            onClick={handleSignOut}
          >
            <LogOut className="size-4" />
            <span className="hidden md:inline">Sign out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
