import "server-only";

import { GateBadgeState } from "@/interfaces/badges";

/** A `?state=` the backend knows, or null for "every state". */
export function gateBadgeStateParam(
  value: string | null,
): GateBadgeState | null {
  return (Object.values(GateBadgeState) as string[]).includes(value ?? "")
    ? (value as GateBadgeState)
    : null;
}
