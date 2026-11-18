"use client";

import { useProgramThisWeek } from "@/hooks/use-program-this-week";
import { MENTORSHIPS_ACTIVE_HREF } from "@/lib/const";
import { softwareDevelopmentCard } from "@/lib/startup-process";

/**
 * The "Yazılım geliştirme" card on Süreç. It shares the "Bu hafta" query, so it costs no extra request; the card is
 * null (not shown) while that loads, when it fails, and for a team in no program.
 */
export function useSoftwareDevelopmentCard() {
  const { week } = useProgramThisWeek();
  const card = softwareDevelopmentCard(week);
  return card ? { ...card, mentorshipsHref: MENTORSHIPS_ACTIVE_HREF } : null;
}
