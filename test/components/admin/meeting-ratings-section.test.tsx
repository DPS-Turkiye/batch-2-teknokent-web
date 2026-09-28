import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MeetingRatingsSection } from "@/components/admin/meeting-ratings-section";
import { programMeetingRatings } from "@test/fixtures/program-report";

describe("MeetingRatingsSection", () => {
  it("shows the average, each question and how the scores spread", () => {
    render(
      <MeetingRatingsSection
        ratings={programMeetingRatings()}
        isLoading={false}
        error={null}
      />,
    );

    const section = screen.getByRole("region", {
      name: "Görüşme değerlendirmeleri",
    });
    expect(within(section).getByText("4,3")).toBeInTheDocument();
    expect(
      within(section).getByText("9/12 görüşme · %75 yanıt"),
    ).toBeInTheDocument();
    expect(
      within(section).getByText("Sonraki adımlar netleşti"),
    ).toBeInTheDocument();
    expect(within(section).getByText("4,7")).toBeInTheDocument();
    expect(within(section).getByText("9 anket · 36 yanıt")).toBeInTheDocument();
  });

  it("says when meetings were held but nobody rated them yet", () => {
    render(
      <MeetingRatingsSection
        ratings={programMeetingRatings({
          average: null,
          ratedMeetingCount: 0,
          feedbackCount: 0,
          questionAverages: [],
          distribution: [0, 0, 0, 0, 0],
        })}
        isLoading={false}
        error={null}
      />,
    );

    expect(
      screen.getByText("12 görüşme gerçekleşti; henüz değerlendirme yok."),
    ).toBeInTheDocument();
  });
});
