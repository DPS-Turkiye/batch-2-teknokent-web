import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PeerMentorPublicProfile } from "@/components/student/peer-mentor-public-profile";
import { BadgeCode, BadgeKind } from "@/interfaces/badges";
import { getPeerMentor } from "@/lib/client/peer-mentoring";
import {
  addPeerMentoringRequestFixture,
  peerMentorDetailFixture,
  peerMentoringRequestsFixture,
  resetPeerMentoringFixtures,
} from "@test/fixtures/peer-mentoring";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/peer-mentoring", () => ({
  getPeerCategories: vi.fn(async () => {
    const { PEER_TOPIC_CATEGORIES } =
      await import("@/interfaces/peer-mentoring");
    return [...PEER_TOPIC_CATEGORIES];
  }),
  getPeerMentor: vi.fn(async (id: string) =>
    structuredClone(peerMentorDetailFixture(id)),
  ),
  getPeerMentoringRequests: vi.fn(async () =>
    structuredClone(peerMentoringRequestsFixture()),
  ),
  createPeerMentoringRequest: vi.fn(async (input) =>
    structuredClone(addPeerMentoringRequestFixture(input)),
  ),
}));
vi.mock("@/lib/client/student-profile-completion", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("@/lib/client/student-profile-completion")
  >()),
  getStudentProfileCompletion: vi.fn(async () => ({
    topics: [],
    subtopics: [],
    goal: "",
    completed: true,
    skipped: false,
  })),
}));

beforeEach(() => {
  vi.clearAllMocks();
  resetPeerMentoringFixtures();
});

describe("PeerMentorPublicProfile", () => {
  it("shows the mentor, their topics and help text, why they were recommended, and sends a request", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <PeerMentorPublicProfile mentorId="fixture-peer-1" />,
    );

    expect(
      await screen.findByRole("heading", { level: 1, name: "Deniz Kaya" }),
    ).toBeVisible();
    expect(
      screen.getByText("Bilgisayar Mühendisliği · 4. sınıf"),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Akran Mentörlüğü" }),
    ).toHaveAttribute("href", "/student/peer-mentoring");
    const topics = screen.getByRole("region", {
      name: "Yardımcı olabileceği konular",
    });
    expect(within(topics).getAllByRole("listitem").length).toBeGreaterThan(0);
    expect(screen.getByText("Bu derste güçlü: CENG 242")).toBeVisible();
    // The fixture's Deniz has no Akran Mentoru badge, so no "verified" tag.
    expect(screen.queryByText("Rozet doğrulandı")).toBeNull();

    await user.click(
      screen.getByRole("button", {
        name: "Mentorluk Talebi Gönder, Deniz Kaya",
      }),
    );
    expect(
      screen.getByRole("dialog", { name: "Mentorluk talebi gönder" }),
    ).toBeVisible();
  });

  it("marks a mentor holding the Akran Mentoru badge as verified", async () => {
    const deniz = peerMentorDetailFixture("fixture-peer-1");
    if (!deniz) throw new Error("fixture mentor missing");
    vi.mocked(getPeerMentor).mockResolvedValueOnce({
      ...deniz,
      badges: [
        {
          code: BadgeCode.PeerMentor,
          kind: BadgeKind.Gate,
          programId: "fixture-program",
          awardedAt: "2026-10-01T10:00:00+03:00",
        },
      ],
    });
    renderWithQueryClient(
      <PeerMentorPublicProfile mentorId="fixture-peer-1" />,
    );
    expect(await screen.findByText("Rozet doğrulandı")).toBeVisible();
  });

  it("asks for the one mentor rather than the whole directory", async () => {
    renderWithQueryClient(
      <PeerMentorPublicProfile mentorId="fixture-peer-1" />,
    );
    await screen.findByRole("heading", { level: 1, name: "Deniz Kaya" });

    expect(getPeerMentor).toHaveBeenCalledWith("fixture-peer-1");
  });

  it("shows the sub-topics, experience, LinkedIn and weekly hours the wizard published", async () => {
    renderWithQueryClient(
      <PeerMentorPublicProfile mentorId="fixture-peer-1" />,
    );

    const topics = await screen.findByRole("region", {
      name: "Yardımcı olabileceği konular",
    });
    expect(within(topics).getByText("Örnek: CV hazırlama")).toBeVisible();
    // A sub-topic the catalogue doesn't know shows as written.
    expect(within(topics).getByText("Serbest konu")).toBeVisible();

    const experience = screen.getByRole("region", { name: "İlgili deneyim" });
    expect(
      within(experience).getByText("Yaz stajyeri — ABC Lojistik"),
    ).toBeVisible();
    expect(
      within(experience).getByText(
        "Temmuz 2025 – Ağustos 2025 · Haftalık operasyon raporları hazırladım.",
      ),
    ).toBeVisible();
    expect(
      within(experience).getByText("Eylül 2024 – Devam ediyor"),
    ).toBeVisible();
    expect(within(experience).getByText("CENG 242 · CENG 315")).toBeVisible();
    expect(
      within(experience).getByText("Kampüs etkinlik uygulaması"),
    ).toBeVisible();
    expect(within(experience).getByText("TU Delft, 2025 bahar")).toBeVisible();

    const linkedin = screen.getByRole("link", {
      name: "LinkedIn profili (yeni sekmede açılır)",
    });
    expect(linkedin).toHaveAttribute(
      "href",
      "https://www.linkedin.com/in/deniz-kaya",
    );
    expect(linkedin).toHaveAttribute("rel", "noopener noreferrer");

    const hours = screen.getByRole("region", { name: "Müsaitlik" });
    const days = within(hours).getAllByRole("term");
    expect(days.map((day) => day.textContent)).toEqual(["Salı", "Cumartesi"]);
    expect(within(hours).getByText("18:00 – 20:00")).toBeVisible();
    expect(within(hours).getByText("Boş saat var")).toBeVisible();
  });

  it("leaves out empty sections and says when there are no hours or free slots", async () => {
    renderWithQueryClient(
      <PeerMentorPublicProfile mentorId="fixture-peer-2" />,
    );
    await screen.findByRole("heading", { level: 1, name: "Elif Şahin" });

    expect(screen.queryByRole("region", { name: "İlgili deneyim" })).toBeNull();
    expect(screen.queryByRole("link", { name: /LinkedIn profili/ })).toBeNull();
    const hours = screen.getByRole("region", { name: "Müsaitlik" });
    expect(within(hours).getByText("Haftalık saat eklenmemiş.")).toBeVisible();
    expect(within(hours).getByText("Boş saat yok")).toBeVisible();
  });

  it("never turns a LinkedIn value that isn't a web link into a link", async () => {
    const deniz = peerMentorDetailFixture("fixture-peer-1");
    if (!deniz) throw new Error("fixture mentor missing");
    vi.mocked(getPeerMentor).mockResolvedValueOnce({
      ...deniz,
      linkedinUrl: "javascript:alert(1)",
    });
    renderWithQueryClient(
      <PeerMentorPublicProfile mentorId="fixture-peer-1" />,
    );
    await screen.findByRole("heading", { level: 1, name: "Deniz Kaya" });

    expect(screen.queryByRole("link", { name: /LinkedIn profili/ })).toBeNull();
  });

  it("reloads the mentor after a request is sent, since their places may have changed", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <PeerMentorPublicProfile mentorId="fixture-peer-1" />,
    );
    await user.click(
      await screen.findByRole("button", {
        name: "Mentorluk Talebi Gönder, Deniz Kaya",
      }),
    );
    const dialog = screen.getByRole("dialog", {
      name: "Mentorluk talebi gönder",
    });
    await user.type(
      within(dialog).getByLabelText("Kısa mesaj"),
      "Staj başvurusunda CV'mi birlikte gözden geçirebilir miyiz?",
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Mentorluk Talebi Gönder" }),
    );

    await waitFor(() => expect(getPeerMentor).toHaveBeenCalledTimes(2));
  });

  it("says why a request can't be sent to a mentor already asked", async () => {
    renderWithQueryClient(
      <PeerMentorPublicProfile mentorId="fixture-peer-2" />,
    );
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Talebin yanıt bekliyor" }),
      ).toBeDisabled(),
    );
  });

  it("says so when the mentor isn't listed", async () => {
    renderWithQueryClient(<PeerMentorPublicProfile mentorId="nobody" />);
    expect(
      await screen.findByText(
        "Bu akran mentoru bulunamadı ya da artık listelenmiyor.",
      ),
    ).toBeVisible();
  });
});
