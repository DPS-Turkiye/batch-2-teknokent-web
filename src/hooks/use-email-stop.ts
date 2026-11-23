"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import {
  EMAIL_CAMPAIGNS_QUERY_KEY,
  emailCampaignQueryKey,
} from "@/hooks/use-email-campaigns";
import {
  EmailCampaignStatus,
  type EmailCampaign,
} from "@/interfaces/email-center";
import { ToastTone } from "@/interfaces/toast";
import { stopEmailSend } from "@/lib/client/email-center";
import { countdownLabel, holdSecondsLeft } from "@/lib/email-center";
import { errorMessage } from "@/lib/utils";
import { useToast } from "@/stores/toast-store";

const TICK_MS = 1_000;

/** A confirmed mail's hold and taking it back. The backend keeps the hold; the countdown only shows it. */
export function useEmailStop(campaign: EmailCampaign) {
  const t = useTranslations("emailCenter");
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [now, setNow] = useState(() => new Date());
  const [isAsking, setIsAsking] = useState(false);
  const secondsLeft = holdSecondsLeft(campaign, now);
  const isHolding = secondsLeft > 0;

  useEffect(() => {
    if (!isHolding) return;
    const timer = setInterval(() => {
      setNow(new Date());
    }, TICK_MS);
    return () => {
      clearInterval(timer);
    };
  }, [isHolding]);

  const stop = useMutation({
    mutationFn: () => stopEmailSend(campaign.id),
    onSuccess: (next) => {
      const queryKey = emailCampaignQueryKey(next.campaign.id);
      void queryClient.cancelQueries({ queryKey });
      queryClient.setQueryData(queryKey, next);
      showToast({ message: t("stopped"), tone: ToastTone.Success });
    },
    onError: (error) => {
      showToast({
        message: errorMessage(error, t("failed")),
        tone: ToastTone.Error,
      });
    },
    onSettled: () => {
      setIsAsking(false);
      void queryClient.invalidateQueries({
        queryKey: EMAIL_CAMPAIGNS_QUERY_KEY,
      });
    },
  });

  return {
    canStop: campaign.status === EmailCampaignStatus.Sending,
    isHolding,
    countdown: countdownLabel(secondsLeft),
    isAsking,
    isStopping: stop.isPending,
    ask: () => {
      setIsAsking(true);
    },
    cancel: () => {
      setIsAsking(false);
    },
    confirm: () => {
      stop.mutate();
    },
  };
}
