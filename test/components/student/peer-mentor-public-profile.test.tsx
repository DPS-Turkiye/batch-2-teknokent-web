import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PeerMentorPublicProfile } from "@/components/student/peer-mentor-public-profile";
import { BadgeCode, BadgeKind } from "@/interfaces/badges";
import { getPeerMentors } from "@/lib/client/peer-mentoring";
import {
  addPeerMentoringRequestFixture,
  PEER_MENTORS_FIXTURE,
  peerMentoringRequestsFixture,
  peerMentorsFixture,
  resetPeerMentoringFixtures,
} from "@test/fixtures/peer-mentoring";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/peer-mentoring", () => ({
  getPeerCategories: vi.fn(async () => []),
  getPeerMentors: vi.fn(async (filter) =>
    structuredClone(peerMentorsFixture(filter)),
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
        name: "Deniz Kaya için mentorluk talebi gönder",
      }),
    );
    expect(
      screen.getByRole("dialog", { name: "Mentorluk talebi gönder" }),
    ).toBeVisible();
  });

  it("marks a mentor holding the Akran Mentoru badge as verified", async () => {
    const deniz = PEER_MENTORS_FIXTURE.find(
      (mentor) => mentor.mentorId === "fixture-peer-1",
    );
    if (!deniz) throw new Error("fixture mentor missing");
    vi.mocked(getPeerMentors).mockResolvedValueOnce([
      {
        ...deniz,
        badges: [
          {
            code: BadgeCode.PeerMentor,
            kind: BadgeKind.Gate,
            programId: "fixture-program",
            awardedAt: "2026-10-01T10:00:00+03:00",
          },
        ],
      },
    ]);
    renderWithQueryClient(
      <PeerMentorPublicProfile mentorId="fixture-peer-1" />,
    );
    expect(await screen.findByText("Rozet doğrulandı")).toBeVisible();
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
