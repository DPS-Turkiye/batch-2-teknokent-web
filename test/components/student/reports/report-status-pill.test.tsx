import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ReportStatusPill } from "@/components/student/reports/report-status-pill";
import { PeerReportBadge } from "@/types/peer-reports";

describe("ReportStatusPill", () => {
  it.each([
    [PeerReportBadge.Draft, "Taslak"],
    [PeerReportBadge.MissingInfo, "Eksik Bilgi"],
    [PeerReportBadge.InReview, "İncelemede"],
    [PeerReportBadge.RevisionRequested, "Revizyon Gerekli"],
    [PeerReportBadge.Approved, "Onaylandı"],
    [PeerReportBadge.Completed, "Tamamlandı"],
    [PeerReportBadge.AwaitingOutput, "Çıktı Bekliyor"],
  ])("labels %s as %s", (badge, label) => {
    render(<ReportStatusPill badge={badge} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("colours a revision request as an error and an approval as success", () => {
    const { rerender } = render(
      <ReportStatusPill badge={PeerReportBadge.RevisionRequested} />,
    );
    expect(screen.getByText("Revizyon Gerekli")).toHaveClass(
      "bg-status-error-bg",
    );
    rerender(<ReportStatusPill badge={PeerReportBadge.Approved} />);
    expect(screen.getByText("Onaylandı")).toHaveClass("bg-status-success-bg");
  });
});
