import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  peerWeeklyReportQueryKey,
  useWeeklyReport,
} from "@/hooks/use-weekly-report";
import {
  PeerReportStatus,
  type PeerWeeklyReport,
} from "@/interfaces/peer-reports";
import { ToastTone } from "@/interfaces/toast";
import {
  getPeerWeeklyReport,
  savePeerWeeklyReport,
  submitPeerWeeklyReport,
} from "@/lib/client/peer-reports";
import type { ToastInput } from "@/stores/toast-store";
import {
  WeeklyCheck,
  WeeklyQuestion,
  WeeklySubmitBlock,
} from "@/types/peer-weekly-report";
import { weeklyReport, weeklySummary } from "@test/fixtures/peer-weekly-report";
import { createTestQueryClient, freezeDate } from "@test/test-utils";

const showToast = vi.fn<(toast: ToastInput) => void>();

vi.mock("@/stores/toast-store", () => ({
  useToast: () => ({ showToast, dismiss: vi.fn() }),
}));
vi.mock("@/lib/client/peer-reports", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/client/peer-reports")>()),
  getPeerWeeklyReport: vi.fn(),
  savePeerWeeklyReport: vi.fn(),
  submitPeerWeeklyReport: vi.fn(),
}));

const WEEK = "2026-11-09";
let queryClient: QueryClient;

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

async function renderLoaded(weekStart = WEEK) {
  const view = renderHook(
    ({ week }: { week: string }) => useWeeklyReport(week),
    { wrapper, initialProps: { week: weekStart } },
  );
  await waitFor(() => expect(view.result.current.report).toBeDefined());
  return view;
}

beforeEach(() => {
  vi.clearAllMocks();
  queryClient = createTestQueryClient();
  // Friday 13 Kasım 2026, 18:30 in Istanbul: the week is open to send.
  freezeDate("2026-11-13T15:30:00Z");
  vi.mocked(getPeerWeeklyReport).mockResolvedValue(weeklyReport());
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useWeeklyReport", () => {
  it("loads the week and lets a complete draft be sent", async () => {
    const { result } = await renderLoaded();

    expect(getPeerWeeklyReport).toHaveBeenCalledWith(WEEK);
    expect(result.current.editable).toBe(true);
    expect(result.current.block).toBeNull();
    expect(result.current.late).toBe(false);
    expect(result.current.answers[WeeklyQuestion.Growth]).toBe(
      "Açık uçlu sorular",
    );
    expect(result.current.menteeNames).toEqual(["Ayşe", "Emre", "Deniz"]);
  });

  it("blocks sending until the evaluation is answered again", async () => {
    const { result } = await renderLoaded();

    act(() => result.current.setAnswer(WeeklyQuestion.Growth, "   "));

    expect(result.current.block).toBe(WeeklySubmitBlock.Evaluation);
    expect(result.current.blockReason).toBe(WeeklySubmitBlock.Evaluation);
    expect(result.current.checklist[2]).toEqual({
      check: WeeklyCheck.Evaluation,
      done: 2,
      total: 3,
      complete: false,
      blocking: true,
    });
  });

  it("saves the typed answers as a draft and keeps the saved report", async () => {
    const saved = weeklyReport({ growth: "Daha iyi dinledim" });
    vi.mocked(savePeerWeeklyReport).mockResolvedValue(saved);
    const { result } = await renderLoaded();

    act(() =>
      result.current.setAnswer(WeeklyQuestion.Growth, " Daha iyi dinledim "),
    );
    act(() => result.current.save());

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith({
        message: "Taslak kaydedildi.",
        tone: ToastTone.Success,
      }),
    );
    expect(savePeerWeeklyReport).toHaveBeenCalledWith(WEEK, {
      needsObserved: "CV desteği",
      growth: "Daha iyi dinledim",
      nextWeekPlan: "Grup görüşmesi",
    });
    expect(queryClient.getQueryData(peerWeeklyReportQueryKey(WEEK))).toEqual(
      saved,
    );
    expect(result.current.answers[WeeklyQuestion.Growth]).toBe(
      "Daha iyi dinledim",
    );
  });

  it("saves unsaved answers before sending, then shows the locked week", async () => {
    const sent = weeklyReport({
      status: PeerReportStatus.InReview,
      editable: false,
    });
    const calls: unknown[][] = [];
    vi.mocked(savePeerWeeklyReport).mockImplementation((week, input) => {
      calls.push(["save", week, input]);
      return Promise.resolve(weeklyReport());
    });
    vi.mocked(submitPeerWeeklyReport).mockImplementation((week) => {
      calls.push(["submit", week]);
      return Promise.resolve(sent);
    });
    const { result } = await renderLoaded();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    // Sending refreshes every report query; the backend then answers with the sent week.
    vi.mocked(getPeerWeeklyReport).mockResolvedValue(sent);

    act(() => result.current.setAnswer(WeeklyQuestion.NextWeekPlan, "Plan"));
    act(() => result.current.submit());

    await waitFor(() => expect(result.current.editable).toBe(false));
    expect(calls).toEqual([
      [
        "save",
        WEEK,
        {
          needsObserved: "CV desteği",
          growth: "Açık uçlu sorular",
          nextWeekPlan: "Plan",
        },
      ],
      ["submit", WEEK],
    ]);
    expect(result.current.block).toBe(WeeklySubmitBlock.Locked);
    expect(result.current.blockReason).toBeNull();
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["peer-reports"] });
    expect(showToast).toHaveBeenCalledWith({
      message: "Haftalık özet koordinatöre gönderildi.",
      tone: ToastTone.Success,
    });
  });

  it("sends an untouched saved draft without saving it again", async () => {
    vi.mocked(submitPeerWeeklyReport).mockResolvedValue(
      weeklyReport({ status: PeerReportStatus.InReview, editable: false }),
    );
    const { result } = await renderLoaded();

    act(() => result.current.submit());

    await waitFor(() => expect(submitPeerWeeklyReport).toHaveBeenCalled());
    expect(savePeerWeeklyReport).not.toHaveBeenCalled();
  });

  it("saves a never-saved week before sending it", async () => {
    vi.mocked(getPeerWeeklyReport).mockResolvedValue(
      weeklyReport({ id: null, status: null }),
    );
    vi.mocked(savePeerWeeklyReport).mockResolvedValue(weeklyReport());
    vi.mocked(submitPeerWeeklyReport).mockResolvedValue(
      weeklyReport({ status: PeerReportStatus.InReview, editable: false }),
    );
    const { result } = await renderLoaded();

    act(() => result.current.submit());

    await waitFor(() => expect(submitPeerWeeklyReport).toHaveBeenCalled());
    expect(savePeerWeeklyReport).toHaveBeenCalledWith(WEEK, {
      needsObserved: "CV desteği",
      growth: "Açık uçlu sorular",
      nextWeekPlan: "Grup görüşmesi",
    });
  });

  it("does not send when saving the typed answers fails, and keeps them", async () => {
    vi.mocked(savePeerWeeklyReport).mockRejectedValue(new Error("Kayıt yok"));
    const { result } = await renderLoaded();

    act(() => result.current.setAnswer(WeeklyQuestion.Growth, "Yeni"));
    act(() => result.current.submit());

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith({
        message: "Kayıt yok",
        tone: ToastTone.Error,
      }),
    );
    expect(submitPeerWeeklyReport).not.toHaveBeenCalled();
    expect(result.current.answers[WeeklyQuestion.Growth]).toBe("Yeni");
  });

  it("ignores a second send while the first is on its way", async () => {
    vi.mocked(submitPeerWeeklyReport).mockReturnValue(
      new Promise(() => {
        // Never settles: the first send stays on its way.
      }),
    );
    const { result } = await renderLoaded();

    act(() => result.current.submit());
    await waitFor(() => expect(result.current.isSubmitting).toBe(true));
    act(() => result.current.submit());

    expect(submitPeerWeeklyReport).toHaveBeenCalledOnce();
  });

  it("does not call the backend while sending is blocked", async () => {
    vi.mocked(getPeerWeeklyReport).mockResolvedValue(
      weeklyReport({ summary: weeklySummary({ meetingReportsSent: 5 }) }),
    );
    const { result } = await renderLoaded();

    act(() => result.current.submit());

    expect(result.current.block).toBe(WeeklySubmitBlock.MeetingReports);
    expect(submitPeerWeeklyReport).not.toHaveBeenCalled();
  });

  it("toasts the backend's reason when sending fails", async () => {
    vi.mocked(submitPeerWeeklyReport).mockRejectedValue(
      new Error("Görüşme raporları eksik."),
    );
    const { result } = await renderLoaded();

    act(() => result.current.submit());

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith({
        message: "Görüşme raporları eksik.",
        tone: ToastTone.Error,
      }),
    );
    expect(result.current.editable).toBe(true);
  });

  it("toasts a failed save", async () => {
    vi.mocked(savePeerWeeklyReport).mockRejectedValue("offline");
    const { result } = await renderLoaded();

    act(() => result.current.save());

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith({
        message: "Taslak kaydedilemedi.",
        tone: ToastTone.Error,
      }),
    );
  });

  it("drops one week's typing when another week opens", async () => {
    vi.mocked(getPeerWeeklyReport).mockImplementation((week) =>
      Promise.resolve(weeklyReport({ weekStart: week, growth: null })),
    );
    const { result, rerender } = await renderLoaded();

    act(() => result.current.setAnswer(WeeklyQuestion.Growth, "Geçen hafta"));
    rerender({ week: "2026-11-16" });

    await waitFor(() =>
      expect(result.current.report?.weekStart).toBe("2026-11-16"),
    );
    expect(result.current.answers[WeeklyQuestion.Growth]).toBe("");
  });

  it("keeps another week's typing when an earlier week's save comes back", async () => {
    vi.mocked(getPeerWeeklyReport).mockImplementation((week) =>
      Promise.resolve(weeklyReport({ weekStart: week })),
    );
    let finishSave: (report: PeerWeeklyReport) => void = () => undefined;
    vi.mocked(savePeerWeeklyReport).mockImplementation(
      () =>
        new Promise((resolve) => {
          finishSave = resolve;
        }),
    );
    const { result, rerender } = await renderLoaded();

    act(() => result.current.save());
    await waitFor(() => expect(savePeerWeeklyReport).toHaveBeenCalled());
    rerender({ week: "2026-11-16" });
    await waitFor(() =>
      expect(result.current.report?.weekStart).toBe("2026-11-16"),
    );
    act(() => result.current.setAnswer(WeeklyQuestion.Growth, "Yeni hafta"));
    act(() => finishSave(weeklyReport()));

    await waitFor(() => expect(result.current.isSaving).toBe(false));
    expect(result.current.answers[WeeklyQuestion.Growth]).toBe("Yeni hafta");
    expect(queryClient.getQueryData(peerWeeklyReportQueryKey(WEEK))).toEqual(
      weeklyReport(),
    );
  });

  it("keeps what was typed while a save was on its way", async () => {
    let finishSave: (report: PeerWeeklyReport) => void = () => undefined;
    vi.mocked(savePeerWeeklyReport).mockImplementation(
      () =>
        new Promise((resolve) => {
          finishSave = resolve;
        }),
    );
    const { result } = await renderLoaded();

    act(() => result.current.setAnswer(WeeklyQuestion.Growth, "İlk"));
    act(() => result.current.save());
    await waitFor(() => expect(savePeerWeeklyReport).toHaveBeenCalled());
    act(() => result.current.setAnswer(WeeklyQuestion.Growth, "İlk ve ikinci"));
    act(() => finishSave(weeklyReport({ growth: "İlk" })));

    await waitFor(() => expect(result.current.isSaving).toBe(false));
    expect(result.current.answers[WeeklyQuestion.Growth]).toBe("İlk ve ikinci");
  });

  it("opens the send window at Friday 18:00 without reloading", async () => {
    vi.useFakeTimers({ toFake: ["Date", "setInterval", "clearInterval"] });
    vi.setSystemTime(new Date("2026-11-13T14:59:30Z"));
    const { result } = renderHook(() => useWeeklyReport(WEEK), { wrapper });
    await vi.waitFor(() => expect(result.current.report).toBeDefined());
    expect(result.current.block).toBe(WeeklySubmitBlock.NotOpen);

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(result.current.block).toBeNull();
  });

  it("opens and closes the preview and prints it", async () => {
    const print = vi.spyOn(window, "print").mockImplementation(() => undefined);
    const { result } = await renderLoaded();

    act(() => result.current.preview.show());
    expect(result.current.preview.open).toBe(true);
    act(() => result.current.preview.print());
    expect(print).toHaveBeenCalledOnce();
    act(() => result.current.preview.close());
    expect(result.current.preview.open).toBe(false);
  });

  it("marks a week still unsent after Monday 23:59 as late", async () => {
    freezeDate("2026-11-17T08:00:00Z");
    const { result } = await renderLoaded();

    expect(result.current.late).toBe(true);
    expect(result.current.block).toBeNull();
  });
});
