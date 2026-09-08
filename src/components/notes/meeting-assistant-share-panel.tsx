"use client";

import { useAssistantShare } from "@/hooks/use-meeting-notes";
import type { MeetingReport, TranscriptLine } from "@/types/assistant";

function TranscriptBlock({ lines }: { lines: TranscriptLine[] }) {
  return (
    <section className="rounded-xl border border-[#e4e7ea] bg-white p-4">
      <h2 className="text-sm font-semibold text-[#22262b]">Transkript</h2>
      <p className="mt-0.5 text-[11px] text-[#858c96]">
        Mentör not defterinin altına gönderdi · salt okunur
      </p>
      <ol className="mt-3 space-y-3">
        {lines.map((line) => (
          <li key={line.id} className="flex gap-3 text-sm">
            <span className="w-10 shrink-0 font-mono text-[11px] text-[#858c96]">
              {line.at}
            </span>
            <div>
              <div className="text-xs font-medium text-[#e86f22]">
                {line.speaker}
              </div>
              <p className="mt-0.5 leading-relaxed text-[#22262b]">
                {line.text}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function ReportBlock({ report }: { report: MeetingReport }) {
  const topics = report.topicsDiscussed ?? [];
  const decisions = report.decisions ?? [];
  const actions = report.actionItems ?? [];
  const risks = report.risksOrBlockers ?? [];
  const nextSteps = report.nextSteps ?? [];

  return (
    <section className="rounded-xl border border-[#e4e7ea] bg-white p-4">
      <h2 className="text-sm font-semibold text-[#22262b]">Toplantı raporu</h2>
      <p className="mt-0.5 text-[11px] text-[#858c96]">
        Mentör not defterinin altına gönderdi · salt okunur
      </p>
      <h3 className="mt-3 text-sm font-semibold text-[#22262b]">
        {report.title || "Toplantı raporu"}
      </h3>
      <p className="mt-1 text-xs text-[#858c96]">
        {[report.topic, report.meetingDate].filter(Boolean).join(" · ") ||
          "Konu / tarih belirtilmedi"}
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
            Kararlar
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
            Aksiyonlar
          </p>
          <ul className="mt-1 space-y-1 text-sm text-[#22262b]">
            {actions.map((item, index) => (
              <li key={`${item.task}-${index}`}>
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

export function MeetingAssistantSharePanel({
  meetingId,
}: {
  meetingId: string;
}) {
  const shareQuery = useAssistantShare(meetingId);
  const share = shareQuery.data;
  const transcript = share?.transcript ?? null;
  const report = share?.report ?? null;

  if (shareQuery.isError) {
    return (
      <p className="rounded-xl border border-[#f1d4d4] bg-[#fff7f7] px-4 py-3 text-sm text-[#9b2c2c]">
        Mentörün gönderdiği transkript veya rapor şu an yüklenemedi.
      </p>
    );
  }

  if (!transcript?.length && !report) {
    return null;
  }

  return (
    <div className="space-y-4">
      {transcript?.length ? <TranscriptBlock lines={transcript} /> : null}
      {report ? <ReportBlock report={report} /> : null}
    </div>
  );
}
