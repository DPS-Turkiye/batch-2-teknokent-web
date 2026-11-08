"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { useToast } from "@/stores/toast-store";
import {
  getInviteCode,
  rotateInviteCode,
} from "@/lib/client/organization-invite";

export const ORGANIZATION_INVITE_QUERY_KEY = ["organization-invite"] as const;

export function useOrganizationInvite({ enabled = true } = {}) {
  return useQuery({
    queryKey: ORGANIZATION_INVITE_QUERY_KEY,
    queryFn: getInviteCode,
    enabled,
  });
}

export function useRotateInviteCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: rotateInviteCode,
    onSuccess: (invite) =>
      queryClient.setQueryData(ORGANIZATION_INVITE_QUERY_KEY, invite),
  });
}

export function useInviteCodeCard() {
  const t = useTranslations("startupTeam.invite");
  const { showToast } = useToast();
  const inviteQuery = useOrganizationInvite();
  const rotate = useRotateInviteCode();
  const [copied, setCopied] = useState(false);

  return {
    code: inviteQuery.data?.inviteCode ?? null,
    copied,
    error: inviteQuery.error,
    isLoading: inviteQuery.isLoading,
    isRotating: rotate.isPending,
    async copy() {
      const code = inviteQuery.data?.inviteCode;
      if (!code) return;
      await navigator.clipboard.writeText(code);
      setCopied(true);
      showToast({ message: t("copiedToast"), tone: "success" });
    },
    async rotate() {
      setCopied(false);
      try {
        await rotate.mutateAsync();
        showToast({ message: t("rotated"), tone: "success" });
      } catch (reason) {
        showToast({
          message: reason instanceof Error ? reason.message : t("rotateFailed"),
          tone: "error",
        });
      }
    },
  };
}
