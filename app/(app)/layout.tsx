import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { type ReactNode, Suspense } from "react";
import { IdentityBridge } from "@/components/identity-bridge";
import { Header } from "@/components/shell/header";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Authentication is optimistically enforced in `proxy.ts` (real HTTP redirects
 * before render). This layout re-validates against the database as defence in
 * depth — e.g. when a session cookie outlives a deleted account.
 */
async function ProtectedShell({ children }: { children: ReactNode }) {
  await connection();

  const user = await getCurrentUser();
  if (!user) redirect("/api/session/clear");

  return (
    <>
      <IdentityBridge rollNo={user.rollNo} name={user.name} role={user.role} />
      <Header
        user={{ rollNo: user.rollNo, name: user.name, role: user.role }}
      />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-7 sm:px-6 lg:px-8">
        {children}
      </main>
    </>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Suspense
        fallback={
          <div className="h-16 border-b border-line bg-surface">
            <div className="mx-auto h-full max-w-7xl px-4 sm:px-6 lg:px-8" />
          </div>
        }
      >
        <ProtectedShell>{children}</ProtectedShell>
      </Suspense>
    </div>
  );
}
