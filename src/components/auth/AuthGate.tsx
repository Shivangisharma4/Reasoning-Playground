"use client";

import { useConvexAuth } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

export function AuthGate({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { isSignedIn } = useAuth();
  const router = useRouter();

  // Track how long we've been loading while Clerk says signed-in
  // If >4s, assume JWT template isn't configured.
  const [slowLoad, setSlowLoad] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isLoading && isSignedIn) {
      timerRef.current = setTimeout(() => setSlowLoad(true), 4000);
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
      setSlowLoad(false);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isLoading, isSignedIn]);

  // Redirect to sign-in if Clerk also says not signed in
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isSignedIn) {
      router.replace("/sign-in");
    }
  }, [isLoading, isAuthenticated, isSignedIn, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="size-2 rounded-full bg-acid animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-bone">
              tethering to session
            </span>
          </div>

          {/* JWT setup guide — shown after 4s loading while signed in */}
          {slowLoad && (
            <div className="mt-4 max-w-sm rounded-lg border border-amber-500/30 bg-amber-500/5 px-5 py-4 text-[13px] leading-relaxed text-bone">
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-amber-400 mb-2">
                ⚠ setup required
              </p>
              <p className="mb-3">
                Convex can&apos;t verify your session. You need to create a JWT
                template in Clerk so Convex trusts its tokens.
              </p>
              <ol className="list-decimal list-inside space-y-1.5 text-bone-2">
                <li>
                  Open{" "}
                  <a
                    href="https://dashboard.clerk.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-acid underline underline-offset-2"
                  >
                    dashboard.clerk.com
                  </a>
                </li>
                <li>
                  Go to <strong className="text-paper">Configure → JWT Templates</strong>
                </li>
                <li>
                  Click <strong className="text-paper">New template</strong> → choose{" "}
                  <strong className="text-paper">Convex</strong>
                </li>
                <li>
                  Copy the <strong className="text-paper">Issuer URL</strong>, then run:
                </li>
              </ol>
              <pre className="mt-3 rounded bg-ink px-3 py-2 font-mono text-[11px] text-acid-dim overflow-x-auto">
                npx convex env set CLERK_JWT_ISSUER_DOMAIN &lt;issuer-url&gt;
              </pre>
              <p className="mt-3 text-bone-2 text-[11px]">
                Then reload this page.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirecting — show minimal spinner
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <span className="size-2 rounded-full bg-acid/40 animate-pulse" />
      </div>
    );
  }

  return <>{children}</>;
}
