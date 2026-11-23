"use client";

import { useQuery } from "@tanstack/react-query";

import { useClientPagination } from "@/hooks/use-client-pagination";
import { useNow } from "@/hooks/use-now";
import type { EmailCampaign } from "@/interfaces/email-center";
import {
  getEmailCampaigns,
  getEmailCenterOptions,
} from "@/lib/client/email-center";
import { campaignLabel, holdSecondsLeft } from "@/lib/email-center";
import { POLL_INTERVAL, polling } from "@/lib/poll";

export const EMAIL_CAMPAIGNS_QUERY_KEY = ["email-campaigns"] as const;
export const EMAIL_OPTIONS_QUERY_KEY = ["email-center-options"] as const;

const PAGE_SIZE = 20;
const NO_CAMPAIGNS: EmailCampaign[] = [];

export function emailCampaignQueryKey(id: string) {
  return [...EMAIL_CAMPAIGNS_QUERY_KEY, id] as const;
}

export function useEmailOptions() {
  return useQuery({
    queryKey: EMAIL_OPTIONS_QUERY_KEY,
    queryFn: getEmailCenterOptions,
  });
}

export function useEmailCampaigns() {
  const options = useEmailOptions();
  const campaigns = useQuery({
    queryKey: EMAIL_CAMPAIGNS_QUERY_KEY,
    queryFn: getEmailCampaigns,
    ...polling(POLL_INTERVAL.background),
  });
  const pages = useClientPagination(campaigns.data ?? NO_CAMPAIGNS, PAGE_SIZE);
  const now = useNow((at) =>
    pages.pageItems.some((campaign) => holdSecondsLeft(campaign, at) > 0),
  );
  return {
    campaigns: pages.pageItems,
    labelOf: (campaign: EmailCampaign) => campaignLabel(campaign, now),
    page: pages.page,
    totalPages: pages.totalPages,
    setPage: pages.setPage,
    isEmpty: campaigns.data?.length === 0,
    isLoading: campaigns.isLoading,
    error: campaigns.error,
    sendingOff: options.data?.sendingOn === false,
  };
}
