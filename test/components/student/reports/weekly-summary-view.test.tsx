import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { WeeklySummaryView } from "@/components/student/reports/weekly-summary-view";
import { PeerReportStatus } from "@/interfaces/peer-reports";
import {
  getPeerWeeklyReport,
  savePeerWeeklyReport,
  submitPeerWeeklyReport,
} from "@/lib/client/peer-reports";
import {
  reportDay,
  weeklyReport,
  weeklySummary,
} from "@test/fixtures/peer-weekly-report";
import { freezeDate, renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/peer-reports", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/client/peer-reports")>()),
  getPeerWeeklyReport: vi.fn(),
  savePeerWeeklyReport: vi.fn(),
  submitPeerWeeklyReport: vi.fn(),
}));

const WEEK = "2026-11-09";

async function renderView() {
  renderWithQueryClient(<WeeklySummaryView weekStart={WEEK} />);
  return screen.findByRole("heading", { name: "Haftanın özeti" });
}

beforeEach(() => {
  vi.clearAllMocks();
  // Friday 13 Kasım 2026, 18:30 in Istanbul.
  freezeDate("2026-11-13T15:30:00Z");
  vi.mocked(getPeerWeeklyReport).mockResolvedValue(weeklyReport());
});

afterEach(() => {
  vi.useRealTimers();
});

describe("WeeklySummaryView", () => {
  it("shows the week computed from the reports", async () => {
    await renderView();

    const summary = screen.getByRole("region", { name: "Haftanın özeti" });
    expect(within(summary).getByText("4 ilk · 2 takip")).toBeInTheDocument();
    expect(within(summary).getByText("Ayşe, Emre, Deniz")).toBeInTheDocument();
    expect(within(summary).getByText("6 / 6")).toBeInTheDocument();
    expect(within(summary).getByText("hepsi gönderildi")).toBeInTheDocument();
    expect(
      within(summary).getByText("kaynak, mesaj, etkinlik"),
    ).toBeInTheDocument();
    expect(
      within(summary).getByText("Kaydedilen Faaliyet Süresi · 11 sa 20 dk"),
    ).toBeInTheDocument();
  });

  it("lists the skills by use with their meeting counts", async () => {
    await renderView();

    const skills = screen.getByRole("region", {
      name: "Bu hafta kullandığın beceriler",
    });
    const rows = within(skills).getAllByRole("listitem");
    expect(rows.map((row) => row.textContent)).toEqual([
      "Aktif dinleme6 görüşme",
      "Açık uçlu soru sorma5 görüşme",
      "Geri bildirim verme1 görüşme",
    ]);
  });

  it("shows each mentee's outcome and links their latest report", async () => {
    await renderView();

    const outcomes = screen.getByRole("region", { name: "Görüşme çıktıları" });
    expect(
      within(outcomes).getByText("6 şirketlik hedef listesi oluşturuldu."),
    ).toBeInTheDocument();
    expect(
      within(outcomes).getByText("2 / 3 eylem tamamlandı"),
    ).toBeInTheDocument();
    expect(
      within(outcomes).getByRole("link", {
        name: "Ayşe Yıldız için raporları gör",
      }),
    ).toHaveAttribute(
      "href",
      "/student/peer-mentoring/reports/meetings/meeting-ayse-2",
    );
  });

  it("lists each day's status in the side card and links its daily report", async () => {
    vi.mocked(getPeerWeeklyReport).mockResolvedValue(
      weeklyReport({
        days: [
          reportDay({ date: "2026-11-09" }),
          reportDay({
            date: "2026-11-12",
            status: null,
            missingMeetingReports: 1,
          }),
          reportDay({ date: "2026-11-13", status: PeerReportStatus.InReview }),
        ],
      }),
    );
    await renderView();

    const side = screen.getByRole("region", { name: "Günlük raporlar" });
    expect(
      within(side).getByRole("link", {
        name: "Per · 12 Kasım, Eksik Bilgi: günlük raporunu aç",
      }),
    ).toHaveAttribute(
      "href",
      "/student/peer-mentoring?tab=report&view=daily&day=2026-11-12",
    );
    // The report tab shell draws the week's day strip; this view starts with Haftanın özeti.
    expect(screen.queryByText("Bugün")).not.toBeInTheDocument();
  });

  it("saves the draft with the typed answers", async () => {
    vi.mocked(savePeerWeeklyReport).mockResolvedValue(weeklyReport());
    await renderView();

    const growth = screen.getByRole("textbox", {
      name: "2. Bu hafta mentör olarak nasıl geliştin?",
    });
    await userEvent.clear(growth);
    await userEvent.type(growth, "Sabırlı oldum");
    await userEvent.click(
      screen.getByRole("button", { name: "Taslak Olarak Kaydet" }),
    );

    await waitFor(() =>
      expect(savePeerWeeklyReport).toHaveBeenCalledWith(WEEK, {
        needsObserved: "CV desteği",
        growth: "Sabırlı oldum",
        nextWeekPlan: "Grup görüşmesi",
      }),
    );
  });

  it("sends the week to the coordinator", async () => {
    vi.mocked(submitPeerWeeklyReport).mockResolvedValue(
      weeklyReport({ status: PeerReportStatus.InReview, editable: false }),
    );
    await renderView();

    await userEvent.click(
      screen.getByRole("button", {
        name: "Haftalık Özeti Koordinatöre Gönder",
      }),
    );

    await waitFor(() =>
      expect(submitPeerWeeklyReport).toHaveBeenCalledWith(WEEK),
    );
  });

  it("explains why the week can't be sent before Friday 18:00", async () => {
    freezeDate("2026-11-12T09:00:00Z");
    await renderView();

    const send = screen.getByRole("button", {
      name: "Haftalık Özeti Koordinatöre Gönder",
    });
    expect(send).toBeDisabled();
    expect(send).toHaveAccessibleDescription(
      "Haftalık özet 13 Kasım, 18:00 itibarıyla gönderilebilir.",
    );
    expect(
      screen.getByText(
        "Haftalık özet 13 Kasım, 18:00 itibarıyla gönderilebilir.",
      ),
    ).toBeInTheDocument();
  });

  it("shows which checklist row is still open and that the dailies don't block", async () => {
    vi.mocked(getPeerWeeklyReport).mockResolvedValue(
      weeklyReport({
        dailySent: 3,
        summary: weeklySummary({ meetingReportsSent: 4 }),
      }),
    );
    await renderView();

    const status = screen.getByRole("region", { name: "Haftalık özet" });
    expect(
      within(status).getByText("3 / 5 günlük rapor gönderildi"),
    ).toBeInTheDocument();
    expect(
      within(status).getByText("Gönderimi engellemez"),
    ).toBeInTheDocument();
    expect(
      within(status).getByText("4 / 6 görüşme raporu"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Önce bu haftanın tüm görüşme raporlarını gönder."),
    ).toBeInTheDocument();
  });

  it("locks a week in review: read-only answers, no save or send", async () => {
    vi.mocked(getPeerWeeklyReport).mockResolvedValue(
      weeklyReport({ status: PeerReportStatus.InReview, editable: false }),
    );
    await renderView();

    expect(
      screen.getByRole("textbox", {
        name: "1. Bu hafta hangi öğrenci ihtiyaçlarını gözlemledin?",
      }),
    ).toHaveAttribute("readonly");
    expect(
      screen.queryByRole("button", { name: "Taslak Olarak Kaydet" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: "Haftalık Özeti Koordinatöre Gönder",
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/7 gün içinde yanıt gelmezse otomatik onaylanır/),
    ).toBeInTheDocument();
  });

  it("shows the coordinator's note on a week sent back", async () => {
    vi.mocked(getPeerWeeklyReport).mockResolvedValue(
      weeklyReport({
        status: PeerReportStatus.RevisionRequested,
        revisionNote: "İkinci soruyu genişlet.",
      }),
    );
    await renderView();

    expect(
      screen.getByText("Koordinatör düzeltme istedi: İkinci soruyu genişlet."),
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: "Raporu Düzenle" }),
    );
    expect(
      screen.getByRole("textbox", {
        name: "1. Bu hafta hangi öğrenci ihtiyaçlarını gözlemledin?",
      }),
    ).toHaveFocus();
  });

  it("shows when the week opens for sending and when it is due", async () => {
    await renderView();

    const status = screen.getByRole("region", { name: "Haftalık özet" });
    expect(within(status).getByText("Gönderilebilir")).toBeInTheDocument();
    expect(within(status).getByText("13 Kasım, 18:00")).toBeInTheDocument();
    expect(within(status).getByText("Teslim")).toBeInTheDocument();
    expect(within(status).getByText("16 Kasım, 23:59")).toBeInTheDocument();
  });

  it("warns once the deadline has passed", async () => {
    freezeDate("2026-11-17T08:00:00Z");
    await renderView();

    expect(
      screen.getByText("Teslim süresi geçti; yine de gönderebilirsin."),
    ).toBeInTheDocument();
    expect(screen.getByText("16 Kasım, 23:59")).toBeInTheDocument();
  });

  it("previews the week as the coordinator sees it and prints it", async () => {
    const print = vi.spyOn(window, "print").mockImplementation(() => undefined);
    await renderView();

    await userEvent.click(screen.getByRole("button", { name: "Önizle" }));
    const dialog = screen.getByRole("dialog", {
      name: "Haftalık Faaliyet Özeti",
    });
    // Only the preview prints while it is open.
    expect(document.body.className).toContain(
      "print:[&>*:not(.weekly-print-root)]:hidden",
    );
    expect(dialog.closest(".weekly-print-root")?.parentElement).toBe(
      document.body,
    );
    expect(within(dialog).getByText("Grup görüşmesi")).toBeInTheDocument();
    await userEvent.click(
      within(dialog).getByRole("button", { name: "PDF olarak indir / Yazdır" }),
    );
    expect(print).toHaveBeenCalledOnce();

    await userEvent.click(
      within(dialog).getByRole("button", { name: "Kapat" }),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.body.className).not.toContain("weekly-print-root");
  });

  it("shows no time instead of failing on an unreadable opening time", async () => {
    vi.mocked(getPeerWeeklyReport).mockResolvedValue(
      weeklyReport({ opensAt: "x" }),
    );
    await renderView();

    expect(
      screen.getByRole("button", {
        name: "Haftalık Özeti Koordinatöre Gönder",
      }),
    ).toBeDisabled();
  });

  it("says when the week can't be loaded", async () => {
    vi.mocked(getPeerWeeklyReport).mockRejectedValue(new Error("Sunucu yok"));
    renderWithQueryClient(<WeeklySummaryView weekStart={WEEK} />);

    expect(await screen.findByText("Sunucu yok")).toBeInTheDocument();
  });
});
