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

/** "Rozet Yok" / "Eğitimde" / "Rozet Kazanıldı" / "Süresi doldu" / "Geri alındı". */
export function GateBadgeStateChip({
  state,
  inTraining = false,
}: {
  state: GateBadgeState;
  inTraining?: boolean;
}) {
  const t = useTranslations("badges");
  if (inTraining && state === GateBadgeState.None) {
    return <Badge tone="amber">{t("inTraining")}</Badge>;
  }
  return <Badge tone={TONE[state]}>{t(`states.${state}`)}</Badge>;
}
