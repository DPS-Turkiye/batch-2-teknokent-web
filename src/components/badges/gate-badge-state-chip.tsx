// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { useTranslations } from "next-intl";

import { Badge } from "@/components/common/badge";
import { GateBadgeState } from "@/interfaces/badges";

const TONE: Record<GateBadgeState, "gray" | "green" | "amber"> = {
  [GateBadgeState.None]: "gray",
  [GateBadgeState.Active]: "green",
  [GateBadgeState.Expired]: "amber",
  [GateBadgeState.Revoked]: "amber",
};

/** "Rozet Yok" / "Rozet Kazanıldı" / "Süresi doldu" / "Geri alındı". */
export function GateBadgeStateChip({ state }: { state: GateBadgeState }) {
  const t = useTranslations("badges.states");
  return <Badge tone={TONE[state]}>{t(state)}</Badge>;
}
