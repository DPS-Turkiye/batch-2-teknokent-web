"use client";

import type { ReactNode } from "react";

import { useStartupPageGate } from "@/hooks/use-individual-program";

/** Renders a startup page only for someone it is for; anyone else is sent on (see useStartupPageGate). */
export function StartupPageGate({
  children,
  strict = false,
  path = "",
}: {
  children: ReactNode;
  strict?: boolean;
  path?: string;
}) {
  return useStartupPageGate({ strict, path }) ? children : null;
}
