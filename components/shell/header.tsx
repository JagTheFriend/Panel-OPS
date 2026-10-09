"use client";

import {
  Columns3,
  LayoutDashboard,
  LogOut,
  Radio,
  Settings2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import posthog from "posthog-js";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

type HeaderUser = { rollNo: string; role: "ADMIN" | "USER" };

const links = [
  { href: "/board", label: "Board", icon: LayoutDashboard },
  { href: "/panels", label: "Panels", icon: Columns3 },
  { href: "/admin/panels", label: "Control", icon: Settings2, adminOnly: true },
  { href: "/admin/members", label: "Members", icon: Users, adminOnly: true },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/board")
    return pathname === "/board" || pathname.startsWith("/board/");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Header({ user }: { user: HeaderUser }) {
  const pathname = usePathname();
  const { execute, isExecuting } = useAction(logout, {
    onSuccess: () => posthog.reset(),
  });

  const visibleLinks = links.filter(
    (link) => !("adminOnly" in link) || user.role === "ADMIN",
  );

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:gap-5 lg:px-8">
        <Link href="/board" className="group flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white shadow-card transition-transform group-hover:scale-105">
            P
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight text-ink">
              PanelOps
            </span>
            <span className="hidden text-[10px] font-medium tracking-wider text-ink-3 uppercase sm:block">
              Recruitment desk
            </span>
          </span>
        </Link>

        <nav className="min-w-0 flex-1 overflow-x-auto">
          <ul className="flex items-center gap-1">
            {visibleLinks.map((link) => {
              const Icon = "icon" in link ? link.icon : LayoutDashboard;
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
                    <Icon className="size-4" />
                    <span className="sr-only sm:not-sr-only">{link.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2.5">
          <span className="hidden items-center gap-2 rounded-full border border-line bg-surface-2 py-1 pr-3 pl-1 sm:inline-flex">
            <span className="flex size-7 items-center justify-center rounded-full bg-brand-soft font-mono text-[11px] font-semibold text-brand-ink">
              {user.rollNo.slice(0, 2).toUpperCase()}
            </span>
            <span className="font-mono text-xs font-medium text-ink">
              {user.rollNo}
            </span>
            <Badge tone={user.role === "ADMIN" ? "brand" : "neutral"}>
              {user.role === "ADMIN" ? <Radio className="size-3" /> : null}
              {user.role}
            </Badge>
          </span>

          <Button
            variant="ghost"
            size="sm"
            aria-label="Sign out"
            loading={isExecuting}
            onClick={() => {
              posthog.reset();
              execute();
            }}
          >
            <LogOut className="size-4" />
            <span className="hidden md:inline">Sign out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
