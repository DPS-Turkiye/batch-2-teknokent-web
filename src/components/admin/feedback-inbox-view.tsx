"use client";

import {
  Check,
  ChevronDown,
  Inbox,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { ProgramTypeChip } from "@/components/coordinator/program-type-chip";
import { useFeedbackInbox } from "@/hooks/use-feedback-inbox";
import { PlatformFeedbackKind } from "@/interfaces/platform-feedback";
import { ProgramType } from "@/interfaces/program";
import { isEnumValue } from "@/lib/enum";
import { ALL_PROGRAM_TYPES, PROGRAM_TYPE_FILTERS } from "@/lib/program-types";
import { formatDateTime } from "@/lib/utils";

export function FeedbackInboxView() {
  const t = useTranslations("feedbackInbox");
  const tFeedback = useTranslations("platformFeedback");
  const tRoles = useTranslations("appShell.roles");
  const tType = useTranslations("programTypes");
  const locale = useLocale();
  const inbox = useFeedbackInbox();
  const data = inbox.data;

  return (
    <div className="space-y-6 pb-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#22262b]">
            {t("title")}
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#676e78]">{t("intro")}</p>
          {data ? (
            <p className="mt-2 text-xs font-medium text-[#c85816]">
              {t("unreadCount", { count: data.unreadCount })}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => void inbox.refetch()}
          disabled={inbox.isFetching}
          className="inline-flex h-10 items-center gap-2 rounded-full border border-[#e4e7ea] px-4 text-xs font-semibold text-[#515861] disabled:opacity-50"
        >
          <RefreshCw aria-hidden className="size-3.5" />
          {t("refresh")}
        </button>
      </header>
      <div className="flex flex-wrap items-center gap-4">
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-[#515861]">
          <input
            type="checkbox"
            checked={inbox.unreadOnly}
            onChange={(event) => inbox.filterUnread(event.target.checked)}
            className="size-4 accent-[#e86f22]"
          />
          {t("unreadOnly")}
        </label>
        {/* TEST UI: placeholder until the design team's screen; replace when it arrives. */}
        <label className="flex h-10 items-center gap-2 rounded-full border border-[#e9ecef] bg-white px-4 text-[13px]">
          <span className="text-[#858c96]">{tType("label")}</span>
          <select
            aria-label={tType("label")}
            value={inbox.programType ?? ALL_PROGRAM_TYPES}
            onChange={(event) => {
              const { value } = event.target;
              inbox.filterProgramType(
                isEnumValue(ProgramType, value) ? value : null,
              );
            }}
            className="appearance-none bg-transparent font-medium text-[#22262b] outline-none"
          >
            {PROGRAM_TYPE_FILTERS.map((option) => (
              <option key={option} value={option}>
                {tType(option)}
              </option>
            ))}
          </select>
          <ChevronDown aria-hidden className="size-4 text-[#858c96]" />
        </label>
      </div>
      {inbox.isLoading ? (
        <p role="status" className="py-12 text-center text-sm text-[#858c96]">
          {t("loading")}
        </p>
      ) : null}
      {inbox.error ? (
        <p
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {t("loadFailed")}
        </p>
      ) : null}
      {inbox.readError ? (
        <p
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {t("readFailed")}
        </p>
      ) : null}
      {data?.page.content.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#dde1e6] py-16 text-center">
          <Inbox aria-hidden className="mx-auto size-8 text-[#aeb4bc]" />
          <h2 className="mt-4 text-base font-semibold text-[#515861]">
            {t(inbox.unreadOnly ? "noUnread" : "emptyTitle")}
          </h2>
          <p className="mx-auto mt-2 max-w-sm px-4 text-sm leading-6 text-[#858c96]">
            {t("emptyBody")}
          </p>
        </div>
      ) : null}
      <div className="space-y-4">
        {data?.page.content.map((feedback) => (
          <article
            key={feedback.id}
            className={`rounded-3xl border p-5 sm:p-6 ${feedback.readAt ? "border-[#e9ecef] bg-white" : "border-[#f3d7c2] bg-[#fffcfa]"}`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${feedback.kind === PlatformFeedbackKind.Suggestion ? "bg-[#eaf6ff] text-[#1677b8]" : "bg-[#fff0e5] text-[#c85816]"}`}
                  >
                    {tFeedback(`kinds.${feedback.kind}`)}
                  </span>
                  {!feedback.readAt ? (
                    <span className="text-[11px] font-semibold text-[#c85816]">
                      {t("new")}
                    </span>
                  ) : null}
                </div>
                <h2 className="mt-3 break-words text-base font-semibold text-[#22262b]">
                  {feedback.subject}
                </h2>
              </div>
              <time
                dateTime={feedback.createdAt}
                className="text-xs text-[#858c96]"
              >
                {formatDateTime(feedback.createdAt, locale)}
              </time>
            </div>
            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-[#515861]">
              {feedback.message}
            </p>
            <footer className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#e9ecef] pt-4">
              <div className="min-w-0 text-xs leading-5 text-[#858c96]">
                <p className="break-words font-semibold text-[#515861]">
                  {feedback.authorName} · {tRoles(feedback.authorRole)}
                </p>
                {feedback.programType ? (
                  <p className="mt-1 flex flex-wrap items-center gap-2">
                    {feedback.programName ? (
                      <span>{feedback.programName}</span>
                    ) : null}
                    <ProgramTypeChip type={feedback.programType} />
                  </p>
                ) : (
                  <p className="mt-1">{t("noProgram")}</p>
                )}
                <p className="break-all">{feedback.authorEmail}</p>
                <p>
                  {t("language", {
                    language: t(`languages.${feedback.language}`),
                  })}
                </p>
              </div>
              {feedback.readAt ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-[#6b7280]">
                  <Check aria-hidden className="size-3.5" />
                  {t("read")}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => inbox.markRead(feedback.id)}
                  disabled={inbox.isMarkingRead}
                  className="inline-flex h-9 items-center gap-2 rounded-full border border-[#e4e7ea] bg-white px-3.5 text-xs font-semibold text-[#515861] disabled:opacity-50"
                >
                  {inbox.markingId === feedback.id ? (
                    <LoaderCircle
                      aria-hidden
                      className="size-3.5 animate-spin motion-reduce:animate-none"
                    />
                  ) : (
                    <Check aria-hidden className="size-3.5" />
                  )}
                  {t("markRead")}
                </button>
              )}
            </footer>
          </article>
        ))}
      </div>
      {data && data.page.totalPages > 1 ? (
        <nav
          aria-label={t("pagination")}
          className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#676e78]"
        >
          <button
            type="button"
            onClick={inbox.previous}
            disabled={inbox.page === 0 || inbox.isFetching}
            className="rounded-full border border-[#e4e7ea] px-4 py-2 disabled:opacity-40"
          >
            {t("previous")}
          </button>
          <span>
            {t("page", { page: inbox.page + 1, total: data.page.totalPages })}
          </span>
          <button
            type="button"
            onClick={inbox.next}
            disabled={
              inbox.page + 1 >= data.page.totalPages || inbox.isFetching
            }
            className="rounded-full border border-[#e4e7ea] px-4 py-2 disabled:opacity-40"
          >
            {t("next")}
          </button>
        </nav>
      ) : null}
    </div>
  );
}
