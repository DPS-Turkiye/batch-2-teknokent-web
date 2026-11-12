import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PeerMentoringView } from "@/components/student/peer-mentoring-view";
import {
  PeerMentorGateState,
  PeerTopicCategory,
} from "@/interfaces/peer-mentoring";
import {
  addPeerMentoringRequestFixture,
  peerMentorCountsFixture,
  peerMentoringRequestsFixture,
  peerMentorsFixture,
  resetPeerMentoringFixtures,
} from "@test/fixtures/peer-mentoring";
import { InLocale, renderWithQueryClient } from "@test/test-utils";

const gate = { state: PeerMentorGateState.Hidden };
vi.mock("@/hooks/use-peer-mentor-give", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/hooks/use-peer-mentor-give")>()),
  usePeerMentorGate: () => ({
    state: gate.state,
    gateAward: null,
    isLoading: false,
    sessionBehind: false,
  }),
}));

vi.mock("@/lib/client/peer-mentoring", () => ({
  getPeerCategories: vi.fn(async () => {
    const { PEER_TOPIC_CATEGORIES } =
      await import("@/interfaces/peer-mentoring");
    return [...PEER_TOPIC_CATEGORIES];
  }),
  getPeerMentors: vi.fn(async (filter) =>
    structuredClone(peerMentorsFixture(filter)),
  ),
  getPeerMentorCounts: vi.fn(async () => {
    const { PEER_TOPIC_CATEGORIES } =
      await import("@/interfaces/peer-mentoring");
    return peerMentorCountsFixture(PEER_TOPIC_CATEGORIES);
  }),
  getPeerMentoringRequests: vi.fn(async () =>
    structuredClone(peerMentoringRequestsFixture()),
  ),
  createPeerMentoringRequest: vi.fn(async (input) =>
    structuredClone(addPeerMentoringRequestFixture(input)),
  ),
}));

let interests: string[] = [];
vi.mock("@/lib/client/student-profile-completion", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("@/lib/client/student-profile-completion")
  >()),
  getStudentProfileCompletion: vi.fn(async () => ({
    topics: interests,
    subtopics: [],
    goal: "",
    completed: true,
    skipped: false,
  })),
}));

const replace = vi.fn();
let search = "";
vi.mock("@/lib/client/training", async () => {
  const { TrainingState } = await import("@/interfaces/training");
  return {
    getStudentTraining: vi.fn(async () => ({
      state: TrainingState.NotAvailable,
    })),
  };
});
vi.mock("next/navigation", () => ({
  usePathname: () => "/student/peer-mentoring",
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams(search),
}));

beforeEach(() => {
  interests = [];
  gate.state = PeerMentorGateState.Hidden;
  search = "";
  replace.mockClear();
  resetPeerMentoringFixtures();
});

async function mentorCard(name: string) {
  const recommended = await screen.findByRole("region", {
    name: /Sana önerilenler/,
  });
  return within(recommended).findByRole("article", { name });
}

describe("PeerMentoringView › Keşfet", () => {
  it("recommends the mentors with a reason and lists the rest under Mentor ara", async () => {
    renderWithQueryClient(<PeerMentoringView />);

    const deniz = await mentorCard("Deniz Kaya");
    expect(
      within(deniz).getByText("Bilgisayar Mühendisliği · Akran Mentoru"),
    ).toBeVisible();
    expect(within(deniz).getByText("Neden önerildi?")).toBeVisible();
    expect(within(deniz).getByText("Bu derste güçlü: CENG 242")).toBeVisible();
    expect(
      within(deniz).getByRole("button", {
        name: "Mentorluk Talebi Gönder, Deniz Kaya",
      }),
    ).toBeEnabled();
    expect(
      within(deniz).getByRole("link", { name: "Profili Gör, Deniz Kaya" }),
    ).toHaveAttribute("href", "/student/peer-mentoring/mentors/fixture-peer-1");

    const search = screen.getByRole("region", { name: "Mentor ara" });
    expect(
      within(search).getByRole("heading", { name: "Zeynep Arslan" }),
    ).toBeVisible();
    expect(within(search).getByText("Psikoloji · 3. sınıf")).toBeVisible();
    expect(
      within(search).getByRole("link", { name: "Profili Gör, Zeynep Arslan" }),
    ).toHaveAttribute("href", "/student/peer-mentoring/mentors/fixture-peer-4");
  });

  it("adds the student's matching interests to Neden önerildi", async () => {
    interests = [
      PeerTopicCategory.TechnicalDigital,
      PeerTopicCategory.CampusLife,
    ];
    renderWithQueryClient(<PeerMentoringView />);

    const card = await mentorCard("Deniz Kaya");
    expect(
      await within(card).findByText(
        "İlgi alanlarınla eşleşiyor: Teknik ve Dijital Beceriler",
      ),
    ).toBeVisible();
    expect(within(card).getByText("Aynı bölüm")).toBeVisible();
    const elif = await mentorCard("Elif Şahin");
    expect(within(elif).queryByText(/İlgi alanlarınla eşleşiyor/)).toBeNull();
  });

  it("blocks a second request to the same mentor and requests to a full mentor", async () => {
    renderWithQueryClient(<PeerMentoringView />);

    const elif = await mentorCard("Elif Şahin");
    await waitFor(() =>
      expect(
        within(elif).getByRole("button", { name: "Talebin yanıt bekliyor" }),
      ).toBeDisabled(),
    );
    const mert = await mentorCard("Mert Aydın");
    expect(
      within(mert).getByRole("button", { name: "Kontenjan dolu" }),
    ).toBeDisabled();
  });

  it("filters by a category card and by text", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<PeerMentoringView />);
    await mentorCard("Deniz Kaya");

    const international = screen.getByRole("button", {
      name: /^Uluslararası Fırsatlar/,
    });
    await user.click(international);
    expect(international).toHaveAttribute("aria-pressed", "true");
    await waitFor(() =>
      expect(screen.queryByRole("heading", { name: "Deniz Kaya" })).toBeNull(),
    );
    // While filtering, every match is a search result.
    expect(
      screen.queryByRole("region", { name: /Sana önerilenler/ }),
    ).toBeNull();
    expect(screen.getByRole("heading", { name: "Elif Şahin" })).toBeVisible();

    await user.click(international);
    await user.type(
      screen.getByPlaceholderText("Mentor veya konu ara"),
      "psikoloji",
    );
    await waitFor(() =>
      expect(screen.queryByRole("heading", { name: "Deniz Kaya" })).toBeNull(),
    );
    expect(
      screen.getByRole("heading", { name: "Zeynep Arslan" }),
    ).toBeVisible();

    await user.type(screen.getByPlaceholderText("Mentor veya konu ara"), "xyz");
    expect(
      await screen.findByText("Bu filtrelere uyan akran mentoru yok."),
    ).toBeVisible();
  });

  it("shows how many of the program's mentors offer each category", async () => {
    renderWithQueryClient(<PeerMentoringView />);

    expect(
      await screen.findByRole("button", { name: "Kariyer ve Staj, 1 mentor" }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Uluslararası Fırsatlar, 1 mentor" }),
    ).toBeVisible();
  });

  it("filters by a sub-topic and by a free slot this week", async () => {
    const user = userEvent.setup();
    const { getPeerMentors } = await import("@/lib/client/peer-mentoring");
    renderWithQueryClient(<PeerMentoringView />);
    await mentorCard("Deniz Kaya");

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Alt konu" }),
      "Örnek: Değişim programları",
    );
    await waitFor(() =>
      expect(screen.queryByRole("heading", { name: "Deniz Kaya" })).toBeNull(),
    );
    expect(screen.getByRole("heading", { name: "Elif Şahin" })).toBeVisible();
    expect(vi.mocked(getPeerMentors)).toHaveBeenLastCalledWith(
      expect.objectContaining({ subTopic: "fixture-exchange" }),
    );

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Alt konu" }),
      "Tüm alt konular",
    );
    const thisWeek = screen.getByRole("button", { name: "Bu hafta müsait" });
    await user.click(thisWeek);
    expect(thisWeek).toHaveAttribute("aria-pressed", "true");
    await waitFor(() =>
      expect(screen.queryByRole("heading", { name: "Elif Şahin" })).toBeNull(),
    );
    const search = screen.getByRole("region", { name: "Mentor ara" });
    expect(
      within(search).getByRole("heading", { name: "Deniz Kaya" }),
    ).toBeVisible();
    // The two rows say so; the third match is the filter button itself.
    expect(
      within(search).getAllByText("Bu hafta müsait", { selector: "span" }),
    ).toHaveLength(2);
  });

  it("offers only the chosen category's sub-topics and drops one that no longer applies", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<PeerMentoringView />);
    await mentorCard("Deniz Kaya");
    const subTopic = screen.getByRole("combobox", { name: "Alt konu" });
    await user.selectOptions(subTopic, "Örnek: CV hazırlama");

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Kategori" }),
      "Uluslararası Fırsatlar",
    );

    expect(subTopic).toHaveValue("ALL");
    expect(
      within(subTopic)
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual(["Tüm alt konular", "Örnek: Değişim programları"]);
  });

  it("sends a request after a long enough message and lists it under Mentorluklarım", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<PeerMentoringView />);
    const deniz = await mentorCard("Deniz Kaya");

    await user.click(
      within(deniz).getByRole("button", {
        name: "Mentorluk Talebi Gönder, Deniz Kaya",
      }),
    );
    const dialog = screen.getByRole("dialog", {
      name: "Mentorluk talebi gönder",
    });
    expect(
      within(dialog).getByText("Deniz Kaya · Akran Mentoru"),
    ).toBeVisible();
    expect(within(dialog).getByLabelText(/Konu/)).toHaveValue(
      "CAREER_INTERNSHIP",
    );

    await user.type(within(dialog).getByLabelText("Kısa mesaj"), "Merhaba");
    expect(within(dialog).getByText(/7 \/ 1000$/)).toBeVisible();
    await user.click(
      within(dialog).getByRole("button", { name: "Mentorluk Talebi Gönder" }),
    );
    expect(within(dialog).getByRole("alert")).toHaveTextContent(
      "Mesajın en az 20 karakter olmalı.",
    );

    await user.selectOptions(
      within(dialog).getByLabelText(/Konu/),
      "TECHNICAL_DIGITAL",
    );
    await user.type(
      within(dialog).getByLabelText("Kısa mesaj"),
      ", teknik mülakatlara nasıl hazırlanmalıyım?",
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Mentorluk Talebi Gönder" }),
    );

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(screen.getByText("Talebin gönderildi.")).toBeVisible();
    expect(
      within(await mentorCard("Deniz Kaya")).getByRole("button", {
        name: "Talebin yanıt bekliyor",
      }),
    ).toBeDisabled();

    await user.click(screen.getByRole("tab", { name: /Mentorluklarım/ }));
    const mine = screen.getByRole("tabpanel", { name: /Mentorluklarım/ });
    const requests = within(mine).getByRole("region", { name: /Taleplerim/ });
    expect(await within(requests).findByText("Deniz Kaya")).toBeVisible();
    expect(
      within(requests).getByText(/Teknik ve Dijital Beceriler/),
    ).toBeVisible();
  });
});

describe("PeerMentoringView › program categories", () => {
  it("says the program has no active category yet instead of 'no mentors'", async () => {
    const { getPeerCategories } = await import("@/lib/client/peer-mentoring");
    const { getPeerMentors } = await import("@/lib/client/peer-mentoring");
    vi.mocked(getPeerCategories).mockResolvedValueOnce([]);
    vi.mocked(getPeerMentors).mockResolvedValueOnce([]);
    renderWithQueryClient(<PeerMentoringView />);

    expect(
      await screen.findByText(
        "Programında henüz etkin akran mentörlüğü kategorisi yok.",
      ),
    ).toBeInTheDocument();
  });

  it("offers only the program's active categories as filters", async () => {
    const { PeerTopicCategory } = await import("@/interfaces/peer-mentoring");
    const { getPeerCategories } = await import("@/lib/client/peer-mentoring");
    vi.mocked(getPeerCategories).mockResolvedValueOnce([
      PeerTopicCategory.CareerInternship,
    ]);
    renderWithQueryClient(<PeerMentoringView />);

    expect(
      await screen.findByRole("button", { name: /^Kariyer ve Staj/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Uluslararası Fırsatlar/ }),
    ).not.toBeInTheDocument();
  });
});

describe("PeerMentoringView › switch", () => {
  it("shows only Mentorluk Al to a student who is neither in İŞKUR nor a peer mentor", async () => {
    renderWithQueryClient(<PeerMentoringView />);
    expect(screen.getByRole("tab", { name: "Keşfet" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.queryByRole("button", { name: "Mentorluk Ver" })).toBeNull();
  });

  it("answers a Mentorluk Ver link from such a student with Mentorluk Al", async () => {
    search = "as=MENTOR";
    renderWithQueryClient(<PeerMentoringView />);
    expect(await mentorCard("Deniz Kaya")).toBeVisible();
  });

  it("offers Mentorluk Ver to an İŞKUR student without the badge, with the tour anchor on it", async () => {
    gate.state = PeerMentorGateState.NoBadge;
    const user = userEvent.setup();
    renderWithQueryClient(<PeerMentoringView />);

    const give = screen.getByRole("button", { name: "Mentorluk Ver" });
    expect(give).toHaveAttribute("data-tour", "peer-mentoring-give-toggle");
    await user.click(give);
    expect(replace).toHaveBeenCalledWith("/student/peer-mentoring?as=MENTOR", {
      scroll: false,
    });

    search = "as=MENTOR";
    renderWithQueryClient(<PeerMentoringView />);
    expect(
      screen.getByRole("heading", {
        name: "Mentor olmak için eğitimi tamamla",
      }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Eğitime Git" })).toBeDisabled();
  });

  it("reads in English", async () => {
    renderWithQueryClient(
      <InLocale locale="en">
        <PeerMentoringView />
      </InLocale>,
    );
    expect(screen.getByRole("tab", { name: "Discover" })).toBeVisible();
    expect(
      await screen.findByRole("button", {
        name: "Send a mentoring request, Deniz Kaya",
      }),
    ).toBeVisible();
    expect(
      screen.getAllByText("Careers and internships").length,
    ).toBeGreaterThan(0);
  });
});
