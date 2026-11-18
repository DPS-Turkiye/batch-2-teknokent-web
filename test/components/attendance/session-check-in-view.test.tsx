import { fireEvent, screen, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SessionCheckInView } from "@/components/attendance/session-check-in-view";
import { AttendanceErrorCode } from "@/interfaces/program-attendance";
import { ClientApiError } from "@/lib/client/api";
import { checkInSession } from "@/lib/client/program-attendance";
import { sessionCheckIn } from "@test/fixtures/program-attendance";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/program-attendance", () => ({
  checkInSession: vi.fn(),
}));

const TOKEN = "Ab_-".repeat(10) + "xyz";

describe("SessionCheckInView", () => {
  beforeEach(() => vi.clearAllMocks());

  // Strict Mode runs the effect twice; a scan is still one request.
  it("sends the scanned code once and shows the session it was recorded for", async () => {
    vi.mocked(checkInSession).mockResolvedValue(sessionCheckIn());

    renderWithQueryClient(
      <StrictMode>
        <SessionCheckInView token={TOKEN} />
      </StrictMode>,
    );

    expect(screen.getByText("Yoklaman kaydediliyor…")).toBeInTheDocument();
    expect(await screen.findByText("Yoklaman alındı")).toBeInTheDocument();
    expect(checkInSession).toHaveBeenCalledTimes(1);
    expect(checkInSession).toHaveBeenCalledWith(TOKEN);
    expect(screen.getByText("Build")).toBeInTheDocument();
    expect(screen.getByText("Hafta 2 · Workshop")).toBeInTheDocument();
    expect(screen.getByText("Çar 11 Kas")).toBeInTheDocument();
    expect(screen.getByText("Workshop: Nihan Öztürk")).toBeInTheDocument();
  });

  it("says a second scan was already recorded", async () => {
    vi.mocked(checkInSession).mockResolvedValue(
      sessionCheckIn({ alreadyRecorded: true }),
    );

    renderWithQueryClient(<SessionCheckInView token={TOKEN} />);

    expect(
      await screen.findByText("Bu oturumun yoklaması zaten alınmış"),
    ).toBeInTheDocument();
  });

  it("treats a scan that lost a race to an earlier one as already recorded", async () => {
    vi.mocked(checkInSession).mockRejectedValue(
      new ClientApiError("zaten", 409, AttendanceErrorCode.AlreadyRecorded),
    );

    renderWithQueryClient(<SessionCheckInView token={TOKEN} />);

    expect(
      await screen.findByText("Bu oturumun yoklaması zaten alınmış"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Yoklama alınamadı")).not.toBeInTheDocument();
  });

  it("shows the backend's reason when the code is not valid now, without a retry", async () => {
    vi.mocked(checkInSession).mockRejectedValue(
      new ClientApiError(
        "Bu QR şu an geçerli değil. Bu oturumun yoklaması 11.11.2026 günü açık.",
        409,
        AttendanceErrorCode.QrNotValid,
      ),
    );

    renderWithQueryClient(<SessionCheckInView token={TOKEN} />);

    expect(await screen.findByText("Yoklama alınamadı")).toBeInTheDocument();
    expect(screen.getByText(/11\.11\.2026 günü açık/)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Tekrar dene" }),
    ).not.toBeInTheDocument();
  });

  it("tells a non-participant so", async () => {
    vi.mocked(checkInSession).mockRejectedValue(
      new ClientApiError("Bu programın katılımcısı değilsin.", 403),
    );

    renderWithQueryClient(<SessionCheckInView token={TOKEN} />);

    expect(
      await screen.findByText("Bu programın katılımcısı değilsin."),
    ).toBeInTheDocument();
  });

  it("reads a link that is not a token's shape as not valid, without a retry", async () => {
    vi.mocked(checkInSession).mockRejectedValue(
      new ClientApiError("Bu QR şu an geçerli değil.", 400, "INVALID_REQUEST"),
    );

    renderWithQueryClient(<SessionCheckInView token="../x" />);

    expect(
      await screen.findByText("Bu QR şu an geçerli değil."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Tekrar dene" }),
    ).not.toBeInTheDocument();
  });

  it("offers another try when the server could not be reached", async () => {
    vi.mocked(checkInSession)
      .mockRejectedValueOnce(new ClientApiError("Katılım kaydedilemedi.", 502))
      .mockResolvedValueOnce(sessionCheckIn());

    renderWithQueryClient(<SessionCheckInView token={TOKEN} />);

    fireEvent.click(await screen.findByRole("button", { name: "Tekrar dene" }));

    expect(await screen.findByText("Yoklaman alındı")).toBeInTheDocument();
    await waitFor(() => expect(checkInSession).toHaveBeenCalledTimes(2));
  });
});
