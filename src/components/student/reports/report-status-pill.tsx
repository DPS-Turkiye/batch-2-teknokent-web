import { useTranslations } from "next-intl";

import { StatusBadge, StatusTone } from "@/components/ia/status-badge";
import { PeerReportBadge } from "@/types/peer-reports";

const TONES: Record<PeerReportBadge, StatusTone> = {
  [PeerReportBadge.Draft]: StatusTone.Neutral,
  [PeerReportBadge.MissingInfo]: StatusTone.Warning,
  [PeerReportBadge.InReview]: StatusTone.Info,
  [PeerReportBadge.RevisionRequested]: StatusTone.Error,
  [PeerReportBadge.Approved]: StatusTone.Success,
  [PeerReportBadge.Completed]: StatusTone.Success,
  [PeerReportBadge.AwaitingOutput]: StatusTone.Warning,
};

/** "Rapor & Faaliyet Durumu" (Figma 209:24): the same pill on meeting, daily and weekly reports. */
export function ReportStatusPill({ badge }: { badge: PeerReportBadge }) {
  const t = useTranslations("iaIskurReports.status");
  return (
    <StatusBadge
      tone={TONES[badge]}
      icon={
        <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      }
    >
      {t(badge)}
    </StatusBadge>
  );
}
