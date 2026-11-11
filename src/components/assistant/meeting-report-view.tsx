import { useTranslations } from "next-intl";

import type { ReceivedMeetingReport } from "@/types/assistant";

type Props = {
  report: ReceivedMeetingReport;
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-4">
      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--ma-t3)]">
        {title}
      </div>
      {children}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  const t = useTranslations("assistant.reportView");
  if (items.length === 0) {
    return <p className="text-[12.5px] text-[var(--ma-t3)]">{t("none")}</p>;
  }
  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li
          key={item}
          className="flex gap-2 text-[12.5px] leading-relaxed text-[var(--ma-t1)]"
        >
          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--ma-accent)]" />
          {item}
        </li>
      ))}
    </ul>
  );
}

export function MeetingReportView({ report }: Props) {
  const t = useTranslations("assistant");
  const topicsDiscussed = report.topicsDiscussed ?? [];
  const decisions = report.decisions ?? [];
  const actionItems = report.actionItems ?? [];
  const risksOrBlockers = report.risksOrBlockers ?? [];
  const nextSteps = report.nextSteps ?? [];

  return (
    <div className="rounded-[10px] border border-[var(--ma-line)] bg-[var(--ma-panel)] px-4 py-3.5">
      <div className="min-w-0">
        <h3 className="text-[14px] font-semibold text-[var(--ma-t1)]">
          {report.title || t("report")}
        </h3>
        <p className="mt-1 text-[12px] text-[var(--ma-t3)]">
          {[report.topic, report.meetingDate].filter(Boolean).join(" · ") ||
            t("reportView.noTopic")}
        </p>
      </div>

      <Section title={t("reportView.summary")}>
        <p className="text-[13px] leading-relaxed text-[var(--ma-t1)]">
          {report.summary || t("reportView.noSummary")}
        </p>
      </Section>

      <Section title={t("reportView.topics")}>
        <BulletList items={topicsDiscussed} />
      </Section>

      <Section title={t("reportView.decisions")}>
        <BulletList items={decisions} />
      </Section>

      <Section title={t("reportView.actions")}>
        {actionItems.length === 0 ? (
          <p className="text-[12.5px] text-[var(--ma-t3)]">
            {t("reportView.none")}
          </p>
        ) : (
          <ul className="space-y-2">
            {actionItems.map((item) => (
              <li
                key={item.task}
                className="text-[12.5px] leading-relaxed text-[var(--ma-t1)]"
              >
                <span className="font-medium">{item.task || "—"}</span>
                {item.owner || item.due ? (
                  <span className="mt-0.5 block text-[11.5px] text-[var(--ma-t3)]">
                    {[item.owner, item.due].filter(Boolean).join(" · ")}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title={t("reportView.risks")}>
        <BulletList items={risksOrBlockers} />
      </Section>

      <Section title={t("reportView.nextSteps")}>
        <BulletList items={nextSteps} />
      </Section>
    </div>
  );
}
