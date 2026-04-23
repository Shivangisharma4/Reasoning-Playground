"use client";

import { useAuth } from "@clerk/nextjs";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

export function UserMenu() {
  const { isSignedIn } = useAuth();

  return (
    <div className="flex items-center justify-between gap-2">
      {isSignedIn ? (
        <>
          <UserButton
            appearance={{
              elements: {
                userButtonAvatarBox: "size-8",
              },
            }}
          />
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-bone-2">
            tethered
          </span>
        </>
      ) : (
        <Link
          href="/sign-in"
          className="font-mono text-[11px] uppercase tracking-[0.2em] text-paper border-b border-acid/60 pb-0.5"
        >
          sign in
        </Link>
      )}
    </div>
  );
}
