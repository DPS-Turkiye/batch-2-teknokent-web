import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MobileStartupView } from "@/components/mobile/mobile-startup-view";
import type { useMobileStartup } from "@/hooks/use-mobile-startup";
import { StartupHealth } from "@/lib/mobile-startups";
import { InLocale } from "@test/test-utils";

type Startup = ReturnType<typeof useMobileStartup>;

const toggleMembers = vi.fn();
let startup: Startup;

vi.mock("@/hooks/use-mobile-startup", () => ({
  useMobileStartup: () => startup,
}));

vi.mock("next/link", () => import("@test/mocks/next-link"));

function state(overrides: Partial<Startup> = {}): Startup {
  return {
    backHref: "/m/startups",
    detail: {
      card: {
        id: "atlas",
        name: "Atlas AI",
        initials: "AA",
        program: "METU Stars 2026",
        health: StartupHealth.Active,
        nextLine: "Yarın · 14:00 · Ürün stratejisi",
        href: "/m/startups/atlas",
      },
      chatHref: "/m/messages/mentorship/r1",
      meetingsHref: "/m/calendar?meeting=next",
      upcoming: {
        when: "Yarın · 14:00–15:00",
        detail: "Ürün stratejisi · 5. görüşme · Online",
      },
      info: [
        { label: "Konu", value: "Ürün stratejisi" },
        { label: "Başlangıç", value: "2 Haziran 2026" },
        { label: "Görüşme sıklığı", value: "2 haftada 1" },
      ],
      lead: { name: "Gamze Kozak", initials: "GK", title: "CEO & Co-founder" },
      members: {
        initials: ["BA", "CT"],
        count: 2,
        names: ["Barış Arslan", "Can Tunç"],
      },
      tasks: "3 / 5 tamamlandı",
      files: "4 dosya · son 2 gün önce",
      notesHref: "/mentorships/requests/r1?web=1",
    },
    isError: false,
    isLoading: false,
    membersOpen: false,
    retry: vi.fn(),
    toggleMembers,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  startup = state();
});

describe("MobileStartupView", () => {
  it("shows the startup, its quick actions and the upcoming meeting", () => {
    render(<MobileStartupView organizationId="atlas" />);

    expect(
      screen.getByRole("heading", { name: "Atlas AI" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Mesaj" })).toHaveAttribute(
      "href",
      "/m/messages/mentorship/r1",
    );
    expect(screen.getByRole("link", { name: "Görüşmeler" })).toHaveAttribute(
      "href",
      "/m/calendar?meeting=next",
    );
    expect(
      within(
        screen.getByRole("region", { name: "Yaklaşan görüşme" }),
      ).getByText("Ürün stratejisi · 5. görüşme · Online"),
    ).toBeInTheDocument();
  });

  it("lists the mentorship facts, the team lead, tasks and files", () => {
    render(<MobileStartupView organizationId="atlas" />);

    expect(screen.getByText("2 haftada 1")).toBeInTheDocument();
    expect(screen.getByText("Takım yetkilisi")).toBeInTheDocument();
    expect(screen.getByText("3 / 5 tamamlandı")).toBeInTheDocument();
    expect(screen.getByText("4 dosya · son 2 gün önce")).toBeInTheDocument();
  });

  it("opens the notes on the web with a full page load, phone links in the app", () => {
    render(<MobileStartupView organizationId="atlas" />);

    for (const name of [/Verilen görevler/, /Dosyalar/, "Web’de Aç"]) {
      const link = screen.getByRole("link", { name });
      expect(link).toHaveAttribute("href", "/mentorships/requests/r1?web=1");
      expect(link).not.toHaveAttribute("data-next-link");
    }
    expect(screen.getByRole("link", { name: "Mesaj" })).toHaveAttribute(
      "data-next-link",
    );
  });

  it("labels the actions, sections and web links in English", () => {
    render(
      <InLocale locale="en">
        <MobileStartupView organizationId="atlas" />
      </InLocale>,
    );

    expect(
      screen.getByRole("link", { name: "Back to startups" }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "Message" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Meetings" })).toBeVisible();
    expect(
      screen.getByRole("region", { name: "Upcoming meeting" }),
    ).toHaveTextContent("UPCOMING MEETING");
    expect(
      screen.getByRole("region", { name: "Mentorship details" }),
    ).toBeVisible();
    expect(screen.getByText("Team lead")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /2 team members/ }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "Open on Web" })).toBeVisible();
  });

  it("unfolds the team members", async () => {
    render(<MobileStartupView organizationId="atlas" />);

    await userEvent.click(screen.getByRole("button", { name: /2 ekip üyesi/ }));

    expect(toggleMembers).toHaveBeenCalled();
  });

  it("says so for a startup without an active mentorship", () => {
    startup = state({ detail: null });
    render(<MobileStartupView organizationId="gone" />);

    expect(
      screen.getByText("Bu startup ile aktif bir mentorluğun yok."),
    ).toBeInTheDocument();
  });
});
