import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MobileStartupsView } from "@/components/mobile/mobile-startups-view";
import {
  StartupTab,
  type useMobileStartups,
} from "@/hooks/use-mobile-startups";
import { StartupHealth } from "@/lib/mobile-startups";
import { InLocale } from "@test/test-utils";

type Startups = ReturnType<typeof useMobileStartups>;

vi.mock("@/hooks/use-mobile-startups", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/hooks/use-mobile-startups")>()),
  useMobileStartups: () => startups,
}));

const setTab = vi.fn();
const toggleSearch = vi.fn();
let startups: Startups;

function state(overrides: Partial<Startups> = {}): Startups {
  return {
    counts: { active: 2, past: 1 },
    isError: false,
    isLoading: false,
    isSearching: false,
    query: "",
    retry: vi.fn(),
    setQuery: vi.fn(),
    setTab,
    shown: [
      {
        id: "lumen",
        name: "Lumen",
        initials: "LU",
        program: "BİGG 2026",
        health: StartupHealth.Attention,
        nextLine: "Planlanmadı · 8 gündür görüşme yok · Finansal model",
        href: "/m/startups/lumen",
      },
      {
        id: "atlas",
        name: "Atlas AI",
        initials: "AA",
        program: "METU Stars 2026",
        health: StartupHealth.Active,
        nextLine: "Yarın · 14:00 · Ürün stratejisi",
        href: "/m/startups/atlas",
      },
    ],
    tab: StartupTab.Active,
    toggleSearch,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  startups = state();
});

describe("MobileStartupsView", () => {
  it("shows each startup card with its status and next meeting", () => {
    render(<MobileStartupsView />);

    const list = screen.getByRole("list", { name: "Startuplar" });
    const cards = within(list).getAllByRole("link");
    expect(cards[0]).toHaveAttribute("href", "/m/startups/lumen");
    expect(cards[0]).toHaveTextContent("Dikkat");
    expect(cards[1]).toHaveTextContent("Aktif");
    expect(cards[1]).toHaveTextContent("Yarın · 14:00 · Ürün stratejisi");
  });

  it("switches to past mentorships and opens the search", async () => {
    render(<MobileStartupsView />);

    await userEvent.click(screen.getByRole("tab", { name: /Geçmiş/ }));
    await userEvent.click(screen.getByRole("button", { name: "Startup ara" }));

    expect(setTab).toHaveBeenCalledWith(StartupTab.Past);
    expect(toggleSearch).toHaveBeenCalled();
  });

  it("names the tabs, the status chips and the search in English", () => {
    render(
      <InLocale locale="en">
        <MobileStartupsView />
      </InLocale>,
    );

    expect(screen.getByRole("heading", { name: "My startups" })).toBeVisible();
    expect(screen.getByRole("tab", { name: /Active/ })).toBeVisible();
    expect(screen.getByRole("tab", { name: /Past/ })).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Search startups" }),
    ).toBeVisible();
    const cards = within(
      screen.getByRole("list", { name: "Startups" }),
    ).getAllByRole("link");
    expect(cards[0]).toHaveTextContent("Attention");
    expect(cards[1]).toHaveTextContent("Active");
  });

  it("explains an empty list of active startups", () => {
    startups = state({ shown: [], counts: { active: 0, past: 0 } });
    render(<MobileStartupsView />);

    expect(
      screen.getByText("Henüz aktif bir mentorluk ilişkiniz bulunmuyor."),
    ).toBeInTheDocument();
  });
});
