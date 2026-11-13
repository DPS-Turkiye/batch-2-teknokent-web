import { useTranslations } from "next-intl";

import { StatusBadge, StatusTone } from "@/components/ia/status-badge";
import { ReportStatusPill } from "@/components/student/reports/report-status-pill";
import type { PeerReportBadge } from "@/types/peer-reports";

/** A report's pill, or "Henüz başlamadı" for one nobody started. */
export function ReportDayPill({ badge }: { badge: PeerReportBadge | null }) {
  const t = useTranslations("iaIskurReports.status");
  if (badge) return <ReportStatusPill badge={badge} />;
  return <StatusBadge tone={StatusTone.Neutral}>{t("notStarted")}</StatusBadge>;
}
