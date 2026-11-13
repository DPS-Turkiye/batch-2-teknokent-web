import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { UsersView } from "@/components/admin/users-view";
import type {
  AdminMentorMembership,
  AdminOverview,
  AdminUser,
} from "@/interfaces/admin-overview";
import { ProgramMentorStatus, ProgramType } from "@/interfaces/program";
import { UserAccountStatus, UserRole } from "@/interfaces/session";
import { removeMentorFromProgram } from "@/lib/client/admin-program-members";
import { UserTab } from "@/types/admin-users";
import { adminProgram } from "@test/fixtures/admin-programs";
import { renderWithQueryClient } from "@test/test-utils";

const overviewState = vi.hoisted(() => {
  const state: { current: AdminOverview | undefined } = { current: undefined };
  return state;
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/admin/users/mentors",
}));
vi.mock("@/hooks/use-edition", async () => {
  const { Edition } = await import("@/interfaces/edition");
  return { useEdition: () => Edition.Teknokent };
});
// No signed-in admin: the drawer's delete action stays out of these tests.
vi.mock("@/components/providers/session-provider", () => ({
  useAppSession: () => null,
}));
vi.mock("@/hooks/use-admin-overview", () => ({
  ADMIN_OVERVIEW_QUERY_KEY: ["admin-overview"],
  useAdminOverview: () => ({
    data: overviewState.current,
    isLoading: false,
    error: null,
  }),
}));
vi.mock("@/lib/client/admin-program-members", () => ({
  assignToProgram: vi.fn(),
  removeMentorFromProgram: vi.fn(),
}));

function mentor(id: string, fullName: string): AdminUser {
  return {
    id,
    email: `${id}@tekno.co`,
    fullName,
    role: UserRole.Mentor,
    status: UserAccountStatus.Approved,
    organizationId: null,
    organizationName: null,
    jobTitle: null,
  };
}

function membership(
  mentorId: string,
  status: ProgramMentorStatus,
): AdminMentorMembership {
  return { mentorId, fullName: mentorId, email: `${mentorId}@x.co`, status };
}

const overview: AdminOverview = {
  programs: [
    adminProgram({
      id: "stars",
      name: "ODTÜ Stars",
      mentors: [
        membership("m-ok", ProgramMentorStatus.Accepted),
        membership("m-invited", ProgramMentorStatus.Pending),
      ],
    }),
    adminProgram({
      id: "growth",
      name: "Growth Circuit",
      mentors: [membership("m-ok", ProgramMentorStatus.Accepted)],
    }),
    adminProgram({
      id: "peer",
      name: "Akran Programı",
      type: ProgramType.PeerMentoring,
      mentors: [membership("m-ok", ProgramMentorStatus.Accepted)],
    }),
  ],
  users: [mentor("m-ok", "Leyla Aksoy"), mentor("m-invited", "Kerem Tan")],
  mentorships: [],
  requests: [],
  bottlenecks: [],
  meetingsLast8Weeks: 0,
};

/** Opens the mentor's drawer on its Programs tab. */
async function openPrograms(name: string) {
  const user = userEvent.setup();
  overviewState.current = overview;
  renderWithQueryClient(<UsersView tab={UserTab.Mentors} />);
  const row = screen.getByText(name).closest('div[class*="border-[#f0f2f4]"]');
  if (!(row instanceof HTMLElement)) throw new Error(`No row for ${name}`);
  await user.click(within(row).getByRole("button", { name: "Detay" }));
  await user.click(screen.getByRole("button", { name: "Programlar" }));
  return user;
}

/** The open drawer; program names also appear in the table behind it. */
function drawer() {
  return within(screen.getByRole("complementary"));
}

describe("UsersView mentor drawer › Programdan çıkar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(removeMentorFromProgram).mockResolvedValue({
      id: "removal-1",
      mentorId: "m-ok",
      programId: "stars",
      programName: "ODTÜ Stars",
      removedAt: "2026-11-13T12:00:00Z",
      withdrawnRequests: 0,
    });
  });

  it("offers it on each startup program that accepted the mentor, named after the program", async () => {
    await openPrograms("Leyla Aksoy");

    expect(
      screen
        .getAllByRole("button", { name: /^Programdan çıkar: / })
        .map((button) => button.getAttribute("aria-label")),
    ).toEqual([
      "Programdan çıkar: ODTÜ Stars",
      "Programdan çıkar: Growth Circuit",
    ]);
    // The program of another kind is still listed, without the action.
    expect(drawer().getByText("Akran Programı")).toBeInTheDocument();
  });

  it("removes the mentor from the chosen program once the admin confirms", async () => {
    const user = await openPrograms("Leyla Aksoy");

    await user.click(
      screen.getByRole("button", { name: "Programdan çıkar: ODTÜ Stars" }),
    );
    expect(removeMentorFromProgram).not.toHaveBeenCalled();
    await user.click(
      within(
        screen.getByRole("dialog", {
          name: "Mentor programdan çıkarılsın mı?",
        }),
      ).getByRole("button", { name: "Mentoru çıkar" }),
    );

    await waitFor(() =>
      expect(removeMentorFromProgram).toHaveBeenCalledWith("stars", "m-ok"),
    );
    expect(
      await screen.findByText(
        "Leyla Aksoy, ODTÜ Stars programından çıkarıldı.",
      ),
    ).toBeInTheDocument();
  });

  it("does not offer it for an invitation the mentor has not answered", async () => {
    await openPrograms("Kerem Tan");

    expect(drawer().getByRole("listitem")).toHaveTextContent("ODTÜ Stars");
    expect(
      screen.queryByRole("button", { name: /Programdan çıkar/ }),
    ).not.toBeInTheDocument();
  });
});
