import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { NextMeetingHero } from "@/components/mentee-home/next-meeting-hero";

const meeting = {
  id: "m-1",
  organizationId: "org-1",
  mentorName: "Nihan Öztürk",
  agenda: "Ürün konumlandırma kararları",
  scheduledAt: "2026-09-20T11:00:00.000Z",
  durationMinutes: 45,
  meetLink: "https://meet.google.com/abc-defg-hij",
  status: "SCHEDULED",
};

describe("NextMeetingHero", () => {
  it("shows the next meeting with its mentor and ways to act on it", () => {
    render(<NextMeetingHero meeting={meeting} loading={false} />);

    expect(
      screen.getByRole("heading", { name: "Ürün konumlandırma kararları" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Nihan Öztürk")).toBeInTheDocument();
    expect(screen.getByText(/45 dk · Online/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Görüşmeye katıl" }),
    ).toHaveAttribute("href", expect.stringContaining("m-1"));
    expect(screen.getByRole("link", { name: "Mentora mesaj" })).toHaveAttribute(
      "href",
      "/messages",
    );
  });

  it("offers to plan a meeting when none is scheduled", () => {
    render(<NextMeetingHero meeting={null} loading={false} />);

    expect(
      screen.getByRole("heading", { name: "Planlanmış görüşmen yok" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Toplantı planla" }),
    ).toHaveAttribute("href", "/calendar");
  });

  it("does not offer planning while meetings are still loading", () => {
    render(<NextMeetingHero meeting={null} loading />);

    expect(
      screen.getByRole("heading", { name: "Görüşmeler yükleniyor…" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Toplantı planla" }),
    ).not.toBeInTheDocument();
  });
});
