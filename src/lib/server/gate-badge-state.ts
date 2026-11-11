import "server-only";

import { GateBadgeState } from "@/interfaces/badges";
import { isEnumValue } from "@/lib/enum";

/** A `?state=` the backend knows, or null for "every state". */
export function gateBadgeStateParam(
  value: string | null,
): GateBadgeState | null {
  return isEnumValue(GateBadgeState, value) ? value : null;
}
