"use client";

import { useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useConvexAuth, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

/**
 * On first authenticated load, upsert the Convex `users` row to mirror Clerk.
 * Safe to mount anywhere inside the authed tree — only fires when identity
 * resolves.
 */
export function useEnsureUser() {
  const { isAuthenticated } = useConvexAuth();
  const { user } = useUser();
  const ensure = useMutation(api.users.ensureUser);
  const sent = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !user || sent.current) return;
    sent.current = true;
    ensure({
      email: user.primaryEmailAddress?.emailAddress ?? "",
      name:
        user.fullName ??
        user.firstName ??
        user.username ??
        "Anonymous",
      avatarUrl: user.imageUrl,
    }).catch(() => {
      sent.current = false;
    });
  }, [isAuthenticated, user, ensure]);
}
