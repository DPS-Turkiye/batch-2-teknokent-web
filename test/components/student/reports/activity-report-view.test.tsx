import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ActivityReportView } from "@/components/student/reports/activity-report-view";
import { PeerActivityType, PeerReportStatus } from "@/interfaces/peer-reports";
import { getReceivedPeerRequests } from "@/lib/client/peer-mentoring";
import {
  addPeerActivity,
  deletePeerActivity,
  getPeerDailyReport,
  getPeerReportWeek,
  getPeerWeeklyReport,
  savePeerDailyReport,
  submitPeerDailyReport,
} from "@/lib/client/peer-reports";
import { peerDailyReportFixture } from "@test/fixtures/peer-reports";
import { reportDay, weeklyReport } from "@test/fixtures/peer-weekly-report";
import { freezeDate, renderWithQueryClient } from "@test/test-utils";

const replace = vi.fn();
let search = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
  usePathname: () => "/student/peer-mentoring",
  useSearchParams: () => search,
}));
vi.mock("@/lib/client/peer-reports", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/client/peer-reports")>()),
  getPeerReportWeek: vi.fn(),
  getPeerDailyReport: vi.fn(),
  savePeerDailyReport: vi.fn(),
  submitPeerDailyReport: vi.fn(),
  addPeerActivity: vi.fn(),
  deletePeerActivity: vi.fn(),
  getPeerWeeklyReport: vi.fn(),
}));
vi.mock("@/lib/client/peer-mentoring", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/client/peer-mentoring")>()),
  getReceivedPeerRequests: vi.fn(),
}));

const answers = {
  didToday: "İki görüşme.",
  challenge: "Çekingen mentee.",
  learned: "Önce güven.",
  tomorrowPlan: "Rehberi bitirmek.",
};

beforeEach(() => {
  vi.clearAllMocks();
  freezeDate("2026-11-12T13:00:00Z");
  search = new URLSearchParams("tab=report");
  vi.mocked(getPeerReportWeek).mockResolvedValue({
    weekStart: "2026-11-09",
    days: [
      reportDay({ date: "2026-11-09" }),
      reportDay({ date: "2026-11-10", status: PeerReportStatus.InReview }),
      reportDay({
        date: "2026-11-12",
        status: PeerReportStatus.Draft,
        missingMeetingReports: 1,
      }),
    ],
    dailySent: 2,
  });
  vi.mocked(getPeerDailyReport).mockResolvedValue(peerDailyReportFixture());
  vi.mocked(getReceivedPeerRequests).mockResolvedValue([]);
});

afterEach(() => vi.useRealTimers());

describe("ActivityReportView", () => {
  it("opens on today's Günlük view with the week strip", async () => {
    renderWithQueryClient(<ActivityReportView />);

    expect(await screen.findByText("9–13 Kasım 2026")).toBeInTheDocument();
    const strip = screen.getByRole("list", { name: "Haftanın günleri" });
    expect(within(strip).getAllByRole("button")).toHaveLength(5);
    expect(within(strip).getByText("Bugün")).toBeInTheDocument();
    expect(await within(strip).findByText("Eksik Bilgi")).toBeInTheDocument();
    expect(within(strip).getAllByText("Henüz başlamadı")).toHaveLength(2);
    expect(getPeerDailyReport).toHaveBeenCalledWith("2026-11-12");
  });

  it("moves between weeks and days through the URL", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ActivityReportView />);

    await user.click(
      await screen.findByRole("button", { name: "Sonraki hafta" }),
    );
    expect(replace).toHaveBeenLastCalledWith(
      "/student/peer-mentoring?tab=report&view=daily&week=2026-11-16",
      { scroll: false },
    );
    const strip = screen.getByRole("list", { name: "Haftanın günleri" });
    await user.click(within(strip).getAllByRole("button")[1] ?? strip);
    expect(replace).toHaveBeenLastCalledWith(
      "/student/peer-mentoring?tab=report&view=daily&week=2026-11-09&day=2026-11-10",
      { scroll: false },
    );
    await user.click(screen.getByRole("button", { name: "Haftalık Özet" }));
    expect(replace).toHaveBeenLastCalledWith(
      "/student/peer-mentoring?tab=report&view=weekly&week=2026-11-09&day=2026-11-12",
      { scroll: false },
    );
  });

  it("shows the weekly summary in the Haftalık view", async () => {
    search = new URLSearchParams("tab=report&view=weekly&week=2026-11-09");
    vi.mocked(getPeerWeeklyReport).mockResolvedValue(weeklyReport());
    renderWithQueryClient(<ActivityReportView />);

    await waitFor(() =>
      expect(getPeerWeeklyReport).toHaveBeenCalledWith("2026-11-09"),
    );
    expect(getPeerDailyReport).not.toHaveBeenCalled();
  });

  it("lists the day's meetings and activities, and links an unwritten report", async () => {
    renderWithQueryClient(<ActivityReportView />);

    expect(await screen.findByText("Görüşme · Emre Kaya")).toBeInTheDocument();
    expect(screen.getByText("Görüşme raporu bekliyor")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Raporu Doldur" })).toHaveAttribute(
      "href",
      "/student/peer-mentoring/reports/meetings/meeting-1",
    );
    expect(
      screen.getByText("Staj başvuru rehberi hazırlığı"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Emre Kaya · görüşme raporu eksik"),
    ).toBeInTheDocument();
    expect(screen.getByText("2 sa 0 dk")).toBeInTheDocument();
  });

  it("keeps sending closed while a meeting report is missing", async () => {
    vi.mocked(getPeerDailyReport).mockResolvedValue(
      peerDailyReportFixture({ id: "day-1", ...answers }),
    );
    renderWithQueryClient(<ActivityReportView />);

    expect(
      await screen.findByText(
        "Eksik görüşme raporu varken günlük rapor gönderilemez.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Günlük Raporu Gönder" }),
    ).toBeDisabled();
  });

  it("saves then sends a complete day", async () => {
    const ready = peerDailyReportFixture({
      id: "day-1",
      ...answers,
      missingMeetingReports: 0,
      meetings: [],
      updatedAt: "2026-11-12T12:30:00Z",
    });
    vi.mocked(getPeerDailyReport).mockResolvedValue(ready);
    vi.mocked(savePeerDailyReport).mockResolvedValue(ready);
    vi.mocked(submitPeerDailyReport).mockResolvedValue({
      ...ready,
      status: PeerReportStatus.InReview,
      editable: false,
      submittedAt: "2026-11-12T13:00:00Z",
    });
    const user = userEvent.setup();
    renderWithQueryClient(<ActivityReportView />);

    await user.click(
      await screen.findByRole("button", { name: "Günlük Raporu Gönder" }),
    );

    await waitFor(() =>
      expect(submitPeerDailyReport).toHaveBeenCalledWith("2026-11-12"),
    );
    expect(savePeerDailyReport).toHaveBeenCalledWith(
      "2026-11-12",
      expect.objectContaining({ didToday: "İki görüşme." }),
    );
    expect(await screen.findByText(/Gönderildi ·/)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Günlük Raporu Gönder" }),
    ).not.toBeInTheDocument();
  });

  it("starts a new day's skills from the meeting reports and saves the draft", async () => {
    vi.mocked(savePeerDailyReport).mockResolvedValue(
      peerDailyReportFixture({
        id: "day-1",
        updatedAt: "2026-11-12T12:30:00Z",
      }),
    );
    const user = userEvent.setup();
    renderWithQueryClient(<ActivityReportView />);

    expect(
      await screen.findByRole("checkbox", { name: "Aktif dinleme" }),
    ).toBeChecked();
    await user.type(
      screen.getByLabelText(/Bugün mentörlük kapsamında/),
      "İki görüşme.",
    );
    await user.click(
      screen.getByRole("button", { name: "Taslak Olarak Kaydet" }),
    );

    await waitFor(() =>
      expect(savePeerDailyReport).toHaveBeenCalledWith(
        "2026-11-12",
        expect.objectContaining({
          didToday: "İki görüşme.",
          skills: ["ACTIVE_LISTENING"],
        }),
      ),
    );
  });

  it("adds an activity through Faaliyet ekle, refusing an incomplete one first", async () => {
    vi.mocked(addPeerActivity).mockResolvedValue({
      id: "activity-2",
      activityDate: "2026-11-12",
      type: PeerActivityType.Event,
      title: "Kariyer günü",
      durationMinutes: 60,
      menteeId: null,
      menteeName: null,
      description: null,
      createdAt: "2026-11-12T13:00:00Z",
    });
    const user = userEvent.setup();
    renderWithQueryClient(<ActivityReportView />);

    await user.click(
      await screen.findByRole("button", { name: /Görüşme dışı faaliyet ekle/ }),
    );
    const dialog = screen.getByRole("dialog");
    await user.click(
      within(dialog).getByRole("button", { name: "Faaliyeti Ekle" }),
    );
    expect(within(dialog).getByRole("alert")).toHaveTextContent(
      "Bir başlık ve 1–720 dakika arası bir süre gir.",
    );
    expect(addPeerActivity).not.toHaveBeenCalled();

    await user.selectOptions(
      within(dialog).getByLabelText(/Faaliyet türü/),
      PeerActivityType.Event,
    );
    await user.type(within(dialog).getByLabelText(/Başlık/), "Kariyer günü");
    await user.type(within(dialog).getByLabelText(/Süre/), "60");
    await user.click(
      within(dialog).getByRole("button", { name: "Faaliyeti Ekle" }),
    );

    await waitFor(() =>
      expect(addPeerActivity).toHaveBeenCalledWith({
        activityDate: "2026-11-12",
        type: PeerActivityType.Event,
        title: "Kariyer günü",
        durationMinutes: 60,
        menteeId: null,
        description: null,
      }),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("deletes an activity of an open day", async () => {
    vi.mocked(deletePeerActivity).mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithQueryClient(<ActivityReportView />);

    await user.click(
      await screen.findByRole("button", {
        name: "Staj başvuru rehberi hazırlığı faaliyetini sil",
      }),
    );
    await waitFor(() =>
      expect(deletePeerActivity).toHaveBeenCalledWith("activity-1"),
    );
  });

  it("shows a sent day read-only, with the coordinator-free footer note", async () => {
    vi.mocked(getPeerDailyReport).mockResolvedValue(
      peerDailyReportFixture({
        id: "day-1",
        ...answers,
        status: PeerReportStatus.InReview,
        editable: false,
        missingMeetingReports: 0,
        submittedAt: "2026-11-12T13:00:00Z",
      }),
    );
    renderWithQueryClient(<ActivityReportView />);

    expect(await screen.findByText(/Gönderildi ·/)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Görüşme dışı faaliyet ekle/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Bugün mentörlük kapsamında/)).toHaveAttribute(
      "readonly",
    );
  });
});
