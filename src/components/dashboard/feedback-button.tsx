"use client";

import {
  Check,
  Lightbulb,
  LoaderCircle,
  MessageSquarePlus,
  Send,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useId } from "react";

import { ModalDialog } from "@/components/common/modal-dialog";
import { usePlatformFeedback } from "@/hooks/use-platform-feedback";
import { PlatformFeedbackKind } from "@/interfaces/platform-feedback";
import {
  FEEDBACK_MESSAGE_LIMIT,
  FEEDBACK_SUBJECT_LIMIT,
} from "@/lib/platform-feedback";

const KINDS = [PlatformFeedbackKind.Feedback, PlatformFeedbackKind.Suggestion];
const FIELD_CLASS =
  "w-full rounded-2xl border border-[#e4e7ea] bg-white px-3.5 py-3 text-sm text-[#22262b] outline-none placeholder:text-[#9aA1ab] focus:border-[#e86f22] focus:ring-2 focus:ring-[#fde4d3] disabled:bg-[#f8f9fa]";

export function FeedbackButton() {
  const t = useTranslations("platformFeedback");
  const feedback = usePlatformFeedback();
  const id = useId();

  return (
    <>
      <button
        type="button"
        onClick={feedback.open}
        aria-expanded={feedback.isOpen}
        aria-haspopup="dialog"
        className="fixed bottom-6 right-4 z-50 inline-flex h-12 items-center gap-2.5 rounded-full bg-[#e86f22] px-5 text-sm font-semibold text-white shadow-[0_8px_28px_rgba(232,111,34,0.25)] transition hover:bg-[#ce5e19] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e86f22] motion-safe:hover:-translate-y-0.5 sm:right-6"
      >
        <MessageSquarePlus aria-hidden className="size-[18px]" />
        {t("button")}
      </button>
      {feedback.isOpen ? (
        <ModalDialog
          labelledBy={`${id}-title`}
          onClose={feedback.close}
          dismissOnBackdrop
          overlayClassName="fixed inset-0 z-[60] flex items-end justify-end bg-black/10 p-3 pb-[88px] sm:p-6 sm:pb-[88px]"
          panelClassName="feedback-tray-in flex max-h-[calc(100dvh-112px)] w-full max-w-[400px] flex-col overflow-y-auto rounded-3xl border border-[#e9ecef] bg-white shadow-[0_20px_64px_rgba(33,38,43,0.18)] outline-none"
        >
          <header className="flex items-start gap-3 px-6 pt-6">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#fff2e9] text-[#d85f16]">
              <MessageSquarePlus aria-hidden className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h2
                id={`${id}-title`}
                className="text-base font-semibold text-[#22262b]"
              >
                {t("title")}
              </h2>
              <p className="mt-1 text-xs leading-5 text-[#676e78]">
                {t("intro")}
              </p>
            </div>
            <button
              type="button"
              onClick={feedback.close}
              aria-label={t("close")}
              className="-mr-1 grid size-8 shrink-0 place-items-center rounded-full text-[#858c96] hover:bg-[#f4f5f7] hover:text-[#22262b]"
            >
              <X aria-hidden className="size-4" />
            </button>
          </header>

          {feedback.submitted ? (
            <div className="space-y-5 px-6 pb-6 pt-8">
              <div
                role="status"
                className="rounded-2xl bg-[#f2faf5] p-5 text-center"
              >
                <Check aria-hidden className="mx-auto size-7 text-[#26804c]" />
                <h3 className="mt-3 text-base font-semibold text-[#22262b]">
                  {t("successTitle")}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#676e78]">
                  {t("successBody")}
                </p>
              </div>
              <button
                type="button"
                onClick={feedback.close}
                className="h-11 w-full rounded-full bg-[#22262b] text-sm font-semibold text-white hover:bg-[#3a414b]"
              >
                {t("done")}
              </button>
            </div>
          ) : (
            <form
              noValidate
              onSubmit={feedback.submit}
              className="space-y-4 px-6 pb-6 pt-5"
            >
              <fieldset disabled={feedback.isSubmitting} className="space-y-4">
                <legend className="sr-only">{t("category")}</legend>
                <div className="grid grid-cols-2 gap-1 rounded-full bg-[#f5f6f8] p-1">
                  {KINDS.map((kind) => (
                    <button
                      key={kind}
                      type="button"
                      onClick={() => feedback.setKind(kind)}
                      aria-pressed={feedback.kind === kind}
                      className={`inline-flex h-9 items-center justify-center gap-2 rounded-full text-xs font-semibold transition ${feedback.kind === kind ? "bg-white text-[#c85816] shadow-sm" : "text-[#676e78] hover:text-[#22262b]"}`}
                    >
                      {kind === PlatformFeedbackKind.Suggestion ? (
                        <Lightbulb aria-hidden className="size-3.5" />
                      ) : (
                        <MessageSquarePlus aria-hidden className="size-3.5" />
                      )}
                      {t(`kinds.${kind}`)}
                    </button>
                  ))}
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor={`${id}-subject`}
                    className="block text-xs font-semibold text-[#374151]"
                  >
                    {t("subject")}
                  </label>
                  <input
                    id={`${id}-subject`}
                    value={feedback.subject}
                    onChange={(event) =>
                      feedback.setSubject(event.target.value)
                    }
                    maxLength={FEEDBACK_SUBJECT_LIMIT}
                    placeholder={t("subjectPlaceholder")}
                    aria-required="true"
                    aria-invalid={feedback.subjectRequired}
                    aria-describedby={
                      feedback.subjectRequired
                        ? `${id}-subject-error`
                        : undefined
                    }
                    className={FIELD_CLASS}
                  />
                  {feedback.subjectRequired ? (
                    <p
                      id={`${id}-subject-error`}
                      role="alert"
                      className="text-xs text-[#c0392b]"
                    >
                      {t("subjectRequired")}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor={`${id}-message`}
                    className="block text-xs font-semibold text-[#374151]"
                  >
                    {t("message")}
                  </label>
                  <textarea
                    id={`${id}-message`}
                    value={feedback.message}
                    onChange={(event) =>
                      feedback.setMessage(event.target.value)
                    }
                    maxLength={FEEDBACK_MESSAGE_LIMIT}
                    rows={4}
                    placeholder={t(
                      feedback.kind === PlatformFeedbackKind.Suggestion
                        ? "suggestionPlaceholder"
                        : "messagePlaceholder",
                    )}
                    aria-required="true"
                    aria-invalid={feedback.messageRequired}
                    aria-describedby={`${id}-counter${feedback.messageRequired ? ` ${id}-message-error` : ""}`}
                    className={`${FIELD_CLASS} min-h-[112px] resize-none`}
                  />
                  <p
                    id={`${id}-counter`}
                    className="text-right text-[11px] text-[#858c96]"
                  >
                    {t("counter", {
                      count: feedback.message.length,
                      limit: FEEDBACK_MESSAGE_LIMIT,
                    })}
                  </p>
                  {feedback.messageRequired ? (
                    <p
                      id={`${id}-message-error`}
                      role="alert"
                      className="text-xs text-[#c0392b]"
                    >
                      {t("messageRequired")}
                    </p>
                  ) : null}
                </div>
              </fieldset>
              {feedback.error ? (
                <p
                  role="alert"
                  className="rounded-xl bg-red-50 px-3 py-2 text-xs leading-5 text-red-700"
                >
                  {t(`errors.${feedback.error}`)}
                </p>
              ) : null}
              <p className="text-[11px] leading-[18px] text-[#858c96]">
                {t("destination")}
              </p>
              <button
                type="submit"
                disabled={!feedback.canSubmit}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#e86f22] text-sm font-semibold text-white transition hover:bg-[#ce5e19] disabled:cursor-not-allowed disabled:bg-[#d2d6dc]"
              >
                {feedback.isSubmitting ? (
                  <LoaderCircle
                    aria-hidden
                    className="size-4 animate-spin motion-reduce:animate-none"
                  />
                ) : (
                  <Send aria-hidden className="size-4" />
                )}
                {t(feedback.isSubmitting ? "sending" : "submit")}
              </button>
            </form>
          )}
        </ModalDialog>
      ) : null}
    </>
  );
}
