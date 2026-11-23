"use client";

import { useNow } from "@/hooks/use-now";
import type { EmailCampaign } from "@/interfaces/email-center";
import { campaignLabel, holdSecondsLeft } from "@/lib/email-center";

/** Changes by itself when the hold is over. */
export function useCampaignLabel(campaign: EmailCampaign) {
  return campaignLabel(
    campaign,
    useNow((at) => holdSecondsLeft(campaign, at) > 0),
  );
}
