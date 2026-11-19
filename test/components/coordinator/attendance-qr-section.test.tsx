import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AttendanceQrSection } from "@/components/coordinator/attendance-qr-section";
import { AttendanceSessionKind } from "@/interfaces/program-attendance";
import { ClientApiError } from "@/lib/client/api";
import {
  getAttendanceSessions,
  getSessionQr,
  regenerateSessionQr,
} from "@/lib/client/program-attendance";
import {
  attendanceSessions,
  sessionQr,
} from "@test/fixtures/program-attendance";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/program-attendance", () => ({
  getAttendanceSessions: vi.fn(),
  getSessionQr: vi.fn(),
  regenerateSessionQr: vi.fn(),
}));

const RENEWED = "ZyXwVuTsRqPoNmLkJiHgFeDcBa9876543210-_zyxwv";

async function openLesson() {
  fireEvent.click(
    await screen.findByRole("button", { name: "QR göster: Hafta 2, Eğitim" }),
  );
  return screen.findByRole("dialog");
}

describe("AttendanceQrSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAttendanceSessions).mockResolvedValue(attendanceSessions());
    vi.mocked(getSessionQr).mockResolvedValue(sessionQr());
    vi.mocked(regenerateSessionQr).mockResolvedValue(
      sessionQr({ token: RENEWED }),
    );
  });

  afterEach(() => vi.restoreAllMocks());

  it("lists each week's lesson and workshop, and says when a week has no workshop", async () => {
    renderWithQueryClient(
      <AttendanceQrSection programId="program-1" archived={false} />,
    );

    const table = await screen.findByRole("table");
    const first = within(table).getByRole("rowheader", { name: "Hafta 1" });
    const weekOne = first.closest("tr");
    if (!weekOne) throw new Error("no week 1 row");
    expect(weekOne).toHaveTextContent("Pzt 2 Kas");
    expect(weekOne).toHaveTextContent("4 kişi katıldı");
    expect(weekOne).toHaveTextContent("Bu hafta workshop yok");
    expect(
      within(table).getByRole("button", {
        name: "QR göster: Hafta 2, Workshop",
      }),
    ).toBeInTheDocument();
    expect(getAttendanceSessions).toHaveBeenCalledWith("program-1");
  });

  it("shows a session's code big, with its program, time window and this site's link", async () => {
    renderWithQueryClient(
      <AttendanceQrSection programId="program-1" archived={false} />,
    );

    const dialog = await openLesson();

    expect(
      await within(dialog).findByRole("img", {
        name: "Hafta 2 · Eğitim için yoklama QR kodu",
      }),
    ).toBeInTheDocument();
    expect(getSessionQr).toHaveBeenCalledWith("program-1", {
      week: 2,
      kind: AttendanceSessionKind.Lesson,
    });
    expect(
      within(dialog).getByRole("heading", { name: "Hafta 2 · Eğitim" }),
    ).toBeInTheDocument();
    expect(dialog).toHaveTextContent("Build");
    expect(dialog).toHaveTextContent("Pzt 9 Kas · 18:00–20:00");
    expect(dialog).toHaveTextContent("Yoklama 17:30 – 21:00 arasında açık");
    expect(dialog).toHaveTextContent(
      `${window.location.origin}/attend/${sessionQr().token}`,
    );
  });

  it("prints the code", async () => {
    const print = vi.spyOn(window, "print").mockImplementation(() => undefined);
    renderWithQueryClient(
      <AttendanceQrSection programId="program-1" archived={false} />,
    );
    const dialog = await openLesson();
    await within(dialog).findByRole("img");

    fireEvent.click(within(dialog).getByRole("button", { name: "Yazdır" }));

    expect(print).toHaveBeenCalled();
  });

  it("renews the code only after a confirmation, then shows the new link", async () => {
    renderWithQueryClient(
      <AttendanceQrSection programId="program-1" archived={false} />,
    );
    const dialog = await openLesson();
    await within(dialog).findByRole("img");

    fireEvent.click(within(dialog).getByRole("button", { name: "Yenile" }));
    const confirm = within(dialog).getByRole("alertdialog");
    expect(confirm).toHaveTextContent(
      "Eski kod ve bağlantı hemen geçersiz olur",
    );
    fireEvent.click(within(confirm).getByRole("button", { name: "Vazgeç" }));
    expect(regenerateSessionQr).not.toHaveBeenCalled();

    fireEvent.click(within(dialog).getByRole("button", { name: "Yenile" }));
    fireEvent.click(
      within(within(dialog).getByRole("alertdialog")).getByRole("button", {
        name: "Yenile",
      }),
    );

    await waitFor(() => expect(dialog).toHaveTextContent(`/attend/${RENEWED}`));
    expect(regenerateSessionQr).toHaveBeenCalledWith("program-1", {
      week: 2,
      kind: AttendanceSessionKind.Lesson,
    });
    expect(
      await screen.findByText(
        "Yeni QR kod oluşturuldu; eski kod artık geçersiz.",
      ),
    ).toBeInTheDocument();
  });

  // Another coordinator may have renewed it meanwhile; a dead code must never reach the projector.
  it("asks for the code again each time it is opened", async () => {
    vi.mocked(getSessionQr)
      .mockResolvedValueOnce(sessionQr())
      .mockResolvedValueOnce(sessionQr({ token: RENEWED }));
    renderWithQueryClient(
      <AttendanceQrSection programId="program-1" archived={false} />,
    );
    let dialog = await openLesson();
    await within(dialog).findByRole("img");
    fireEvent.click(within(dialog).getByRole("button", { name: "Kapat" }));

    dialog = await openLesson();

    await waitFor(() => expect(dialog).toHaveTextContent(`/attend/${RENEWED}`));
    expect(getSessionQr).toHaveBeenCalledTimes(2);
  });

  it("says why a code could not be renewed and closes", async () => {
    vi.mocked(regenerateSessionQr).mockRejectedValue(
      new ClientApiError("Program arşivde; yoklama değiştirilemez.", 400),
    );
    renderWithQueryClient(
      <AttendanceQrSection programId="program-1" archived={false} />,
    );
    const dialog = await openLesson();
    await within(dialog).findByRole("img");

    fireEvent.click(within(dialog).getByRole("button", { name: "Yenile" }));
    fireEvent.click(
      within(within(dialog).getByRole("alertdialog")).getByRole("button", {
        name: "Yenile",
      }),
    );

    expect(
      await screen.findByText("Program arşivde; yoklama değiştirilemez."),
    ).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Kapat" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("says when the code could not be loaded", async () => {
    vi.mocked(getSessionQr).mockRejectedValue(
      new ClientApiError("QR kod hazırlanamadı.", 502),
    );
    renderWithQueryClient(
      <AttendanceQrSection programId="program-1" archived={false} />,
    );

    const dialog = await openLesson();

    expect(
      await within(dialog).findByText("QR kod hazırlanamadı."),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: "Yazdır" }),
    ).toBeDisabled();
  });

  it("offers no codes for an archived program", async () => {
    renderWithQueryClient(
      <AttendanceQrSection programId="program-1" archived />,
    );

    await screen.findByRole("table");
    expect(
      screen.queryByRole("button", { name: /QR göster/ }),
    ).not.toBeInTheDocument();
  });

  it("says when the program takes no attendance or its plan has no session", async () => {
    vi.mocked(getAttendanceSessions).mockResolvedValueOnce(
      attendanceSessions({ attendanceEnabled: false }),
    );
    const { unmount } = renderWithQueryClient(
      <AttendanceQrSection programId="program-1" archived={false} />,
    );
    expect(
      await screen.findByText("Bu programda yoklama alınmıyor."),
    ).toBeInTheDocument();
    unmount();

    vi.mocked(getAttendanceSessions).mockResolvedValueOnce(
      attendanceSessions({ sessions: [] }),
    );
    renderWithQueryClient(
      <AttendanceQrSection programId="program-1" archived={false} />,
    );
    expect(
      await screen.findByText(
        "Programın planında yoklama alınacak bir oturum yok.",
      ),
    ).toBeInTheDocument();
  });
});
