"use client";

import { useLocale } from "next-intl";
import { useRef, useState, type SubmitEvent } from "react";

import {
  FeedbackSubmitError,
  PlatformFeedbackKind,
} from "@/interfaces/platform-feedback";
import { ClientApiError } from "@/lib/client/api";
import { submitPlatformFeedback } from "@/lib/client/platform-feedback";
import { isLocale, Locale } from "@/lib/i18n";
import { platformFeedbackSubmissionSchema } from "@/lib/platform-feedback";

export function usePlatformFeedback() {
  const locale = useLocale();
  const [isOpen, setOpen] = useState(false);
  const [kind, setKind] = useState(PlatformFeedbackKind.Feedback);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [error, setError] = useState<FeedbackSubmitError | null>(null);
  const submittingRef = useRef(false);
  const payload = {
    kind,
    subject,
    message,
    language: isLocale(locale) ? locale : Locale.Tr,
  };
  const parsed = platformFeedbackSubmissionSchema.safeParse(payload);

  function open() {
    setSubmitted(false);
    setError(null);
    setAttempted(false);
    setOpen(true);
  }

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setAttempted(true);
    if (!parsed.success || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError(null);
    try {
      await submitPlatformFeedback(parsed.data);
      setSubject("");
      setMessage("");
      setKind(PlatformFeedbackKind.Feedback);
      setSubmitted(true);
    } catch (caught) {
      setError(
        caught instanceof ClientApiError && caught.status === 401
          ? FeedbackSubmitError.SessionRequired
          : caught instanceof ClientApiError && caught.status === 429
            ? FeedbackSubmitError.RateLimited
            : FeedbackSubmitError.Failed,
      );
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return {
    isOpen,
    open,
    close: () => setOpen(false),
    kind,
    setKind,
    subject,
    setSubject,
    message,
    setMessage,
    isSubmitting,
    submitted,
    error,
    submit,
    canSubmit: parsed.success && !isSubmitting,
    subjectRequired: attempted && !subject.trim(),
    messageRequired: attempted && !message.trim(),
  };
}
