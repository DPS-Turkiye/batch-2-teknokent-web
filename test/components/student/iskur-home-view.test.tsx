import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { IskurHomeView } from "@/components/student/iskur-home-view";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import {
  PeerMentorGateState,
  PeerTopicCategory,
  type PeerMentoringRequest,
  type PeerMentorProfile,
} from "@/interfaces/peer-mentoring";
import { decideMentorRequest } from "@/lib/client/mentor-requests";
import {
  getPeerMentorProfile,
  getReceivedPeerRequests,
} from "@/lib/client/peer-mentoring";
import { renderWithQueryClient } from "@test/test-utils";

// The shared home is ODTÜ öğrenci's screen; here it only shows where the İŞKUR blocks land.
vi.mock("@/components/student/home-view", () => ({
  StudentHomeView: ({
    main,
    aside,
  }: {
    main?: ReactNode;
    aside?: ReactNode;
  }) => (
    <div>
      <div data-testid="home-main">{main}</div>
      <div data-testid="home-aside">{aside}</div>
    </div>
  ),
}));

const gate = { state: PeerMentorGateState.Earned };
vi.mock("@/hooks/use-peer-mentor-give", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/hooks/use-peer-mentor-give")>()),
  usePeerMentorGate: () => ({
    state: gate.state,
    gateAward: null,
    expired: false,
    isLoading: false,
    sessionBehind: false,
  }),
}));
vi.mock("@/lib/client/peer-mentoring", () => ({
  getPeerMentorProfile: vi.fn(),
  getReceivedPeerRequests: vi.fn(),
}));
vi.mock("@/lib/client/mentor-requests", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/client/mentor-requests")>()),
  decideMentorRequest: vi.fn(async () => ({})),
}));

const PROFILE: PeerMentorProfile = {
  categories: [PeerTopicCategory.CareerInternship],
  subTopics: [],
  strongCourses: [],
  projects: [],
  erasmus: null,
  helpWith: "Staj ve CV konusunda yardımcı olurum.",
  linkedinUrl: null,
  department: "Endüstri Mühendisliği",
  classYear: 4,
  menteeCapacity: 4,
};

function received(
  id: string,
  name: string,
  status: MentorshipRequestStatus,
): PeerMentoringRequest {
  return {
    id,
    mentor: { userId: "me", fullName: "Mert Demir", department: null },
    mentee: { userId: `student-${id}`, fullName: name, department: null },
    category: PeerTopicCategory.CareerInternship,
    message: "Staj başvurusu için CV'me bakar mısın?",
    status,
    createdAt: "2026-11-08T17:52:00Z",
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  gate.state = PeerMentorGateState.Earned;
  vi.mocked(getPeerMentorProfile).mockResolvedValue(PROFILE);
  vi.mocked(getReceivedPeerRequests).mockResolvedValue([
    received("r1", "Zeynep Koç", MentorshipRequestStatus.Pending),
    received("r2", "Can Tekin", MentorshipRequestStatus.Pending),
    received("r3", "Ayşe Yılmaz", MentorshipRequestStatus.Accepted),
  ]);
});

describe("IskurHomeView", () => {
  it("adds Mentorluk verdiğim and Mentor profilin for a published peer mentor", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<IskurHomeView />);

    const giving = await screen.findByRole("region", {
      name: "Mentorluk verdiğim",
    });
    expect(screen.getByTestId("home-main")).toContainElement(giving);
    expect(await within(giving).findByText("Zeynep Koç")).toBeVisible();
    expect(within(giving).getByText("Can Tekin")).toBeVisible();
    expect(within(giving).queryByText("Ayşe Yılmaz")).toBeNull();
    expect(
      within(giving).getByRole("link", { name: "Mentorluk Ver" }),
    ).toHaveAttribute("href", "/student/peer-mentoring?as=MENTOR");

    const card = screen.getByRole("region", { name: "Mentor profilin" });
    expect(screen.getByTestId("home-aside")).toContainElement(card);
    expect(within(card).getByText("1 / 4 mentee")).toBeVisible();
    expect(within(card).getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "1",
    );

    const zeynep = within(giving).getByText("Zeynep Koç").closest("li");
    if (!zeynep) throw new Error("row missing");
    await user.click(within(zeynep).getByRole("button", { name: "Kabul Et" }));
    await waitFor(() =>
      expect(vi.mocked(decideMentorRequest).mock.calls[0]?.[0]).toMatchObject({
        id: "r1",
        status: MentorshipRequestStatus.Accepted,
      }),
    );
  });

  it("points a badge holder without a profile to the wizard", async () => {
    vi.mocked(getPeerMentorProfile).mockResolvedValue(null);
    renderWithQueryClient(<IskurHomeView />);

    expect(
      await screen.findByRole("link", { name: "Mentor profilini oluştur" }),
    ).toHaveAttribute("href", "/student/peer-mentoring/profile");
    expect(screen.getByTestId("home-main")).toBeEmptyDOMElement();
    expect(getReceivedPeerRequests).not.toHaveBeenCalled();
  });

  it("keeps the shared home when the profile can't be read, instead of offering the wizard", async () => {
    vi.mocked(getPeerMentorProfile).mockRejectedValue(new Error("down"));
    renderWithQueryClient(<IskurHomeView />);

    await waitFor(() => expect(getPeerMentorProfile).toHaveBeenCalled());
    await waitFor(() =>
      expect(screen.getByTestId("home-aside")).toBeEmptyDOMElement(),
    );
    expect(
      screen.queryByRole("link", { name: "Mentor profilini oluştur" }),
    ).toBeNull();
  });

  it("points an İŞKUR student without the badge to Mentorluk Ver", async () => {
    gate.state = PeerMentorGateState.NoBadge;
    renderWithQueryClient(<IskurHomeView />);

    expect(
      await screen.findByRole("link", { name: "Mentorluk Ver'e git" }),
    ).toHaveAttribute("href", "/student/peer-mentoring?as=MENTOR");
    expect(getPeerMentorProfile).not.toHaveBeenCalled();
  });

  it("leaves the shared home alone for everyone else", () => {
    gate.state = PeerMentorGateState.Hidden;
    renderWithQueryClient(<IskurHomeView />);

    expect(screen.getByTestId("home-main")).toBeEmptyDOMElement();
    expect(screen.getByTestId("home-aside")).toBeEmptyDOMElement();
  });
});
