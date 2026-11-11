import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ProgramReporting } from "@/components/admin/reporting-view";
import { useProgramMeetingRatings } from "@/hooks/use-program-report";
import {
  BottleneckSeverity,
  type AdminBottleneck,
  type AdminMeetingMark,
  type AdminOverview,
  type AdminUser,
} from "@/interfaces/admin-overview";
import { MentorshipStatus } from "@/interfaces/coordinator-mentorship";
import { MeetingStatus } from "@/interfaces/meeting";
import { ProgramStatus, ProgramType } from "@/interfaces/program";
import { UserAccountStatus, UserRole } from "@/interfaces/session";
import {
  adminMentorship,
  adminProgram,
  adminStartup,
} from "@test/fixtures/admin-programs";
import {
  meetingFeedbackState,
  programMeetingRatings,
} from "@test/fixtures/program-report";
import { successQuery } from "@test/mocks/query-results";
import { freezeDate, renderWithQueryClient } from "@test/test-utils";

vi.mock("@/hooks/use-program-report", () => ({
  useProgramMeetingRatings: vi.fn(),
  useProgramMeetingFeedback: () => meetingFeedbackState(),
}));

// Wednesday; the 8-week window runs from Monday 21 September to this week's Monday, 9 November.
const NOW = "2026-11-11T10:00:00+03:00";

const lumen = adminStartup({ id: "org-1", name: "Lumen" });
const nova = adminStartup({ id: "org-2", name: "Nova" });

const stars = adminProgram({
  id: "program-1",
  name: "ODTÜ Stars 2026",
  coordinatorId: "coord-1",
  coordinatorName: "Deniz Acar",
  startupCount: 2,
  acceptedMentorCount: 1,
  startups: [lumen, nova],
});
const draftPeer = adminProgram({
  id: "program-2",
  name: "Akran 2026",
  status: ProgramStatus.Draft,
  type: ProgramType.PeerMentoring,
});

/** Ayşe ↔ Lumen: met this week, one goal of four done, an open bottleneck. */
const ayseLumen = adminMentorship({
  id: "m-1",
  mentorId: "mentor-1",
  mentorName: "Ayşe Demir",
  organizationId: "org-1",
  organizationName: "Lumen",
  startDate: "2026-09-01",
  daysSinceMeeting: 1,
  goalDone: 1,
  goalTotal: 4,
  programId: "program-1",
});
/** Can ↔ Nova: started in October and has not met for 20 days. */
const canNova = adminMentorship({
  id: "m-2",
  mentorId: "mentor-2",
  mentorName: "Can Kaya",
  organizationId: "org-2",
  organizationName: "Nova",
  startDate: "2026-10-20",
  daysSinceMeeting: 20,
  programId: "program-1",
});

function meetingMark(overrides: Partial<AdminMeetingMark>): AdminMeetingMark {
  return {
    mentorId: "mentor-1",
    organizationId: "org-1",
    scheduledAt: "2026-11-10T10:00:00+03:00",
    status: MeetingStatus.Completed,
    ...overrides,
  };
}

const meetings: AdminMeetingMark[] = [
  meetingMark({}),
  meetingMark({
    scheduledAt: "2026-11-03T10:00:00+03:00",
    status: MeetingStatus.Scheduled,
  }),
  meetingMark({
    scheduledAt: "2026-11-04T10:00:00+03:00",
    status: MeetingStatus.Cancelled,
  }),
  meetingMark({
    scheduledAt: "2026-11-20T10:00:00+03:00",
    status: MeetingStatus.Scheduled,
  }),
  meetingMark({
    mentorId: "mentor-2",
    organizationId: "org-2",
    scheduledAt: "2026-09-01T10:00:00+03:00",
  }),
];

const bottleneck: AdminBottleneck = {
  id: "b-1",
  title: "Fiyatlama",
  severity: BottleneckSeverity.High,
  status: "OPEN",
  organizationId: "org-1",
  organizationName: "Lumen",
  createdAt: "2026-11-09T09:00:00+03:00",
};

function adminUser(id: string, createdAt: string | null): AdminUser {
  return {
    id,
    email: `${id}@menton.test`,
    fullName: id,
    role: UserRole.Mentee,
    status: UserAccountStatus.Approved,
    organizationId: null,
    organizationName: null,
    jobTitle: null,
    createdAt,
  };
}

function overview(overrides: Partial<AdminOverview> = {}): AdminOverview {
  return {
    programs: [draftPeer, stars],
    users: [
      adminUser("new-1", "2026-11-01T09:00:00Z"),
      adminUser("new-2", "2026-10-01T09:00:00Z"),
      adminUser("old", "2026-01-01T09:00:00Z"),
      adminUser("unknown", null),
    ],
    mentorships: [
      ayseLumen,
      canNova,
      adminMentorship({
        id: "paused",
        status: MentorshipStatus.Paused,
        programId: null,
      }),
      adminMentorship({ id: "elsewhere", programId: "program-9" }),
    ],
    requests: [],
    bottlenecks: [bottleneck],
    meetingsLast8Weeks: 1,
    meetings,
    ...overrides,
  };
}

/** The overview as an older backend sends it, without any meeting dates. */
function withoutMeetings(data: AdminOverview): AdminOverview {
  const copy = { ...data };
  delete copy.meetings;
  return copy;
}

/** The KPI card whose title is `title`. */
function kpi(title: string) {
  const card = screen.getByText(title).closest("article");
  if (!(card instanceof HTMLElement)) throw new Error(`no KPI ${title}`);
  return within(card);
}

/** The heatmap row of the pair `label` ("mentor ↔ team"). */
function heatmapRow(label: string) {
  const row = screen.getByText(label).closest("tr");
  if (!row) throw new Error(`no heatmap row ${label}`);
  return row;
}

function cellTexts(row: HTMLElement) {
  return within(row)
    .getAllByRole("button")
    .map((cell) => cell.textContent);
}

describe("ProgramReporting pairs and KPIs", () => {
  beforeEach(() => {
    freezeDate(NOW);
    vi.mocked(useProgramMeetingRatings).mockReturnValue(
      successQuery(programMeetingRatings()),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("opens on the active program, not the first listed, and asks for its ratings from the window's first Monday", () => {
    renderWithQueryClient(<ProgramReporting data={overview()} />);

    expect(screen.getByLabelText("Program")).toHaveValue("program-1");
    expect(
      screen.getByText("ODTÜ Stars 2026 · Son 8 hafta"),
    ).toBeInTheDocument();
    expect(useProgramMeetingRatings).toHaveBeenLastCalledWith(
      "program-1",
      "2026-09-21",
    );
  });

  it("counts held against planned meetings of the program's active pairs only", () => {
    renderWithQueryClient(<ProgramReporting data={overview()} />);

    const rate = kpi("Görüşme gerçekleşme");
    expect(rate.getByText("%50")).toBeInTheDocument();
    expect(rate.getByText("tamamlanan 1 · planlanan 2")).toBeInTheDocument();
    expect(kpi("Görev tamamlama").getByText("%25")).toBeInTheDocument();
    expect(kpi("Görev tamamlama").getByText("1/4 hedef")).toBeInTheDocument();
  });

  it("counts a stale pair red and a pair with a bottleneck or low goals amber, noting this week's bottleneck", () => {
    renderWithQueryClient(<ProgramReporting data={overview()} />);

    const flags = kpi("Aktif bayrak");
    expect(flags.getByText("2")).toHaveClass("text-[#d9464b]");
    expect(
      flags.getByText("1 kırmızı · 1 sarı · 1 bu hafta"),
    ).toBeInTheDocument();

    const automatic = screen.getByRole("heading", {
      name: "Otomatik bayraklar",
    }).parentElement;
    if (!automatic) throw new Error("no flags section");
    expect(within(automatic).getAllByText("1 eşleşme")).toHaveLength(3);
  });

  it("says there is nothing planned when no meeting fell in the window", () => {
    renderWithQueryClient(
      <ProgramReporting
        data={overview({
          mentorships: [{ ...ayseLumen, goalTotal: 0 }],
          meetings: [],
          bottlenecks: [],
        })}
      />,
    );

    expect(
      kpi("Görüşme gerçekleşme").getByText("bu pencerede planlı görüşme yok"),
    ).toBeInTheDocument();
    expect(
      kpi("Görev tamamlama").getByText("hedef kaydı yok"),
    ).toBeInTheDocument();
    expect(
      kpi("Aktif bayrak").getByText("0 kırmızı · 0 sarı"),
    ).toBeInTheDocument();
  });

  it("says meeting dates are missing when the overview carries none", () => {
    renderWithQueryClient(
      <ProgramReporting
        data={withoutMeetings(
          overview({
            mentorships: [{ ...ayseLumen, daysSinceMeeting: null }],
          }),
        )}
      />,
    );

    expect(
      kpi("Görüşme gerçekleşme").getByText("görüşme tarihi gelmiyor"),
    ).toBeInTheDocument();
    expect(
      cellTexts(heatmapRow("Ayşe Demir ↔ Lumen")).every((text) => text === "—"),
    ).toBe(true);
  });

  it("marks each week held, missed or unknown before the pair started", () => {
    renderWithQueryClient(<ProgramReporting data={overview()} />);

    expect(cellTexts(heatmapRow("Ayşe Demir ↔ Lumen"))).toEqual([
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "1",
    ]);
    expect(cellTexts(heatmapRow("Can Kaya ↔ Nova"))).toEqual([
      "—",
      "—",
      "—",
      "—",
      "0",
      "0",
      "0",
      "0",
    ]);
    expect(
      within(heatmapRow("Can Kaya ↔ Nova")).getByText("görüşme yok"),
    ).toBeInTheDocument();
    expect(
      within(heatmapRow("Ayşe Demir ↔ Lumen")).getByText("darboğaz"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("1 eşleşmede bu pencerede görüşme var · 2 aktif"),
    ).toBeInTheDocument();
  });

  it("shows a cell's week, meetings and bottlenecks while hovered", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ProgramReporting data={overview()} />);
    const lastWeek = cellTexts(heatmapRow("Ayşe Demir ↔ Lumen")).length - 1;
    const cell = within(heatmapRow("Ayşe Demir ↔ Lumen")).getAllByRole(
      "button",
    )[lastWeek];
    if (!cell) throw new Error("no cell");

    await user.hover(cell);
    expect(document.body).toHaveTextContent(
      /Tamamlanan görüşme: 1\s*Açık darboğaz: 1/,
    );

    await user.unhover(cell);
    expect(document.body).not.toHaveTextContent(/Tamamlanan görüşme: 1/);
  });

  it("opens a pair's detail with its goals, last meeting and links to its coordinator and interventions", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ProgramReporting data={overview()} />);

    await user.click(screen.getByText("Ayşe Demir ↔ Lumen"));

    const detail = screen.getByText("İletişim trendi").closest("section");
    if (!detail) throw new Error("no pair detail");
    const view = within(detail);
    expect(
      view.getByText("ODTÜ Stars 2026 · koordinatör Deniz Acar"),
    ).toBeInTheDocument();
    expect(view.getByText("1/4")).toBeInTheDocument();
    expect(view.getByText("1 gün önce")).toBeInTheDocument();
    expect(
      view.getByRole("link", { name: "Koordinatöre git" }),
    ).toHaveAttribute("href", "/admin/users?user=coord-1");
    expect(view.getByRole("link", { name: "Mentorluğa git" })).toHaveAttribute(
      "href",
      "/admin/mentorships/interventions?program=ODT%C3%9C%20Stars%202026",
    );
  });

  it("flags a stale pair in its detail and shows no goal record", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ProgramReporting data={overview()} />);

    await user.click(screen.getByText("Can Kaya ↔ Nova"));

    const detail = screen.getByText("İletişim trendi").closest("section");
    if (!detail) throw new Error("no pair detail");
    const view = within(detail);
    expect(view.getByText("14+ gün görüşme yok")).toBeInTheDocument();
    expect(view.getByText("20 gün önce")).toBeInTheDocument();
    expect(view.getByText("Hedef").nextElementSibling).toHaveTextContent("—");
  });

  it("links to the users list when the program has no coordinator", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <ProgramReporting
        data={overview({
          programs: [{ ...stars, coordinatorId: null, coordinatorName: null }],
        })}
      />,
    );

    await user.click(screen.getByText("Ayşe Demir ↔ Lumen"));

    expect(
      screen.getByRole("link", { name: "Koordinatöre git" }),
    ).toHaveAttribute("href", "/admin/users");
    expect(
      screen.getByText("ODTÜ Stars 2026 · koordinatör —"),
    ).toBeInTheDocument();
  });
});

describe("ProgramReporting filters and tabs", () => {
  beforeEach(() => {
    freezeDate(NOW);
    vi.mocked(useProgramMeetingRatings).mockReturnValue(
      successQuery(programMeetingRatings()),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("widens the window to a quarter, and to the whole program with no start day for ratings", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ProgramReporting data={overview()} />);
    expect(screen.queryByRole("columnheader", { name: "H9" })).toBeNull();

    await user.click(screen.getByRole("button", { name: "Çeyrek" }));
    expect(
      screen.getByRole("columnheader", { name: "H13" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "H14" })).toBeNull();

    await user.click(screen.getByRole("button", { name: "Program boyu" }));
    // The program started in January, so the window is capped at 16 weeks.
    expect(
      screen.getByRole("columnheader", { name: "H16" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "H17" })).toBeNull();
    expect(useProgramMeetingRatings).toHaveBeenLastCalledWith(
      "program-1",
      null,
    );
  });

  it("shows only the picked type's programs, and an empty report when none is of that type", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ProgramReporting data={overview()} />);

    await user.selectOptions(
      screen.getByLabelText("Program türü"),
      "PEER_MENTORING",
    );
    expect(screen.getByLabelText("Program")).toHaveValue("program-2");
    expect(
      screen.getByText("Bu programda aktif mentorluk yok."),
    ).toBeInTheDocument();

    await user.selectOptions(
      screen.getByLabelText("Program türü"),
      "OFFICE_HOURS",
    );
    expect(screen.getByText("Program yok")).toBeInTheDocument();
    expect(useProgramMeetingRatings).toHaveBeenLastCalledWith(
      null,
      "2026-09-21",
    );
  });

  it("switches to another program and forgets the selected pair", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ProgramReporting data={overview()} />);
    await user.click(screen.getByText("Ayşe Demir ↔ Lumen"));
    expect(screen.getByText("İletişim trendi")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Program"), "program-2");

    expect(screen.queryByText("İletişim trendi")).toBeNull();
    expect(screen.getByText("Akran 2026 · Son 8 hafta")).toBeInTheDocument();
  });

  it("drops the KPIs, ratings and exports on Mentorluk Sağlığı but keeps the heatmap", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ProgramReporting data={overview()} />);

    await user.click(screen.getByRole("button", { name: "Mentorluk Sağlığı" }));

    expect(screen.queryByText("Görüşme gerçekleşme")).toBeNull();
    expect(screen.queryByText("Hazır raporlar")).toBeNull();
    expect(screen.getByText("Görüşme · eşleşme × hafta")).toBeInTheDocument();
  });

  it("counts the window's meetings, bottlenecks and new accounts on Sistem Aktivitesi", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ProgramReporting data={overview()} />);

    await user.click(screen.getByRole("button", { name: "Sistem Aktivitesi" }));

    expect(kpi("Görüşme").getByText("1")).toBeInTheDocument();
    expect(
      kpi("Görüşme").getByText("3 kaydın 1 tanesi tamamlandı"),
    ).toBeInTheDocument();
    expect(kpi("Açılan darboğaz").getByText("1")).toBeInTheDocument();
    expect(kpi("Yeni hesap").getByText("2")).toBeInTheDocument();
    expect(screen.queryByText("Görüşme · eşleşme × hafta")).toBeNull();
  });

  it("says meeting dates are missing on Sistem Aktivitesi when the overview has none", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <ProgramReporting data={withoutMeetings(overview())} />,
    );

    await user.click(screen.getByRole("button", { name: "Sistem Aktivitesi" }));

    expect(kpi("Görüşme").getByText("—")).toBeInTheDocument();
    expect(
      kpi("Görüşme").getByText("görüşme tarihi gelmiyor"),
    ).toBeInTheDocument();
  });

  it("hides the pickers and Sistem Aktivitesi for a coordinator's fixed program", () => {
    renderWithQueryClient(<ProgramReporting data={overview()} fixedProgram />);

    expect(
      screen.queryByRole("button", { name: "Sistem Aktivitesi" }),
    ).toBeNull();
    expect(screen.getByLabelText("Program").closest("label")).toHaveClass(
      "hidden",
    );
  });

  it("explains what the report shows and closes the note on Tamam", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ProgramReporting data={overview()} />);

    await user.click(screen.getByRole("button", { name: "Neler görünür? →" }));
    expect(
      screen.getByRole("heading", { name: "Neler görünür?" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Tamam" }));
    expect(
      screen.queryByRole("heading", { name: "Neler görünür?" }),
    ).toBeNull();
  });
});

describe("ProgramReporting CSV exports", () => {
  const downloads: { name: string; blob: Blob }[] = [];

  beforeEach(() => {
    freezeDate(NOW);
    vi.mocked(useProgramMeetingRatings).mockReturnValue(
      successQuery(programMeetingRatings()),
    );
    downloads.length = 0;
    let pending: Blob | null = null;
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: (blob: Blob) => {
        pending = blob;
        return "blob:report";
      },
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: () => undefined,
    });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      if (pending) downloads.push({ name: this.download, blob: pending });
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    Reflect.deleteProperty(URL, "createObjectURL");
    Reflect.deleteProperty(URL, "revokeObjectURL");
  });

  /** The header's export button; the export cards below have their own. */
  function headerExportButton() {
    const button = screen.getAllByRole("button", { name: "Dışa aktar" }).at(0);
    if (!button) throw new Error("no export button");
    return button;
  }

  /** The file's name, its text, and whether it opens with the UTF-8 byte order mark (which Blob.text() strips). */
  async function downloaded(index: number) {
    const file = downloads[index];
    if (!file) throw new Error(`no download ${index}`);
    const bytes = new Uint8Array(await file.blob.arrayBuffer());
    const bom = bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf;
    return { name: file.name, bom, text: await file.blob.text() };
  }

  it("downloads the program summary with a BOM so Excel reads the Turkish letters", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ProgramReporting data={overview()} />);

    await user.click(headerExportButton());

    expect(await downloaded(0)).toEqual({
      name: "program-ozeti.csv",
      bom: true,
      text: '"Program","Koordinatör","Takım","Mentor","Bekleyen davet"\n"ODTÜ Stars 2026","Deniz Acar","2","1","0"',
    });
  });

  it("writes one meeting row per pair, doubling quotes inside a name", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <ProgramReporting
        data={overview({
          mentorships: [
            { ...ayseLumen, mentorName: 'Ayşe "Kaptan" Demir' },
            { ...canNova, daysSinceMeeting: null, startDate: "2026-11-01" },
          ],
        })}
      />,
    );
    const meetingsRow = screen
      .getByText("Mentorluk görüşme özeti")
      .closest("li");
    if (!meetingsRow) throw new Error("no meetings export");

    await user.click(within(meetingsRow).getByRole("button"));

    const { name, text } = await downloaded(0);
    expect(name).toBe("gorusme-ozeti.csv");
    expect(text.split("\n").slice(1)).toEqual([
      '"Ayşe ""Kaptan"" Demir","Lumen","1","1","4","1"',
      '"Can Kaya","Nova","","0","0","0"',
    ]);
  });

  it("counts active, stale and blocked pairs in the count summary", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ProgramReporting data={overview()} />);
    const countsRow = screen.getByText("Sayı özeti").closest("li");
    if (!countsRow) throw new Error("no counts export");

    await user.click(within(countsRow).getByRole("button"));

    const { name, text } = await downloaded(0);
    expect(name).toBe("sayi-ozeti.csv");
    expect(text.split("\n")[1]).toBe('"2","1","1"');
  });

  it("exports an empty summary row when no program is of the picked type", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ProgramReporting data={overview()} />);
    await user.selectOptions(
      screen.getByLabelText("Program türü"),
      "OFFICE_HOURS",
    );

    await user.click(headerExportButton());

    const { text } = await downloaded(0);
    expect(text.split("\n")[1]).toBe('"","","0","0","0"');
  });
});
