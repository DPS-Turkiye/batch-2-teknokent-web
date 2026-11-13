import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { UsersView } from "@/components/admin/users-view";
import {
  BottleneckSeverity,
  type AdminMentorMembership,
  type AdminOverview,
  type AdminUser,
} from "@/interfaces/admin-overview";
import { MentorshipStatus } from "@/interfaces/coordinator-mentorship";
import { ProgramMentorStatus, ProgramStatus } from "@/interfaces/program";
import { UserAccountStatus, UserRole } from "@/interfaces/session";
import { setCoordinatorAccess } from "@/lib/client/admin-coordinators";
import { moveStartupToProgram } from "@/lib/client/admin-program-members";
import { decidePendingAccount } from "@/lib/client/admin-users";
import { UserTab } from "@/types/admin-users";
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
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/admin/users",
}));
vi.mock("@/hooks/use-edition", async () => {
  const { Edition } = await import("@/interfaces/edition");
  return { useEdition: () => Edition.Teknokent };
});
vi.mock("@/hooks/use-admin-overview", () => ({
  ADMIN_OVERVIEW_QUERY_KEY: ["admin-overview"],
  useAdminOverview: () => ({
    data: overviewState.current,
    isLoading: false,
    error: null,
  }),
}));
vi.mock("@/lib/client/admin-users", () => ({
  decidePendingAccount: vi.fn(),
  getPendingAccounts: vi.fn(),
}));
vi.mock("@/lib/client/admin-program-members", () => ({
  assignToProgram: vi.fn(),
  moveStartupToProgram: vi.fn(),
}));
vi.mock("@/lib/client/admin-coordinators", () => ({
  addCoordinator: vi.fn(),
  getCoordinatorCandidate: vi.fn(),
  resendCoordinatorPasswordSetup: vi.fn(),
  setCoordinatorAccess: vi.fn(),
}));

const NOW = "2026-11-11T12:00:00+03:00";

function adminUser(overrides: Partial<AdminUser>): AdminUser {
  return {
    id: "user-1",
    email: "user@tekno.co",
    fullName: "Kişi",
    role: UserRole.Coordinator,
    status: UserAccountStatus.Approved,
    organizationId: null,
    organizationName: null,
    jobTitle: null,
    ...overrides,
  };
}

function overview(overrides: Partial<AdminOverview> = {}): AdminOverview {
  return {
    programs: [],
    users: [],
    mentorships: [],
    requests: [],
    bottlenecks: [],
    meetingsLast8Weeks: 0,
    ...overrides,
  };
}

function show(
  tab: UserTab.Coordinators | UserTab.Mentors | UserTab.Teams,
  data: AdminOverview,
) {
  overviewState.current = data;
  renderWithQueryClient(<UsersView tab={tab} />);
}

function rowOf(name: string) {
  const row = screen.getByText(name).closest('div[class*="border-[#f0f2f4]"]');
  if (!(row instanceof HTMLElement)) throw new Error(`No row for ${name}`);
  return within(row);
}

/** The filter pill whose label starts with `label`. */
function filterPill(label: string) {
  return screen.getByRole("button", { name: new RegExp(`^${label}\\s*\\d+$`) });
}

describe("UsersView coordinators", () => {
  const ayla = adminUser({
    id: "c-ayla",
    fullName: "Ayla Bekler",
    email: "ayla@tekno.co",
    createdAt: "2026-11-11T11:30:00+03:00",
  });
  const burcu = adminUser({
    id: "c-burcu",
    fullName: "Burcu Şen",
    email: "İPEK@tekno.co",
    status: UserAccountStatus.Pending,
    createdAt: "2026-11-11T09:00:00+03:00",
  });
  const cem = adminUser({
    id: "c-cem",
    fullName: "Cem Arı",
    email: "cem@tekno.co",
    status: UserAccountStatus.Rejected,
    createdAt: "2026-11-10T10:00:00+03:00",
  });
  const many = Array.from({ length: 6 }, (_, index) =>
    adminUser({
      id: `c-${String(index)}`,
      fullName: `Koordinatör ${String(index + 1)}`,
      email: `k${String(index + 1)}@tekno.co`,
      createdAt: "2026-10-30T12:00:00+03:00",
    }),
  );
  const stars = adminProgram({
    id: "stars",
    name: "ODTÜ Stars",
    coordinatorId: "c-ayla",
  });

  function data() {
    return overview({
      programs: [stars, adminProgram({ id: "other", name: "Growth" })],
      users: [ayla, burcu, cem, ...many],
    });
  }

  beforeEach(() => {
    freezeDate(NOW);
    vi.mocked(decidePendingAccount).mockReset();
    vi.mocked(setCoordinatorAccess).mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("counts coordinators per status and pages them seven at a time", async () => {
    const user = userEvent.setup();
    show(UserTab.Coordinators, data());

    expect(filterPill("Tümü")).toHaveTextContent("9");
    expect(filterPill("Aktif")).toHaveTextContent("7");
    expect(filterPill("Onay bekliyor")).toHaveTextContent("1");
    expect(filterPill("Pasif")).toHaveTextContent("1");
    expect(screen.getByText("1–7 / 9 koordinatör")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Önceki" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Sonraki" }));

    expect(screen.getByText("8–9 / 9 koordinatör")).toBeInTheDocument();
    expect(screen.getByText("Sayfa 2 / 2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sonraki" })).toBeDisabled();
  });

  it("goes back to the first page when the filter changes", async () => {
    const user = userEvent.setup();
    show(UserTab.Coordinators, data());
    await user.click(screen.getByRole("button", { name: "Sonraki" }));

    await user.click(filterPill("Onay bekliyor"));

    expect(screen.getByText("1–1 / 1 koordinatör")).toBeInTheDocument();
    expect(screen.getByText("Burcu Şen")).toBeInTheDocument();
    expect(screen.queryByText("Ayla Bekler")).toBeNull();
  });

  it("lists no one under Erişim gönderilmedi yet", async () => {
    const user = userEvent.setup();
    show(UserTab.Coordinators, data());

    await user.click(filterPill("Erişim gönderilmedi"));

    expect(
      screen.getByText("Bu filtrede koordinatör yok."),
    ).toBeInTheDocument();
    expect(screen.getByText("0 koordinatör")).toBeInTheDocument();
  });

  it("finds a coordinator by e-mail with Turkish casing and by the program they run", async () => {
    const user = userEvent.setup();
    show(UserTab.Coordinators, data());

    await user.type(screen.getByPlaceholderText("Koordinatör ara"), "ipek");
    expect(screen.getByText("Burcu Şen")).toBeInTheDocument();
    expect(screen.getByText("1–1 / 1 koordinatör")).toBeInTheDocument();

    await user.clear(screen.getByPlaceholderText("Koordinatör ara"));
    await user.selectOptions(screen.getByLabelText("Program"), "ODTÜ Stars");
    expect(screen.getByText("Ayla Bekler")).toBeInTheDocument();
    expect(screen.getByText("1–1 / 1 koordinatör")).toBeInTheDocument();
  });

  it("shows how long ago each coordinator joined, warning after a week", () => {
    show(UserTab.Coordinators, data());

    expect(rowOf("Ayla Bekler").getByText("30 dk önce")).toBeInTheDocument();
    expect(rowOf("Burcu Şen").getByText("3 saat önce")).toBeInTheDocument();
    expect(rowOf("Cem Arı").getByText("Dün")).toBeInTheDocument();
    expect(rowOf("Koordinatör 1").getByText("12 gün önce")).toHaveClass(
      "text-[#b7791f]",
    );
  });

  it("shows a dash for a coordinator without a join date, and their programs", () => {
    show(
      UserTab.Coordinators,
      overview({ programs: [stars], users: [{ ...ayla, createdAt: null }] }),
    );

    const row = rowOf("Ayla Bekler");
    expect(row.getByText("—")).toBeInTheDocument();
    expect(row.getByText("ODTÜ Stars")).toBeInTheDocument();
  });

  it("rejects a pending coordinator and says so", async () => {
    const user = userEvent.setup();
    vi.mocked(decidePendingAccount).mockResolvedValue({
      user: {
        id: "c-burcu",
        email: "ipek@tekno.co",
        fullName: "Burcu Şen",
        role: UserRole.Coordinator,
      },
      inviteCode: null,
    });
    show(UserTab.Coordinators, data());

    await user.click(
      rowOf("Burcu Şen").getByRole("button", { name: "Reddet" }),
    );

    expect(decidePendingAccount).toHaveBeenCalledWith(
      "c-burcu",
      UserAccountStatus.Rejected,
    );
    expect(
      await screen.findByText("Burcu Şen reddedildi."),
    ).toBeInTheDocument();
  });

  it("shows the server's reason when a rejection fails", async () => {
    const user = userEvent.setup();
    vi.mocked(decidePendingAccount).mockRejectedValue(
      new Error("Hesap zaten onaylandı."),
    );
    show(UserTab.Coordinators, data());

    await user.click(
      rowOf("Burcu Şen").getByRole("button", { name: "Reddet" }),
    );

    expect(
      await screen.findByText("Hesap zaten onaylandı."),
    ).toBeInTheDocument();
  });

  it("offers to deactivate an active coordinator and to reactivate an inactive one", async () => {
    const user = userEvent.setup();
    vi.mocked(setCoordinatorAccess).mockResolvedValue({
      id: "c-ayla",
      email: "ayla@tekno.co",
      fullName: "Ayla Bekler",
      status: UserAccountStatus.Rejected,
      outcome: null,
    });
    show(UserTab.Coordinators, data());

    await user.click(
      rowOf("Ayla Bekler").getByRole("button", { name: "Diğer işlemler" }),
    );
    expect(
      rowOf("Ayla Bekler").queryByRole("button", {
        name: "Yeniden etkinleştir",
      }),
    ).toBeNull();
    await user.click(
      rowOf("Ayla Bekler").getByRole("button", { name: "Pasife al" }),
    );

    await waitFor(() => {
      expect(setCoordinatorAccess).toHaveBeenCalledWith("c-ayla", false);
    });

    await user.click(
      rowOf("Cem Arı").getByRole("button", { name: "Diğer işlemler" }),
    );
    await user.click(
      rowOf("Cem Arı").getByRole("button", { name: "Yeniden etkinleştir" }),
    );
    await waitFor(() => {
      expect(setCoordinatorAccess).toHaveBeenCalledWith("c-cem", true);
    });
  });
});

describe("UsersView mentors", () => {
  function membership(
    mentorId: string,
    status: ProgramMentorStatus,
  ): AdminMentorMembership {
    return { mentorId, fullName: mentorId, email: `${mentorId}@x.co`, status };
  }

  const approved = adminUser({
    id: "m-ok",
    fullName: "Leyla Aksoy",
    role: UserRole.Mentor,
    expertise: ["UX Stratejisi"],
  });
  const invited = adminUser({
    id: "m-invited",
    fullName: "Kerem Tan",
    role: UserRole.Mentor,
  });
  const pending = adminUser({
    id: "m-pending",
    fullName: "Selin Ak",
    role: UserRole.Mentor,
    status: UserAccountStatus.Pending,
  });
  const inactive = adminUser({
    id: "m-off",
    fullName: "Ozan Er",
    role: UserRole.Mentor,
    status: UserAccountStatus.Rejected,
  });

  function data() {
    return overview({
      programs: [
        adminProgram({
          id: "stars",
          name: "ODTÜ Stars",
          mentors: [
            membership("m-ok", ProgramMentorStatus.Accepted),
            membership("m-invited", ProgramMentorStatus.Pending),
          ],
        }),
      ],
      users: [approved, invited, pending, inactive],
      mentorships: [
        adminMentorship({
          mentorId: "m-ok",
          startDate: "2026-10-01",
          daysSinceMeeting: 20,
        }),
        adminMentorship({
          id: "m-2",
          mentorId: "m-ok",
          organizationId: "org-2",
          status: MentorshipStatus.Planned,
        }),
      ],
    });
  }

  beforeEach(() => {
    freezeDate(NOW);
    vi.mocked(decidePendingAccount).mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("names each mentor's state, counting an approved mentor with an open invite as invited", () => {
    show(UserTab.Mentors, data());

    expect(rowOf("Leyla Aksoy").getByText("Aktif")).toBeInTheDocument();
    expect(
      rowOf("Kerem Tan").getByText("Davet gönderildi"),
    ).toBeInTheDocument();
    expect(rowOf("Selin Ak").getByText("Onay bekliyor")).toBeInTheDocument();
    expect(rowOf("Ozan Er").getByText("Pasif")).toBeInTheDocument();
    expect(filterPill("Davet bekliyor")).toHaveTextContent("1");
  });

  it("warns about a mentor whose active mentorship has not met for two weeks", () => {
    show(UserTab.Mentors, data());

    expect(rowOf("Leyla Aksoy").getByText("Görüşme yok")).toBeInTheDocument();
    expect(rowOf("Kerem Tan").queryByText("Görüşme yok")).toBeNull();
  });

  it("lists only invited mentors under Davet bekliyor", async () => {
    const user = userEvent.setup();
    show(UserTab.Mentors, data());

    await user.click(filterPill("Davet bekliyor"));

    expect(screen.getByText("Kerem Tan")).toBeInTheDocument();
    expect(screen.queryByText("Leyla Aksoy")).toBeNull();
    expect(screen.getByText("1–1 / 1 mentor")).toBeInTheDocument();
  });

  it("finds a mentor by expertise", async () => {
    const user = userEvent.setup();
    show(UserTab.Mentors, data());

    await user.type(
      screen.getByPlaceholderText("Mentor veya uzmanlık ara"),
      "ux strat",
    );

    expect(screen.getByText("Leyla Aksoy")).toBeInTheDocument();
    expect(screen.queryByText("Kerem Tan")).toBeNull();
  });

  it("approves a pending mentor and says so", async () => {
    const user = userEvent.setup();
    vi.mocked(decidePendingAccount).mockResolvedValue({
      user: {
        id: "m-pending",
        email: "selin@x.co",
        fullName: "Selin Ak",
        role: UserRole.Mentor,
      },
      inviteCode: null,
    });
    show(UserTab.Mentors, data());

    await user.click(rowOf("Selin Ak").getByRole("button", { name: "Onayla" }));

    expect(decidePendingAccount).toHaveBeenCalledWith(
      "m-pending",
      UserAccountStatus.Approved,
    );
    expect(await screen.findByText("Selin Ak onaylandı.")).toBeInTheDocument();
  });

  it("falls back to a generic message when a decision fails without an error", async () => {
    const user = userEvent.setup();
    vi.mocked(decidePendingAccount).mockRejectedValue("offline");
    show(UserTab.Mentors, data());

    await user.click(rowOf("Selin Ak").getByRole("button", { name: "Reddet" }));

    expect(await screen.findByText("Karar kaydedilemedi.")).toBeInTheDocument();
  });
});

describe("UsersView teams", () => {
  const program = adminProgram({
    id: "stars",
    name: "ODTÜ Stars",
    startups: [
      adminStartup({
        id: "org-1",
        name: "Lumen",
        programId: "stars",
        sector: "Fintech",
        founderName: "Gülse Buran",
      }),
      adminStartup({ id: "org-2", name: "Nova", programId: "stars" }),
      adminStartup({ id: "org-3", name: "Orbit", programId: "stars" }),
      adminStartup({
        id: "org-4",
        name: "Zeta",
        programId: "stars",
        founderName: "Mert Su",
        founderJobTitle: "CEO",
      }),
    ],
  });

  function data() {
    return overview({
      programs: [program],
      users: [
        adminUser({
          id: "u-1",
          role: UserRole.Mentee,
          organizationId: "org-1",
        }),
        adminUser({
          id: "u-2",
          role: UserRole.Mentee,
          organizationId: "org-1",
        }),
      ],
      mentorships: [
        adminMentorship({
          organizationId: "org-1",
          mentorName: "Leyla Aksoy",
          daysSinceMeeting: 2,
        }),
        adminMentorship({
          id: "m-2",
          organizationId: "org-2",
          organizationName: "Nova",
          daysSinceMeeting: 30,
        }),
        adminMentorship({
          id: "m-4",
          organizationId: "org-4",
          organizationName: "Zeta",
          status: MentorshipStatus.Planned,
        }),
      ],
      bottlenecks: [
        {
          id: "b-1",
          title: "Fiyatlama",
          severity: BottleneckSeverity.High,
          status: "OPEN",
          organizationId: "org-4",
          organizationName: "Zeta",
          createdAt: "2026-11-01T09:00:00Z",
        },
      ],
    });
  }

  beforeEach(() => {
    freezeDate(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("counts mentored, waiting and risky teams", () => {
    show(UserTab.Teams, data());

    expect(filterPill("Tümü")).toHaveTextContent("4");
    expect(filterPill("Aktif mentorluk")).toHaveTextContent("3");
    expect(filterPill("Eşleşme bekliyor")).toHaveTextContent("1");
    expect(filterPill("Riskli")).toHaveTextContent("1");
  });

  it("rates each team's mentorship healthy, risky, followed up or waiting", () => {
    show(UserTab.Teams, data());

    const lumen = rowOf("Lumen");
    expect(lumen.getByText("Sağlıklı")).toBeInTheDocument();
    expect(lumen.getByText("Fintech")).toBeInTheDocument();
    expect(lumen.getByText("Gülse Buran")).toBeInTheDocument();
    expect(lumen.getByText("Yetkili")).toBeInTheDocument();
    expect(lumen.getByText("2")).toBeInTheDocument();
    expect(lumen.getByText("Leyla Aksoy")).toBeInTheDocument();

    expect(rowOf("Nova").getByText("Riskli")).toBeInTheDocument();
    expect(rowOf("Nova").getByText("Sektör yok")).toBeInTheDocument();

    const zeta = rowOf("Zeta");
    expect(zeta.getByText("Planlandı")).toBeInTheDocument();
    expect(zeta.getByText("Takip")).toBeInTheDocument();
    expect(zeta.getByText("CEO")).toBeInTheDocument();

    const orbit = rowOf("Orbit");
    expect(orbit.getByText("Eşleşme bekliyor")).toBeInTheDocument();
    expect(orbit.getAllByText("Atanmadı")).toHaveLength(2);
  });

  it("filters to risky teams and finds a team by its founder", async () => {
    const user = userEvent.setup();
    show(UserTab.Teams, data());

    await user.click(filterPill("Riskli"));
    expect(screen.getByText("Nova")).toBeInTheDocument();
    expect(screen.queryByText("Lumen")).toBeNull();

    await user.click(filterPill("Tümü"));
    await user.type(
      screen.getByPlaceholderText("Takım veya yetkili ara"),
      "mert",
    );
    expect(screen.getByText("Zeta")).toBeInTheDocument();
    expect(screen.getByText("1–1 / 1 takım")).toBeInTheDocument();
  });

  it("says there are no teams when the program filter matches none", async () => {
    const user = userEvent.setup();
    show(
      UserTab.Teams,
      overview({
        programs: [program, adminProgram({ id: "empty", name: "Boş" })],
      }),
    );

    await user.selectOptions(screen.getByLabelText("Program"), "Boş");

    expect(screen.getByText("Bu filtrede takım yok.")).toBeInTheDocument();
  });

  it("moves a team to another open program from its drawer, instead of adding it to a second one", async () => {
    const user = userEvent.setup();
    vi.mocked(moveStartupToProgram).mockResolvedValue({
      id: "move-1",
      organizationId: "org-1",
      fromProgramId: "stars",
      fromProgramName: "ODTÜ Stars",
      toProgramId: "growth",
      toProgramName: "Growth Circuit",
      movedAt: "2026-11-11T12:00:00+03:00",
      withdrawnRequests: 0,
    });
    show(
      UserTab.Teams,
      overview({
        programs: [
          program,
          adminProgram({ id: "growth", name: "Growth Circuit" }),
          adminProgram({
            id: "ended",
            name: "Biten Program",
            status: ProgramStatus.Completed,
          }),
        ],
      }),
    );

    await user.click(rowOf("Lumen").getByRole("button", { name: "Detay" }));

    expect(
      screen.queryByRole("button", { name: "Programa ata" }),
    ).not.toBeInTheDocument();
    const target = screen.getByRole("combobox", { name: "Taşınacak program" });
    expect(
      within(target)
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual(["Yeni programı seç", "Growth Circuit"]);

    await user.selectOptions(target, "growth");
    await user.click(screen.getByRole("button", { name: "Programı değiştir" }));
    await user.click(
      within(
        screen.getByRole("dialog", {
          name: "Takımın programı değiştirilsin mi?",
        }),
      ).getByRole("button", { name: "Programı değiştir" }),
    );

    await waitFor(() =>
      expect(moveStartupToProgram).toHaveBeenCalledWith(
        "growth",
        "org-1",
        "stars",
      ),
    );
  });
});
