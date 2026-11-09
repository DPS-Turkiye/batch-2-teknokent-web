// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { useTranslations } from "next-intl";

import { Badge } from "@/components/common/badge";
import { BadgeKind, type PublicBadge } from "@/interfaces/badges";

/**
 * A person's active badges as chips, for a mentor card or profile. On a card the gate badge is implied by being
 * listed, so only achievements show, at most `max` of them, the rest as "+N".
 */
export function BadgeChips({
  badges,
  max,
  includeGate = false,
}: {
  badges: readonly PublicBadge[];
  max?: number;
  includeGate?: boolean;
}) {
  const t = useTranslations("badges");
  const shown = badges.filter(
    (badge) => includeGate || badge.kind === BadgeKind.Achievement,
  );
  if (shown.length === 0) return null;
  const visible = max == null ? shown : shown.slice(0, max);
  const hidden = shown.length - visible.length;
  return (
    <ul aria-label={t("listLabel")} className="flex flex-wrap gap-1.5">
      {visible.map((badge) => (
        <li key={`${badge.code}-${badge.programId ?? "all"}`}>
          <Badge tone={badge.kind === BadgeKind.Gate ? "green" : "amber"}>
            {t(`names.${badge.code}`)}
          </Badge>
        </li>
      ))}
      {hidden > 0 ? (
        <li>
          <Badge>{t("more", { count: hidden })}</Badge>
        </li>
      ) : null}
    </ul>
  );
}
