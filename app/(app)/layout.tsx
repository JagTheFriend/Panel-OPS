import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth";
import { Header } from "@/components/shell/header";
import { IdentityBridge } from "@/components/identity-bridge";

/**
 * Authentication is optimistically enforced in `proxy.ts` (real HTTP redirects
 * before render). This layout re-validates against the database as defence in
 * depth — e.g. when a session cookie outlives a deleted account.
 */
async function ProtectedShell({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/join");

  return (
    <>
      <IdentityBridge rollNo={user.rollNo} name={user.name} role={user.role} />
      <Header user={{ rollNo: user.rollNo, role: user.role }} />
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
