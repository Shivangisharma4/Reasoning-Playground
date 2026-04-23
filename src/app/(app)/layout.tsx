import type { ReactNode } from "react";

// Never statically pre-render auth-gated routes — content is user-specific.
export const dynamic = "force-dynamic";
import { LayoutShell } from "@/components/shell/LayoutShell";
import { AuthGate } from "@/components/auth/AuthGate";
import { EnsureUser } from "@/components/auth/EnsureUser";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGate>
      <EnsureUser />
      <LayoutShell>{children}</LayoutShell>
    </AuthGate>
  );
}
