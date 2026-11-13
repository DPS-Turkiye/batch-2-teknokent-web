import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ReportStatusPill } from "@/components/student/reports/report-status-pill";
import { PeerReportBadge } from "@/types/peer-reports";

describe("ReportStatusPill", () => {
  it.each([
    [PeerReportBadge.Draft, "Taslak", "bg-status-neutral-bg"],
    [PeerReportBadge.MissingInfo, "Eksik Bilgi", "bg-status-warning-bg"],
    [PeerReportBadge.InReview, "İncelemede", "bg-status-info-bg"],
    [
      PeerReportBadge.RevisionRequested,
      "Revizyon Gerekli",
      "bg-status-error-bg",
    ],
    [PeerReportBadge.Approved, "Onaylandı", "bg-status-success-bg"],
    [PeerReportBadge.Completed, "Tamamlandı", "bg-status-success-bg"],
    [PeerReportBadge.AwaitingOutput, "Çıktı Bekliyor", "bg-status-warning-bg"],
  ])("shows %s as %s in the 209:24 tone", (badge, label, tone) => {
    render(<ReportStatusPill badge={badge} />);
    const pill = screen.getByText(label);
    expect(pill).toHaveClass(tone);
    expect(pill).toHaveTextContent(new RegExp(`^${label}$`));
  });

  it("hides its dot from screen readers, so the label alone is read", () => {
    const { container } = render(
      <ReportStatusPill badge={PeerReportBadge.Draft} />,
    );
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });
});
