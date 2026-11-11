import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MentorshipsView } from "@/components/admin/mentorships-view";
import type {
  AdminOverview,
  AdminRequest,
  AdminUser,
} from "@/interfaces/admin-overview";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import { ProgramStatus } from "@/interfaces/program";
import { UserAccountStatus, UserRole } from "@/interfaces/session";
import { MentorshipTab } from "@/types/admin-mentorships";
import {
  adminMentorship,
  adminProgram,
  adminStartup,
} from "@test/fixtures/admin-programs";
import { freezeDate, renderWithQueryClient } from "@test/test-utils";

const overviewState = vi.hoisted(() => {
  const state: { current: AdminOverview | undefined } = { current: undefined };
  return state;
});

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/hooks/use-admin-overview", () => ({
  useAdminOverview: () => ({
    data: overviewState.current,
    isLoading: false,
    error: null,
  }),
}));

const TEAMS = /^(Lumen|Nova|Orbit|Zeta|Beta|Kappa)$/;

function startup(
  id: string,
  name: string,
  programId: string,
  programName: string,
) {
  return adminStartup({ id, name, programId, programName });
}

const stars = adminProgram({
  id: "stars",
  name: "ODTÜ Stars 2026",
  coordinatorId: "coord-1",
  coordinatorName: "Deniz Acar",
  startups: [
    startup("org-1", "Lumen", "stars", "ODTÜ Stars 2026"),
    startup("org-2", "Nova", "stars", "ODTÜ Stars 2026"),
    startup("org-3", "Orbit", "stars", "ODTÜ Stars 2026"),
    startup("org-4", "Zeta", "stars", "ODTÜ Stars 2026"),
  ],
});
const growth = adminProgram({
  id: "growth",
  name: "Growth 2026",
  coordinatorId: "coord-2",
  coordinatorName: "Elif Su",
  startups: [startup("org-6", "Beta", "growth", "Growth 2026")],
});
const closed = adminProgram({
  id: "closed",
  name: "Kapanan 2025",
  status: ProgramStatus.Completed,
  startups: [startup("org-5", "Kappa", "closed", "Kapanan 2025")],
});

/** Growth's coordinator was added but has not been approved yet. */
const waitingCoordinator: AdminUser = {
  id: "coord-2",
  email: "elif@menton.test",
  fullName: "Elif Su",
  role: UserRole.Coordinator,
  status: UserAccountStatus.Pending,
  organizationId: null,
  organizationName: null,
  jobTitle: null,
};

function request(overrides: Partial<AdminRequest>): AdminRequest {
  return {
    id: "r-1",
    organizationId: "org-3",
    organizationName: "Orbit",
    mentorId: null,
    mentorName: null,
    supportArea: null,
    status: MentorshipRequestStatus.Pending,
    createdAt: "2026-11-06T10:00:00+03:00",
    ...overrides,
  };
}

/** Lumen got a mentor this week, Nova long ago; Orbit, Zeta and Beta wait; Kappa's program is over. */
function overview(overrides: Partial<AdminOverview> = {}): AdminOverview {
  return {
    programs: [stars, growth, closed],
    users: [waitingCoordinator],
    mentorships: [
      adminMentorship({
        id: "m-1",
        organizationId: "org-1",
        organizationName: "Lumen",
        startDate: "2026-11-08",
        daysSinceMeeting: 1,
        programId: "stars",
      }),
      adminMentorship({
        id: "m-2",
        mentorId: "mentor-2",
        organizationId: "org-2",
        organizationName: "Nova",
        startDate: "2026-09-01",
        daysSinceMeeting: 2,
        programId: "stars",
      }),
    ],
    requests: [
      request({ id: "r-orbit", supportArea: "Finans" }),
      request({
        id: "r-zeta",
        organizationId: "org-4",
        organizationName: "Zeta",
        status: MentorshipRequestStatus.MoreInfoRequested,
        createdAt: "2026-11-10T10:00:00+03:00",
      }),
      request({
        id: "r-nova",
        organizationId: "org-2",
        organizationName: "Nova",
        status: MentorshipRequestStatus.Declined,
        supportArea: "Finans",
        createdAt: "2026-11-01T10:00:00+03:00",
      }),
      request({
        id: "r-kappa",
        organizationId: "org-5",
        organizationName: "Kappa",
        status: MentorshipRequestStatus.Declined,
      }),
    ],
    bottlenecks: [],
    meetingsLast8Weeks: 0,
    ...overrides,
  };
}

function show(data: AdminOverview) {
  overviewState.current = data;
  renderWithQueryClient(<MentorshipsView tab={MentorshipTab.Matching} />);
}

function stat(title: string) {
  const card = screen.getAllByText(title).at(0)?.closest("article");
  if (!(card instanceof HTMLElement)) throw new Error(`no stat ${title}`);
  return within(card);
}

/** The matching table's row of `team`. */
function row(team: string) {
  const line = screen
    .getByText(team, { selector: "span.truncate" })
    .closest(".grid");
  if (!(line instanceof HTMLElement)) throw new Error(`no row ${team}`);
  return within(line);
}

function listedTeams() {
  return screen
    .queryAllByText(TEAMS, { selector: "span.truncate" })
    .map((item) => item.textContent);
}

describe("Mentorship matching", () => {
  beforeEach(() => {
    freezeDate("2026-11-11T10:00:00+03:00");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("counts the live programs' waiting teams, their average wait, this week's matches and declined requests", () => {
    show(overview());

    expect(stat("Eşleşme bekleyen takım").getByText("3")).toBeInTheDocument();
    expect(
      stat("Eşleşme bekleyen takım").getByText("2 programda"),
    ).toBeInTheDocument();
    expect(stat("Ort. bekleme süresi").getByText("3 gün")).toBeInTheDocument();
    expect(
      stat("Ort. bekleme süresi").getByText("hedef ≤ 3 gün"),
    ).toBeInTheDocument();
    expect(stat("Bu hafta yapılan eşleşme").getByText("1")).toBeInTheDocument();
    expect(stat("Reddedilen talep").getByText("1")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Eşleşmeler\s*3/ }),
    ).toBeInTheDocument();
  });

  it("lists the longest-waiting team first and a team without a request last", () => {
    show(overview());

    expect(listedTeams()).toEqual(["Orbit", "Zeta", "Beta"]);
    expect(row("Orbit").getByText("5 gün")).toBeInTheDocument();
    expect(row("Orbit").getByText("Finans")).toBeInTheDocument();
    expect(row("Zeta").getByText("1 gün")).toBeInTheDocument();
    expect(row("Beta").getAllByText("—").length).toBeGreaterThan(1);
  });

  it("sorts the waiting teams by name on request", async () => {
    const user = userEvent.setup();
    show(overview());

    await user.selectOptions(screen.getByLabelText("Sırala"), "NAME");

    expect(listedTeams()).toEqual(["Beta", "Orbit", "Zeta"]);
  });

  it("warns that a waiting team's coordinator has no access yet and links to them", () => {
    show(overview());

    expect(row("Beta").getByText("erişim yok")).toBeInTheDocument();
    expect(
      row("Beta").getByRole("link", { name: "Koordinatöre git" }),
    ).toHaveAttribute("href", "/admin/users?user=coord-2");
    expect(row("Orbit").queryByText("erişim yok")).toBeNull();
  });

  it("finds a team by search and by program, and says when nothing matches", async () => {
    const user = userEvent.setup();
    show(overview());

    await user.type(screen.getByPlaceholderText("Takım ara"), "zeta");
    expect(listedTeams()).toEqual(["Zeta"]);

    await user.selectOptions(screen.getByLabelText("Program"), "Growth 2026");
    expect(listedTeams()).toEqual([]);
    expect(screen.getByText("Bu filtrede kayıt yok.")).toBeInTheDocument();

    await user.clear(screen.getByPlaceholderText("Takım ara"));
    expect(listedTeams()).toEqual(["Beta"]);
  });

  it("shows this week's matches and the declined requests under their own filters", async () => {
    const user = userEvent.setup();
    show(overview());

    await user.click(screen.getByRole("button", { name: /Bu hafta/ }));
    expect(listedTeams()).toEqual(["Lumen"]);
    expect(row("Lumen").getByText("Eşleşti")).toBeInTheDocument();
    expect(row("Lumen").queryByRole("link")).toBeNull();

    await user.click(screen.getByRole("button", { name: /Reddedilen/ }));
    expect(listedTeams()).toEqual(["Nova"]);
    expect(row("Nova").getByText("Reddedildi")).toBeInTheDocument();
    expect(row("Nova").getByText("10 gün")).toBeInTheDocument();
  });

  it("says there is no wait and nothing declined when no team has a request", () => {
    show(
      overview({
        requests: [],
        mentorships: [],
      }),
    );

    expect(stat("Ort. bekleme süresi").getByText("—")).toBeInTheDocument();
    expect(
      stat("Ort. bekleme süresi").getByText("talep tarihi yok"),
    ).toBeInTheDocument();
    expect(
      stat("Reddedilen talep").getByText("reddedilen talep yok"),
    ).toBeInTheDocument();
    expect(listedTeams()).toEqual(["Lumen", "Nova", "Orbit", "Zeta", "Beta"]);
  });

  it("narrows every count to the program picked as the scope", async () => {
    const user = userEvent.setup();
    show(overview());

    await user.selectOptions(screen.getByLabelText("Kapsam:"), "Growth 2026");

    expect(stat("Eşleşme bekleyen takım").getByText("1")).toBeInTheDocument();
    expect(stat("Bu hafta yapılan eşleşme").getByText("0")).toBeInTheDocument();
    expect(listedTeams()).toEqual(["Beta"]);
  });

  it("drops programs of other types and resets the scope when the type changes", async () => {
    const user = userEvent.setup();
    show(overview());
    await user.selectOptions(screen.getByLabelText("Kapsam:"), "Growth 2026");

    await user.selectOptions(
      screen.getByLabelText("Program türü"),
      "PEER_MENTORING",
    );

    expect(screen.getByLabelText("Kapsam:")).toHaveValue("");
    expect(listedTeams()).toEqual([]);
    expect(stat("Eşleşme bekleyen takım").getByText("0")).toBeInTheDocument();
  });
});
