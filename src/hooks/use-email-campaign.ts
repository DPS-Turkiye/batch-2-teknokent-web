"use client";

import { useQuery } from "@tanstack/react-query";

import {
  emailCampaignQueryKey,
  useEmailOptions,
} from "@/hooks/use-email-campaigns";
import { EmailCampaignStatus } from "@/interfaces/email-center";
import { getEmailCampaign } from "@/lib/client/email-center";
import { POLL_INTERVAL, polling } from "@/lib/poll";

/** One mail; its people's statuses keep changing while it is being sent and, with bounces, for a while after. */
export function useEmailCampaign(id: string) {
  const options = useEmailOptions();
  const query = useQuery({
    queryKey: emailCampaignQueryKey(id),
    queryFn: () => getEmailCampaign(id),
    ...polling(POLL_INTERVAL.background),
  });
  return {
    detail: query.data ?? null,
    isDraft: query.data?.campaign.status === EmailCampaignStatus.Draft,
    isLoading: query.isLoading || options.isLoading,
    error: query.error ?? options.error,
  };
}
