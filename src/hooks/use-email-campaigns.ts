"use client";

import { useQuery } from "@tanstack/react-query";

import {
  getEmailCampaigns,
  getEmailCenterOptions,
} from "@/lib/client/email-center";
import { POLL_INTERVAL, polling } from "@/lib/poll";

export const EMAIL_CAMPAIGNS_QUERY_KEY = ["email-campaigns"] as const;
export const EMAIL_OPTIONS_QUERY_KEY = ["email-center-options"] as const;

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
  return {
    campaigns: campaigns.data ?? [],
    isLoading: campaigns.isLoading,
    error: campaigns.error,
    sendingOff: options.data?.sendingOn === false,
  };
}
