import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AdminHomeView } from "@/components/admin/home-view";
import {
  BottleneckSeverity,
  type AdminBottleneck,
  type AdminMentorMembership,
  type AdminOverview,
  type AdminRequest,
  type AdminUser,
} from "@/interfaces/admin-overview";
import { Edition } from "@/interfaces/edition";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import { ProgramMentorStatus, ProgramStatus } from "@/interfaces/program";
import { UserAccountStatus, UserRole } from "@/interfaces/session";
import {
  adminMentorship,
  adminProgram,
  adminStartup,
} from "@test/fixtures/admin-programs";
import { freezeDate, renderWithQueryClient } from "@test/test-utils";

type OverviewState = {
  data: AdminOverview | undefined;
  isLoading: boolean;
  error: Error | null;
};

const overviewState = vi.hoisted(() => {
  const state: { current: OverviewState } = {
    current: { data: undefined, isLoading: false, error: null },
  };
  return state;
});

const editionState = vi.hoisted(() => ({ current: "TEKNOKENT" }));

vi.mock("@/hooks/use-edition", () => ({
  useEdition: () => editionState.current,
}));
vi.mock("@/hooks/use-admin-overview", () => ({
  useAdminOverview: () => overviewState.current,
}));

beforeEach(() => {
  editionState.current = Edition.Teknokent;
});

function membership(fullName: string): AdminMentorMembership {
  return {
    mentorId: fullName,
    fullName,
    email: `${fullName}@menton.test`,
    status: ProgramMentorStatus.Pending,
  };
}

function bottleneck(overrides: Partial<AdminBottleneck>): AdminBottleneck {
  return {
    id: "b-1",
    title: "Fiyatlama",
    severity: BottleneckSeverity.High,
    status: "OPEN",
    organizationId: "org-2",
    organizationName: "Nova",
    createdAt: "2026-11-01T09:00:00Z",
    ...overrides,
  };
}

const pendingMentor: AdminUser = {
  id: "mentor-9",
  email: "mentor9@menton.test",
  fullName: "Bekleyen Mentor",
  role: UserRole.Mentor,
  status: UserAccountStatus.Pending,
  organizationId: null,
  organizationName: null,
  jobTitle: null,
};

const request: AdminRequest = {
  id: "r-1",
  organizationId: "org-2",
  organizationName: "Nova",
  mentorId: null,
  mentorName: null,
  supportArea: null,
  status: MentorshipRequestStatus.Pending,
  createdAt: "2026-11-01T09:00:00Z",
};

const stars = adminProgram({
  id: "program-1",
  name: "ODTÜ Stars 2026",
  coordinatorId: "coord-1",
  coordinatorName: "Deniz Acar",
  startupCount: 3,
  acceptedMentorCount: 3,
  pendingMentorCount: 2,
  startups: [
    adminStartup({ id: "org-1", name: "Lumen" }),
    adminStartup({ id: "org-2", name: "Nova" }),
    adminStartup({ id: "org-3", name: "Orbit" }),
  ],
  mentors: [membership("Selin Ak")],
});
const growth = adminProgram({
  id: "program-2",
  name: "Growth 2025",
  status: ProgramStatus.Completed,
  mentors: [membership("Kerem Er")],
});
const draft = adminProgram({
  id: "program-3",
  name: "Taslak Program",
  status: ProgramStatus.Draft,
  createdAt: "2026-03-05T09:00:00",
});

/** Ayşe ↔ Lumen and Murat ↔ Delta have not met for weeks; Can ↔ Nova is fine; Orbit has no mentor. */
function overview(overrides: Partial<AdminOverview> = {}): AdminOverview {
  return {
    programs: [stars, growth, draft],
    users: [pendingMentor],
    mentorships: [
      adminMentorship({
        id: "m-1",
        mentorName: "Ayşe Demir",
        organizationId: "org-1",
        organizationName: "Lumen",
        startDate: "2026-10-14",
        daysSinceMeeting: 20,
        progressPercent: 40,
        programId: "program-1",
      }),
      adminMentorship({
        id: "m-2",
        mentorId: "mentor-2",
        mentorName: "Can Kaya",
        organizationId: "org-2",
        organizationName: "Nova",
        startDate: "2026-10-21",
        daysSinceMeeting: 2,
        programId: "program-1",
      }),
      adminMentorship({
        id: "m-3",
        mentorId: "mentor-3",
        mentorName: "Murat Er",
        organizationId: "org-x",
        organizationName: "Delta",
        startDate: "2026-10-01",
        daysSinceMeeting: null,
        programId: null,
      }),
    ],
    requests: [request],
    bottlenecks: [
      bottleneck({ id: "b-1", organizationId: "org-2" }),
      bottleneck({
        id: "b-2",
        title: " fiyatlama ",
        organizationId: "org-3",
        organizationName: "Orbit",
      }),
      bottleneck({
        id: "b-3",
        title: "Ekip",
        severity: BottleneckSeverity.Critical,
        organizationId: "org-x",
        organizationName: "Delta",
      }),
    ],
    meetingsLast8Weeks: 4,
    ...overrides,
  };
}

function show(data: AdminOverview) {
  overviewState.current = { data, isLoading: false, error: null };
  renderWithQueryClient(<AdminHomeView />);
}

function alertCard(title: string) {
  const card = screen.getByText(title).closest("article");
  if (!(card instanceof HTMLElement)) throw new Error(`no alert ${title}`);
  return within(card);
}

/** The intervention row whose title is `title`, with its detail when open. */
function interventionRow(title: string) {
  const row =
    screen.getByText(title).parentElement?.parentElement?.parentElement;
  if (!row) throw new Error(`no intervention ${title}`);
  return within(row);
}

function programRow(name: string) {
  return within(screen.getByRole("link", { name: new RegExp(name) }));
}

describe("AdminHomeView", () => {
  beforeEach(() => {
    freezeDate("2026-11-11T10:00:00+03:00");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the loading note until the overview arrives", () => {
    overviewState.current = { data: undefined, isLoading: true, error: null };
    renderWithQueryClient(<AdminHomeView />);

    expect(screen.getByText("Yükleniyor…")).toBeInTheDocument();
  });

  it("shows the overview's error", () => {
    overviewState.current = {
      data: undefined,
      isLoading: false,
      error: new Error("Genel bakış yüklenemedi."),
    };
    renderWithQueryClient(<AdminHomeView />);

    expect(screen.getByText("Genel bakış yüklenemedi.")).toBeInTheDocument();
  });

  describe("alerts", () => {
    it("counts teams waiting for a mentor, mentors waiting for approval and unanswered invites", () => {
      show(overview());

      const waiting = alertCard("Eşleşme bekleyen takımlar");
      expect(waiting.getByText("1")).toBeInTheDocument();
      expect(waiting.getByText("1 programda")).toBeInTheDocument();
      expect(waiting.getByRole("link", { name: "İncele →" })).toHaveAttribute(
        "href",
        "/admin/mentorships/matching",
      );
      expect(
        alertCard("Onay bekleyen mentor").getByText("hesap onayı bekliyor"),
      ).toBeInTheDocument();
      expect(
        alertCard("Erişim gönderilmedi").getByText("2"),
      ).toBeInTheDocument();
    });

    it("says nothing is waiting on an empty overview", () => {
      show(
        overview({
          programs: [],
          users: [],
          mentorships: [],
          bottlenecks: [],
          requests: [],
        }),
      );

      expect(screen.getByText("Bekleyen takım yok")).toBeInTheDocument();
      expect(screen.getByText("Bekleyen mentor yok")).toBeInTheDocument();
      expect(screen.getByText("Bekleyen davet yok")).toBeInTheDocument();
      expect(
        screen.getByText("Görüşmesi geciken mentorluk veya açık darboğaz yok."),
      ).toBeInTheDocument();
      expect(screen.getByText("Henüz program yok.")).toBeInTheDocument();
    });
  });

  describe("interventions", () => {
    it("lists a pair that has not met for two weeks, owned by its program's coordinator", () => {
      show(overview());

      const row = interventionRow("20 gündür görüşme yok — Ayşe Demir ↔ Lumen");
      expect(
        row.getByText(
          "ODTÜ Stars 2026 · kritik ilişki · sıradaki görüşme planlanmadı",
        ),
      ).toBeInTheDocument();
      expect(row.getByText("Deniz Acar")).toBeInTheDocument();
      expect(row.getByText("Kritik")).toBeInTheDocument();
      expect(
        row.getByRole("link", { name: "Koordinatöre git" }),
      ).toHaveAttribute("href", "/admin/users?user=coord-1");
    });

    it("counts days from the start for a pair outside any program that never met", () => {
      show(overview());

      const row = interventionRow("41 gündür görüşme yok — Murat Er ↔ Delta");
      expect(
        row.getByText(
          "Program yok · kritik ilişki · sıradaki görüşme planlanmadı",
        ),
      ).toBeInTheDocument();
      expect(row.getByText("Murat Er")).toBeInTheDocument();
      expect(
        row.getByRole("link", { name: "Koordinatöre git" }),
      ).toHaveAttribute("href", "/admin/users");
    });

    it("groups bottlenecks with the same title across teams and opens the first group", () => {
      show(overview());

      const row = interventionRow("Tekrarlayan darboğaz — 2 takımda fiyatlama");
      expect(row.getByText("Dikkat")).toBeInTheDocument();
      expect(row.getByRole("button", { name: "Satırı kapat" })).toHaveAttribute(
        "aria-expanded",
        "true",
      );
      expect(row.getByText("Nova")).toBeInTheDocument();
      expect(row.getByText("Orbit")).toBeInTheDocument();
      expect(row.getByText("Kabul edilmiş mentor: 3")).toBeInTheDocument();
      expect(row.getByText("· talep 1")).toBeInTheDocument();
      expect(row.getByText("2 davet henüz kabul edilmedi")).toBeInTheDocument();
    });

    it("marks a critical bottleneck red and names its team when it has no program", () => {
      show(overview());

      const row = interventionRow("Ekip");
      expect(row.getByText("Kritik")).toBeInTheDocument();
      expect(row.getAllByText("Delta").length).toBeGreaterThan(0);
    });

    it("groups unanswered program invites per program, with a fallback owner", () => {
      show(overview());

      const rows = screen.getAllByText(
        "Koordinatör müdahalesi gerekenler — 1 ilişki",
      );
      expect(rows).toHaveLength(2);
      const stars = interventionRow("ODTÜ Stars 2026 · davet kabul edilmedi");
      expect(stars.getByText("Deniz Acar")).toBeInTheDocument();
      expect(stars.getByRole("link", { name: "Görevlendir" })).toHaveAttribute(
        "href",
        "/admin/users/mentors",
      );
      expect(
        interventionRow("Growth 2025 · davet kabul edilmedi").getByText(
          "Koordinatör",
        ),
      ).toBeInTheDocument();
    });

    it("leaves out ODTÜ's links to the Mentorlar tab it does not show", () => {
      editionState.current = Edition.Odtu;
      show(overview());

      expect(
        screen
          .getAllByRole("link")
          .filter(
            (link) => link.getAttribute("href") === "/admin/users/mentors",
          ),
      ).toEqual([]);
      expect(
        screen.queryByText("ODTÜ Stars 2026 · davet kabul edilmedi"),
      ).toBeNull();
      expect(
        screen.getByText("20 gündür görüşme yok — Ayşe Demir ↔ Lumen"),
      ).toBeInTheDocument();
    });

    it("opens one row at a time and closes the open one again", async () => {
      const user = userEvent.setup();
      show(overview());
      const pair = "20 gündür görüşme yok — Ayşe Demir ↔ Lumen";

      await user.click(
        interventionRow(pair).getByRole("button", { name: "Satırı aç" }),
      );

      expect(
        interventionRow(pair).getByText("Hedef ilerlemesi %40"),
      ).toBeInTheDocument();
      expect(
        interventionRow(pair).getByText("Son görüşme 20 gün önce"),
      ).toBeInTheDocument();
      expect(screen.queryByText("Kabul edilmiş mentor: 3")).toBeNull();

      await user.click(
        interventionRow(pair).getByRole("button", { name: "Satırı kapat" }),
      );
      expect(screen.queryByText("Hedef ilerlemesi %40")).toBeNull();
    });

    it("toggles a bottleneck's detail from its İncele button", async () => {
      const user = userEvent.setup();
      show(overview());
      const title = "Tekrarlayan darboğaz — 2 takımda fiyatlama";

      await user.click(
        interventionRow(title).getByRole("button", { name: "İncele" }),
      );
      expect(screen.queryByText("Kabul edilmiş mentor: 3")).toBeNull();

      await user.click(
        interventionRow(title).getByRole("button", { name: "İncele" }),
      );
      expect(screen.getByText("Kabul edilmiş mentor: 3")).toBeInTheDocument();
    });

    it("notes a pair without a meeting record in its detail", async () => {
      const user = userEvent.setup();
      show(overview());
      const pair = "41 gündür görüşme yok — Murat Er ↔ Delta";

      await user.click(
        interventionRow(pair).getByRole("button", { name: "Satırı aç" }),
      );

      expect(
        interventionRow(pair).getByText("Kayıtlı görüşme yok"),
      ).toBeInTheDocument();
    });
  });

  describe("programs", () => {
    it("sums a program's stale, blocked and unmatched teams as open issues and dates its mentoring week", () => {
      show(overview());

      const row = programRow("ODTÜ Stars 2026");
      expect(row.getByText("Aktif")).toBeInTheDocument();
      expect(row.getByText("3")).toBeInTheDocument();
      expect(row.getByText("Mentorluk · hafta 4")).toBeInTheDocument();
      expect(row.getByText("3 · 3")).toBeInTheDocument();
    });

    it("shows a completed program as finished, unassigned and not started", () => {
      show(overview());

      const row = programRow("Growth 2025");
      expect(row.getAllByText("Tamamlandı")).toHaveLength(2);
      expect(row.getByText("Atanmadı")).toBeInTheDocument();
      expect(row.getByText("Başlamadı")).toBeInTheDocument();
    });

    it("dates a program without mentorships by when it was set up", () => {
      show(overview());

      expect(
        programRow("Taslak Program").getByText("Kurulum · 5 Mar"),
      ).toBeInTheDocument();
    });

    it("filters the programs by scope", async () => {
      const user = userEvent.setup();
      show(overview());
      const scope = screen.getByLabelText("Program kapsamı");

      await user.selectOptions(scope, "ACTIVE");
      expect(
        screen.getByRole("link", { name: /ODTÜ Stars 2026/ }),
      ).toBeInTheDocument();
      expect(screen.queryByRole("link", { name: /Growth 2025/ })).toBeNull();
      expect(screen.queryByRole("link", { name: /Taslak Program/ })).toBeNull();

      await user.selectOptions(scope, "COMPLETED");
      expect(
        screen.getByRole("link", { name: /Growth 2025/ }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: /ODTÜ Stars 2026/ }),
      ).toBeNull();
    });

    it("says there are no programs when the scope matches none", async () => {
      const user = userEvent.setup();
      show(overview({ programs: [stars] }));

      await user.selectOptions(
        screen.getByLabelText("Program kapsamı"),
        "COMPLETED",
      );

      expect(screen.getByText("Henüz program yok.")).toBeInTheDocument();
    });
  });
});
