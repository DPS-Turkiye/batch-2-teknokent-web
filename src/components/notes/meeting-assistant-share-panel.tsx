"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import type { ReactNode } from "react";

import { useAssistantShare } from "@/hooks/use-meeting-notes";
import { TRANSCRIPT_SCROLL_CLASS } from "@/lib/const/notes";
import type { ReceivedMeetingReport, TranscriptLine } from "@/types/assistant";

function ShareFold({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <details className="rounded-xl bg-[var(--ms-accent-faint,#fff4ec)] px-3 py-2">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm text-[#858c96] [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2">
          <Image src={icon} alt="" width={24} height={24} />
          {title}
        </span>
        <span aria-hidden className="text-[#aeb4bc]">
          ▾
        </span>
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}

function TranscriptBlock({ lines }: { lines: TranscriptLine[] }) {
  const t = useTranslations("notes.share");
  return (
    <div>
      <p className="text-[11px] text-[#858c96]">{t("sentReadOnly")}</p>
      <ol className={`mt-3 space-y-3 ${TRANSCRIPT_SCROLL_CLASS}`}>
        {lines.map((line) => (
          <li key={line.id} className="text-sm">
            <div className="text-xs font-medium text-[var(--ms-accent,#e86f22)]">
              {line.speaker}
            </div>
            <p className="mt-0.5 leading-relaxed text-[#22262b]">{line.text}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function ReportBlock({
  report,
  compact = false,
}: {
  report: ReceivedMeetingReport;
  compact?: boolean;
}) {
  const t = useTranslations("notes.share");
  const topics = report.topicsDiscussed ?? [];
  const decisions = report.decisions ?? [];
  const actions = report.actionItems ?? [];
  const risks = report.risksOrBlockers ?? [];
  const nextSteps = report.nextSteps ?? [];

  return (
    <section
      className={
        compact ? undefined : "rounded-xl border border-[#e4e7ea] bg-white p-4"
      }
    >
      {compact ? (
        <p className="text-[11px] text-[#858c96]">{t("sentReadOnly")}</p>
      ) : (
        <>
          <h2 className="text-sm font-semibold text-[#22262b]">
            {t("report")}
          </h2>
          <p className="mt-0.5 text-[11px] text-[#858c96]">{t("reportSent")}</p>
        </>
      )}
      <h3 className="mt-3 text-sm font-semibold text-[#22262b]">
        {report.title || t("report")}
      </h3>
      <p className="mt-1 text-xs text-[#858c96]">
        {[report.topic, report.meetingDate].filter(Boolean).join(" · ") ||
          t("noTopicDate")}
      </p>
      <p className="mt-3 text-sm leading-relaxed text-[#22262b]">
        {report.summary}
      </p>
      {topics.length ? (
        <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-[#22262b]">
          {topics.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
      {decisions.length ? (
        <div className="mt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#858c96]">
            {t("decisions")}
          </p>
          <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-[#22262b]">
            {decisions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {actions.length ? (
        <div className="mt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#858c96]">
            {t("actions")}
          </p>
          <ul className="mt-1 space-y-1 text-sm text-[#22262b]">
            {actions.map((item) => (
              <li key={item.task}>
                <span className="font-medium">{item.task}</span>
                {item.owner || item.due ? (
                  <span className="mt-0.5 block text-xs text-[#858c96]">
                    {[item.owner, item.due].filter(Boolean).join(" · ")}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {risks.length ? (
        <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-[#22262b]">
          {risks.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
      {nextSteps.length ? (
        <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-[#22262b]">
          {nextSteps.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function ShareBody({
  isError,
  isLoading,
  empty,
  children,
}: {
  isError: boolean;
  isLoading: boolean;
  empty: string;
  children: ReactNode | null;
}) {
  const t = useTranslations("notes.share");
  if (isError) {
    return <p className="text-sm text-[#9b2c2c]">{t("failed")}</p>;
  }
  if (isLoading) {
    return <p className="text-sm text-[#858c96]">{t("loading")}</p>;
  }
  if (!children) {
    return <p className="text-sm text-[#858c96]">{empty}</p>;
  }
  return children;
}

export function MeetingAssistantSharePanel({
  meetingId,
}: {
  meetingId: string;
}) {
  const t = useTranslations("notes.share");
  const shareQuery = useAssistantShare(meetingId, {
    refetchWhileIncomplete: true,
  });
  const share = shareQuery.data;
  const transcript = share?.transcript ?? null;
  const report = share?.report ?? null;

  return (
    <div className="space-y-2">
      <ShareFold icon="/startup/transcript.svg" title={t("transcriptTitle")}>
        <ShareBody
          isError={shareQuery.isError}
          isLoading={shareQuery.isLoading}
          empty={t("noTranscript")}
        >
          {transcript?.length ? <TranscriptBlock lines={transcript} /> : null}
        </ShareBody>
      </ShareFold>
      <ShareFold icon="/startup/paper.svg" title={t("reportTitle")}>
        <ShareBody
          isError={shareQuery.isError}
          isLoading={shareQuery.isLoading}
          empty={t("noReport")}
        >
          {report ? <ReportBlock report={report} compact /> : null}
        </ShareBody>
      </ShareFold>
    </div>
  );
}
