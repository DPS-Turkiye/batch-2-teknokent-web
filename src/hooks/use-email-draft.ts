"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  EMAIL_CAMPAIGNS_QUERY_KEY,
  emailCampaignQueryKey,
  useEmailOptions,
} from "@/hooks/use-email-campaigns";
import {
  EmailAudience,
  type EmailCampaignDetail,
  type EmailDraft,
} from "@/interfaces/email-center";
import { ToastTone } from "@/interfaces/toast";
import { ClientApiError } from "@/lib/client/api";
import {
  confirmEmailSend,
  getEmailTemplates,
  removeEmailDraft,
  reviewEmailRecipients,
  saveEmailDraft,
  sendEmailTest,
} from "@/lib/client/email-center";
import {
  EmailSendRefusal,
  isDraftComplete,
  isSameDraft,
  splitRecipients,
  type EmailCenterPath,
} from "@/lib/email-center";
import { errorMessage } from "@/lib/utils";
import { useToast } from "@/stores/toast-store";

const EMPTY_DRAFT: EmailDraft = {
  programId: "",
  audience: EmailAudience.Participants,
  subject: "",
  bodyHtml: "",
};

function draftOf(detail: EmailCampaignDetail | null): EmailDraft {
  if (!detail) return EMPTY_DRAFT;
  const { programId, audience, subject } = detail.campaign;
  return { programId, audience, subject, bodyHtml: detail.bodyHtml };
}

/** Writing a mail: save, test to yourself, look at the list, confirm. The backend enforces the same order. */
export function useEmailDraft(
  detail: EmailCampaignDetail | null,
  basePath: EmailCenterPath,
) {
  const t = useTranslations("emailCenter");
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const options = useEmailOptions();
  const [draft, setDraft] = useState<EmailDraft>(() => draftOf(detail));
  // What the backend holds, as it answered: its cleaned-up text is what the next edit is compared with.
  const [saved, setSaved] = useState<EmailDraft>(() => draftOf(detail));
  const [unticked, setUnticked] = useState<ReadonlySet<string>>(new Set());
  const [confirming, setConfirming] = useState(false);
  // Remounts the editor when its text is replaced from outside: a template, or the backend's cleaned-up text.
  const [textVersion, setTextVersion] = useState(0);

  const id = detail?.campaign.id ?? null;
  const reviewDigest = detail?.reviewDigest ?? null;
  const isSaved = id !== null && isSameDraft(draft, saved);
  const { offered, excluded } = splitRecipients(detail?.recipients ?? []);
  const selectedCount = offered.filter((row) => !unticked.has(row.id)).length;

  const templates = useQuery({
    queryKey: ["email-templates", draft.programId],
    queryFn: () => getEmailTemplates(draft.programId),
    enabled: draft.programId !== "",
  });

  const keep = (next: EmailCampaignDetail) => {
    queryClient.setQueryData(emailCampaignQueryKey(next.campaign.id), next);
    void queryClient.invalidateQueries({
      queryKey: EMAIL_CAMPAIGNS_QUERY_KEY,
      exact: true,
    });
  };
  const fail = (error: unknown) => {
    showToast({
      message: errorMessage(error, t("failed")),
      tone: ToastTone.Error,
    });
  };

  const save = useMutation({
    mutationFn: () => saveEmailDraft(id, draft),
    onSuccess: (next) => {
      keep(next);
      setDraft(draftOf(next));
      setSaved(draftOf(next));
      setTextVersion((version) => version + 1);
      setUnticked(new Set());
      showToast({ message: t("saved"), tone: ToastTone.Success });
      if (id === null) router.replace(`${basePath}/${next.campaign.id}`);
    },
    onError: fail,
  });
  const test = useMutation({
    mutationFn: sendEmailTest,
    onSuccess: (next) => {
      keep(next);
      showToast({ message: t("testSent"), tone: ToastTone.Success });
    },
    onError: fail,
  });
  const review = useMutation({
    mutationFn: reviewEmailRecipients,
    onSuccess: (next) => {
      keep(next);
      setUnticked(new Set());
    },
    onError: fail,
  });
  const send = useMutation({
    mutationFn: ({
      digest,
      campaignId,
    }: {
      digest: string;
      campaignId: string;
    }) =>
      confirmEmailSend(campaignId, {
        reviewDigest: digest,
        untickedIds: [...unticked],
        expectedCount: selectedCount,
      }),
    onSuccess: (next) => {
      keep(next);
      showToast({ message: t("sendStarted"), tone: ToastTone.Success });
    },
    onError: (error) => {
      fail(error);
      // The backend dropped the review; show that it has to be made again.
      if (
        id !== null &&
        error instanceof ClientApiError &&
        error.code === EmailSendRefusal.ListChanged
      ) {
        void queryClient.invalidateQueries({
          queryKey: emailCampaignQueryKey(id),
        });
      }
    },
    onSettled: () => {
      setConfirming(false);
    },
  });
  const remove = useMutation({
    mutationFn: removeEmailDraft,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: EMAIL_CAMPAIGNS_QUERY_KEY,
        exact: true,
      });
      router.replace(basePath);
    },
    onError: fail,
  });

  const isBusy =
    save.isPending ||
    test.isPending ||
    review.isPending ||
    send.isPending ||
    remove.isPending;
  const isTested = isSaved && detail?.campaign.testSentAt != null;
  const isReviewed = isSaved && reviewDigest !== null;
  const sendingOff = options.data?.sendingOn === false;

  return {
    draft,
    update: <Field extends keyof EmailDraft>(
      field: Field,
      value: EmailDraft[Field],
    ) => {
      setDraft((previous) => ({ ...previous, [field]: value }));
    },
    programs: options.data?.programs ?? [],
    templates: templates.data ?? [],
    applyTemplate: (key: string) => {
      const template = templates.data?.find((row) => row.key === key);
      if (!template) return;
      const { audience, subject, bodyHtml } = template;
      setDraft((previous) => ({ ...previous, audience, subject, bodyHtml }));
      setTextVersion((version) => version + 1);
    },
    textVersion,
    replyTo: detail?.replyTo ?? null,
    isNew: id === null,
    isBusy,
    isSaved,
    isTested,
    isReviewed,
    sendingOff,
    canSave: !isBusy && !isSaved && isDraftComplete(draft),
    canTest: !isBusy && isSaved,
    canReview: !isBusy && isSaved,
    canSend:
      !isBusy && isTested && isReviewed && selectedCount > 0 && !sendingOff,
    save: () => {
      save.mutate();
    },
    sendTest: () => {
      if (id !== null) test.mutate(id);
    },
    review: () => {
      if (id !== null) review.mutate(id);
    },
    remove: () => {
      if (id !== null) remove.mutate(id);
    },
    offered: isReviewed ? offered : [],
    excluded: isReviewed ? excluded : [],
    isTicked: (recipientId: string) => !unticked.has(recipientId),
    toggle: (recipientId: string) => {
      setUnticked((previous) => {
        const next = new Set(previous);
        if (!next.delete(recipientId)) next.add(recipientId);
        return next;
      });
    },
    selectedCount,
    isConfirming: confirming,
    askToConfirm: () => {
      setConfirming(true);
    },
    cancelConfirm: () => {
      setConfirming(false);
    },
    confirmSend: () => {
      if (id !== null && reviewDigest !== null)
        send.mutate({ digest: reviewDigest, campaignId: id });
    },
  };
}
