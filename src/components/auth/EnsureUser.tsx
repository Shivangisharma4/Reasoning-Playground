"use client";

import { useEnsureUser } from "@/hooks/useEnsureUser";

export function EnsureUser() {
  useEnsureUser();
  return null;
}
