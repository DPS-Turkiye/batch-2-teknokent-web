import { screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PersonSummaryView } from "@/components/people/person-summary-view";
import { ClientApiError } from "@/lib/client/api";
import { getPersonSummary } from "@/lib/client/person-summary";
import { menteeSummary, mentorSummary } from "@test/fixtures/person-summary";
import { renderWithQueryClient } from "@test/test-utils";

const navigation = vi.hoisted(() => ({
  pathname: "/admin/users/mentor-1",
  back: vi.fn(),
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({ back: navigation.back, push: navigation.push }),
}));

vi.mock("@/lib/client/person-summary", () => ({ getPersonSummary: vi.fn() }));
vi.mock("@/lib/client/team-changes", () => ({ getTeamHistory: vi.fn() }));

describe("PersonSummaryView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigation.pathname = "/admin/users/mentor-1";
  });

  it("shows who a mentor is, what they do and their programs", async () => {
    vi.mocked(getPersonSummary).mockResolvedValue(mentorSummary());
    renderWithQueryClient(<PersonSummaryView userId="mentor-1" />);

    expect(
      await screen.findByRole("heading", { name: "Deniz Yıldız" }),
    ).toBeInTheDocument();
    expect(getPersonSummary).toHaveBeenCalledWith("mentor-1");
    expect(screen.getByText("Ürün lideri · Örnek Şirket")).toBeInTheDocument();
    expect(screen.getByText("Onaylı")).toBeInTheDocument();
    expect(
      screen.getByText("Erken aşama ekiplerle ürün keşfi üzerine çalışıyor."),
    ).toBeInTheDocument();
    expect(screen.getByText("Ürün stratejisi")).toBeInTheDocument();
    expect(screen.getByText("Türkçe, İngilizce")).toBeInTheDocument();
    expect(
      screen.getByText("Ürün Direktörü · Örnek Şirket"),
    ).toBeInTheDocument();
    expect(screen.getByText("Örnek Üniversitesi · MBA")).toBeInTheDocument();
    expect(screen.getByText("2 / 4")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "deniz@example.test" }),
    ).toHaveAttribute("href", "mailto:deniz@example.test");
    expect(
      screen.getByRole("link", { name: "LinkedIn profili" }),
    ).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByRole("link", { name: "Yeşil Program" })).toHaveAttribute(
      "href",
      "/admin/programs/program-1",
    );
    expect(
      screen.getByText("Katılma isteği onay bekliyor"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Girişim")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Takım geçmişi" }),
    ).not.toBeInTheDocument();
  });

  it("shows a mentee's startup and team history, with coordinator program links", async () => {
    navigation.pathname = "/coordinator/people/mentee-1";
    vi.mocked(getPersonSummary).mockResolvedValue(menteeSummary());
    renderWithQueryClient(<PersonSummaryView userId="mentee-1" />);

    expect(
      await screen.findByRole("heading", { name: "Ece Kaya" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Kurucu ortak")).toBeInTheDocument();
    expect(screen.getByText("Onay bekliyor")).toBeInTheDocument();
    expect(
      screen.getByText("Yerel üreticileri alıcılarla buluşturuyor."),
    ).toBeInTheDocument();
    const card = within(screen.getByRole("region", { name: "Girişim" }));
    expect(card.getByText("Pazar Lab")).toBeInTheDocument();
    expect(
      card.getByText("Üreticiler alıcıya ulaşamıyor."),
    ).toBeInTheDocument();
    expect(card.getByText("2025")).toBeInTheDocument();
    expect(card.getByRole("link", { name: "Web sitesi" })).toHaveAttribute(
      "href",
      "https://pazarlab.example.test",
    );
    expect(screen.getByRole("link", { name: "Yeşil Program" })).toHaveAttribute(
      "href",
      "/coordinator/programs/program-1",
    );
    expect(
      screen.getByRole("button", { name: "Takım geçmişi" }),
    ).toBeInTheDocument();
  });

  it("shows the times a mentor opened, grouped by day, with days off and extra slots", async () => {
    vi.mocked(getPersonSummary).mockResolvedValue(mentorSummary());
    renderWithQueryClient(<PersonSummaryView userId="mentor-1" />);

    const card = within(
      await screen.findByRole("region", { name: "Müsait zamanlar" }),
    );
    expect(card.getByText("Pazartesi")).toBeInTheDocument();
    expect(card.getByText("09:00–10:00")).toBeInTheDocument();
    expect(card.getByText("Salı")).toBeInTheDocument();
    expect(card.getByText("14:00–15:00, 10:00–12:00")).toBeInTheDocument();
    expect(card.getByText("Yaklaşan izin günleri")).toBeInTheDocument();
    expect(card.getByText(/20.*22 Kasım/)).toBeInTheDocument();
    expect(card.getByText("Ek zamanlar")).toBeInTheDocument();
    expect(card.getByText(/12:00 \(45 dk\)$/)).toBeInTheDocument();
  });

  it("says so when a mentor has not set any times", async () => {
    const mentor = mentorSummary().mentor;
    vi.mocked(getPersonSummary).mockResolvedValue(
      mentorSummary({
        mentor: mentor && {
          ...mentor,
          availability: { weekly: [], daysOff: [], extraSlots: [] },
        },
      }),
    );
    renderWithQueryClient(<PersonSummaryView userId="mentor-1" />);

    const card = within(
      await screen.findByRole("region", { name: "Müsait zamanlar" }),
    );
    expect(
      card.getByText("Henüz müsait zaman eklenmemiş."),
    ).toBeInTheDocument();
  });

  it("shows no availability card for a mentee, who keeps none", async () => {
    vi.mocked(getPersonSummary).mockResolvedValue(menteeSummary());
    renderWithQueryClient(<PersonSummaryView userId="mentee-1" />);

    await screen.findByRole("heading", { name: "Ece Kaya" });
    expect(
      screen.queryByRole("region", { name: "Müsait zamanlar" }),
    ).toBeNull();
  });

  it("never turns a non-web LinkedIn or website value into a link", async () => {
    vi.mocked(getPersonSummary).mockResolvedValue(
      menteeSummary({
        linkedinUrl: "javascript:alert(1)",
        startup: {
          ...menteeSummary().startup!,
          website: "javascript:alert(1)",
        },
      }),
    );
    renderWithQueryClient(<PersonSummaryView userId="mentee-1" />);

    await screen.findByRole("heading", { name: "Ece Kaya" });
    expect(screen.queryByRole("link", { name: "LinkedIn profili" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Web sitesi" })).toBeNull();
  });

  it("says when the profile is missing or out of reach and offers the list", async () => {
    navigation.pathname = "/coordinator/people/someone";
    vi.mocked(getPersonSummary).mockRejectedValue(
      new ClientApiError("User not found", 404),
    );
    renderWithQueryClient(<PersonSummaryView userId="someone" />);

    expect(
      await screen.findByText("Bu profil bulunamadı ya da görme yetkin yok."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Listeye dön" })).toHaveAttribute(
      "href",
      "/coordinator/programs",
    );
    expect(getPersonSummary).toHaveBeenCalledTimes(1);
  });
});
