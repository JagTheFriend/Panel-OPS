"use client";

import { useLinkStatus } from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PendingLinkContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { pending } = useLinkStatus();
  return (
    <div
      className={cn(
        "h-full",
        pending && "animate-pulse-soft opacity-60",
        className,
      )}
    >
      {children}
    </div>
  );
}
