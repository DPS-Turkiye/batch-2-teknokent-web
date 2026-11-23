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
  type EmailTemplate,
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
  isBlankHtml,
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

export enum DraftQuestionKind {
  Send = "SEND",
  Delete = "DELETE",
  Template = "TEMPLATE",
}

type DraftQuestion =
  | { kind: DraftQuestionKind.Send | DraftQuestionKind.Delete }
  | { kind: DraftQuestionKind.Template; template: EmailTemplate };

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
  // Belongs to one review: another list starts with everybody ticked.
  const [unticked, setUnticked] = useState<{
    digest: string | null;
    ids: ReadonlySet<string>;
  }>({ digest: null, ids: new Set() });
  const [question, setQuestion] = useState<DraftQuestion | null>(null);
  // Remounts the editor when its text is replaced from outside: a template, or the backend's cleaned-up text.
  const [textVersion, setTextVersion] = useState(0);

  const id = detail?.campaign.id ?? null;
  const reviewDigest = detail?.reviewDigest ?? null;
  const isSaved = id !== null && isSameDraft(draft, saved);
  const { offered, excluded } = splitRecipients(detail?.recipients ?? []);
  const untickedIds =
    unticked.digest === reviewDigest
      ? offered.map((row) => row.id).filter((row) => unticked.ids.has(row))
      : [];
  const selectedCount = offered.length - untickedIds.length;

  const templates = useQuery({
    queryKey: ["email-templates", draft.programId],
    queryFn: () => getEmailTemplates(draft.programId),
    enabled: draft.programId !== "",
  });

  const keep = (next: EmailCampaignDetail) => {
    const queryKey = emailCampaignQueryKey(next.campaign.id);
    // A refetch that started earlier must not bring the older answer back.
    void queryClient.cancelQueries({ queryKey });
    queryClient.setQueryData(queryKey, next);
    void queryClient.invalidateQueries({
      queryKey: EMAIL_CAMPAIGNS_QUERY_KEY,
      exact: true,
    });
  };
  const fill = ({ audience, subject, bodyHtml }: EmailTemplate) => {
    setDraft((previous) => ({ ...previous, audience, subject, bodyHtml }));
    setTextVersion((version) => version + 1);
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
      // The backend cleans the text up; only then does the editor have to be refilled.
      if (next.bodyHtml !== draft.bodyHtml)
        setTextVersion((version) => version + 1);
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
    onSuccess: keep,
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
        untickedIds,
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
      setQuestion(null);
    },
  });
  const remove = useMutation({
    mutationFn: removeEmailDraft,
    onSuccess: (_result, removedId) => {
      queryClient.removeQueries({ queryKey: emailCampaignQueryKey(removedId) });
      void queryClient.invalidateQueries({
        queryKey: EMAIL_CAMPAIGNS_QUERY_KEY,
        exact: true,
      });
      router.replace(basePath);
    },
    onError: fail,
    onSettled: () => {
      setQuestion(null);
    },
  });

  const isBusy =
    // Until the page of the new draft is open, another click would create a second one.
    (id === null && save.isSuccess) ||
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
    chooseTemplate: (key: string) => {
      const template = templates.data?.find((row) => row.key === key);
      if (!template) return;
      if (isBlankHtml(draft.bodyHtml)) fill(template);
      else setQuestion({ kind: DraftQuestionKind.Template, template });
    },
    isWaitingForSave: save.isPending,
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
    offered: isReviewed ? offered : [],
    excluded: isReviewed ? excluded : [],
    isTicked: (recipientId: string) => !untickedIds.includes(recipientId),
    toggle: (recipientId: string) => {
      const ids = new Set(untickedIds);
      if (!ids.delete(recipientId)) ids.add(recipientId);
      setUnticked({ digest: reviewDigest, ids });
    },
    selectedCount,
    question: question?.kind ?? null,
    askToSend: () => {
      setQuestion({ kind: DraftQuestionKind.Send });
    },
    askToDelete: () => {
      setQuestion({ kind: DraftQuestionKind.Delete });
    },
    cancelQuestion: () => {
      setQuestion(null);
    },
    answerYes: () => {
      if (question?.kind === DraftQuestionKind.Template) {
        fill(question.template);
        setQuestion(null);
      } else if (question?.kind === DraftQuestionKind.Delete && id !== null) {
        remove.mutate(id);
      } else if (id !== null && reviewDigest !== null) {
        send.mutate({ digest: reviewDigest, campaignId: id });
      }
    },
  };
}
