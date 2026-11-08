import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PeerMentoringView } from "@/components/student/peer-mentoring-view";
import { PeerMentorGateState } from "@/interfaces/peer-mentoring";
import {
  addPeerMentoringRequestFixture,
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
  getPeerMentoringRequests: vi.fn(async () =>
    structuredClone(peerMentoringRequestsFixture()),
  ),
  createPeerMentoringRequest: vi.fn(async (input) =>
    structuredClone(addPeerMentoringRequestFixture(input)),
  ),
}));

const replace = vi.fn();
let search = "";
vi.mock("next/navigation", () => ({
  usePathname: () => "/student/peer-mentoring",
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams(search),
}));

beforeEach(() => {
  gate.state = PeerMentorGateState.Hidden;
  search = "";
  replace.mockClear();
  resetPeerMentoringFixtures();
});

async function mentorCard(name: string) {
  const heading = await screen.findByRole("heading", { name });
  return heading.closest("article") as HTMLElement;
}

describe("PeerMentoringView › Mentorluk Al", () => {
  it("lists the student's requests and the peer mentors with why they are recommended", async () => {
    renderWithQueryClient(<PeerMentoringView />);

    const requests = screen.getByRole("region", { name: "Taleplerim" });
    expect(await within(requests).findByText("Elif Şahin")).toBeVisible();
    expect(within(requests).getByText("Yanıt Bekleniyor")).toBeVisible();

    const deniz = await mentorCard("Deniz Kaya");
    expect(
      within(deniz).getByText("Bilgisayar Mühendisliği · 4. sınıf"),
    ).toBeVisible();
    expect(within(deniz).getByText("Neden önerildi?")).toBeVisible();
    expect(within(deniz).getByText("Bu derste güçlü: CENG 242")).toBeVisible();
    expect(within(deniz).getByText("10 Görüşme")).toBeVisible();
    expect(
      within(deniz).getByRole("button", {
        name: "Deniz Kaya için talep gönder",
      }),
    ).toBeEnabled();
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

  it("filters by category and by text", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<PeerMentoringView />);
    await mentorCard("Deniz Kaya");

    await user.click(
      screen.getByRole("button", { name: "Uluslararası Fırsatlar" }),
    );
    await waitFor(() =>
      expect(screen.queryByRole("heading", { name: "Deniz Kaya" })).toBeNull(),
    );
    expect(screen.getByRole("heading", { name: "Elif Şahin" })).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Tümü" }));
    await user.type(
      screen.getByPlaceholderText("İsim, bölüm veya konu ara"),
      "psikoloji",
    );
    await waitFor(() =>
      expect(screen.queryByRole("heading", { name: "Deniz Kaya" })).toBeNull(),
    );
    expect(
      screen.getByRole("heading", { name: "Zeynep Arslan" }),
    ).toBeVisible();

    await user.type(
      screen.getByPlaceholderText("İsim, bölüm veya konu ara"),
      "xyz",
    );
    expect(
      await screen.findByText("Bu filtrelere uyan akran mentoru yok."),
    ).toBeVisible();
  });

  it("sends a request after a long enough message and lists it as waiting", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<PeerMentoringView />);
    const deniz = await mentorCard("Deniz Kaya");

    await user.click(
      within(deniz).getByRole("button", {
        name: "Deniz Kaya için talep gönder",
      }),
    );
    const dialog = screen.getByRole("dialog", {
      name: "Deniz Kaya ile mentorluk",
    });
    expect(within(dialog).getByLabelText("Konu")).toHaveValue(
      "CAREER_INTERNSHIP",
    );

    await user.type(within(dialog).getByLabelText("Mesajın"), "Merhaba");
    await user.click(
      within(dialog).getByRole("button", { name: "Talebi gönder" }),
    );
    expect(within(dialog).getByRole("alert")).toHaveTextContent(
      "Mesajın en az 20 karakter olmalı.",
    );

    await user.selectOptions(
      within(dialog).getByLabelText("Konu"),
      "TECHNICAL_DIGITAL",
    );
    await user.type(
      within(dialog).getByLabelText("Mesajın"),
      ", teknik mülakatlara nasıl hazırlanmalıyım?",
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Talebi gönder" }),
    );

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(screen.getByText("Talebin gönderildi.")).toBeVisible();
    const requests = screen.getByRole("region", { name: "Taleplerim" });
    expect(await within(requests).findByText("Deniz Kaya")).toBeVisible();
    expect(
      within(requests).getByText(/Teknik ve Dijital Beceriler/),
    ).toBeVisible();
    expect(
      within(await mentorCard("Deniz Kaya")).getByRole("button", {
        name: "Talebin yanıt bekliyor",
      }),
    ).toBeDisabled();
  });
});

describe("PeerMentoringView › program categories", () => {
  it("offers only the program's active categories as filters", async () => {
    const { PeerTopicCategory } = await import("@/interfaces/peer-mentoring");
    const { getPeerCategories } = await import("@/lib/client/peer-mentoring");
    vi.mocked(getPeerCategories).mockResolvedValueOnce([
      PeerTopicCategory.CareerInternship,
    ]);
    renderWithQueryClient(<PeerMentoringView />);

    expect(
      await screen.findByRole("button", { name: "Kariyer ve Staj" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Uluslararası Fırsatlar" }),
    ).not.toBeInTheDocument();
  });
});

describe("PeerMentoringView › switch", () => {
  it("shows only Mentorluk Al to a student who is neither in İŞKUR nor a peer mentor", async () => {
    renderWithQueryClient(<PeerMentoringView />);
    expect(screen.getByRole("tab", { name: "Mentorluk Al" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.queryByRole("tab", { name: "Mentorluk Ver" })).toBeNull();
  });

  it("answers a Mentorluk Ver link from such a student with Mentorluk Al", async () => {
    search = "as=MENTOR";
    renderWithQueryClient(<PeerMentoringView />);
    expect(
      await screen.findByRole("region", { name: "Taleplerim" }),
    ).toBeVisible();
  });

  it("offers Mentorluk Ver to an İŞKUR student without the badge as Rozet Yok", async () => {
    gate.state = PeerMentorGateState.NoBadge;
    const user = userEvent.setup();
    renderWithQueryClient(<PeerMentoringView />);

    await user.click(screen.getByRole("tab", { name: "Mentorluk Ver" }));
    expect(replace).toHaveBeenCalledWith("/student/peer-mentoring?as=MENTOR", {
      scroll: false,
    });

    search = "as=MENTOR";
    renderWithQueryClient(<PeerMentoringView />);
    expect(screen.getByText("Rozet Yok")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Eğitimi başlat (yakında)" }),
    ).toBeDisabled();
  });

  it("reads in English", async () => {
    renderWithQueryClient(
      <InLocale locale="en">
        <PeerMentoringView />
      </InLocale>,
    );
    expect(screen.getByRole("tab", { name: "Get mentoring" })).toBeVisible();
    expect(
      await screen.findByRole("button", {
        name: "Send a request to Deniz Kaya",
      }),
    ).toBeVisible();
    expect(
      screen.getAllByText("Careers and internships").length,
    ).toBeGreaterThan(0);
  });
});
