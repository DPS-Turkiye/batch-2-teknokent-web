"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { ToastTone } from "@/interfaces/toast";
import {
  getInviteCode,
  rotateInviteCode,
} from "@/lib/client/organization-invite";
import { inviteLink } from "@/lib/invite-intent";
import { useToast } from "@/stores/toast-store";

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
  const [linkCopied, setLinkCopied] = useState(false);

  return {
    code: inviteQuery.data?.inviteCode ?? null,
    copied,
    linkCopied,
    error: inviteQuery.error,
    isLoading: inviteQuery.isLoading,
    isRotating: rotate.isPending,
    async copy() {
      const code = inviteQuery.data?.inviteCode;
      if (!code) return;
      await navigator.clipboard.writeText(code);
      setCopied(true);
      showToast({ message: t("copiedToast"), tone: ToastTone.Success });
    },
    /** The link opens /invite with the code filled in, so a teammate does not have to type it. */
    async copyLink() {
      const code = inviteQuery.data?.inviteCode;
      if (!code) return;
      await navigator.clipboard.writeText(
        inviteLink(window.location.origin, code),
      );
      setLinkCopied(true);
      showToast({ message: t("linkCopiedToast"), tone: ToastTone.Success });
    },
    async rotate() {
      setCopied(false);
      setLinkCopied(false);
      try {
        await rotate.mutateAsync();
        showToast({ message: t("rotated"), tone: ToastTone.Success });
      } catch (reason) {
        showToast({
          message: reason instanceof Error ? reason.message : t("rotateFailed"),
          tone: ToastTone.Error,
        });
      }
    },
  };
}
