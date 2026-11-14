import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MeetingReportScreen } from "@/components/student/reports/meeting-report-form";
import {
  PeerActionOwner,
  PeerMeetingTopic,
  PeerReportStatus,
} from "@/interfaces/peer-reports";
import {
  getPeerMeetingReport,
  savePeerMeetingReport,
  setPeerReportActionDone,
  submitPeerMeetingReport,
} from "@/lib/client/peer-reports";
import {
  completePeerMeetingReportFixture,
  peerMeetingReportFixture,
} from "@test/fixtures/peer-reports";
import { renderWithQueryClient } from "@test/test-utils";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/lib/client/peer-reports", () => ({
  getPeerMeetingReport: vi.fn(),
  savePeerMeetingReport: vi.fn(),
  submitPeerMeetingReport: vi.fn(),
  setPeerReportActionDone: vi.fn(),
}));

function renderScreen() {
  return renderWithQueryClient(<MeetingReportScreen meetingId="meeting-1" />);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("MeetingReportScreen", () => {
  it("fills a new report from the calendar and shows it as a draft", async () => {
    vi.mocked(getPeerMeetingReport).mockResolvedValue(
      peerMeetingReportFixture(),
    );
    renderScreen();

    expect(
      await screen.findByRole("heading", { name: "Görüşme Raporu" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Ayşe Yıldız").length).toBeGreaterThan(0);
    expect(screen.getByText("Taslak")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "İlk görüşme" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByLabelText(/Gerçekleşen süre/)).toHaveValue("30");
    expect(screen.getByText("Henüz kaydedilmedi")).toBeInTheDocument();
    expect(screen.getByText("1. görüşme")).toBeInTheDocument();
  });

  it("marks the sections still missing instead of sending, and calls nothing", async () => {
    vi.mocked(getPeerMeetingReport).mockResolvedValue(
      peerMeetingReportFixture(),
    );
    const user = userEvent.setup();
    renderScreen();

    await user.click(
      await screen.findByRole("button", { name: "Görüşme Raporunu Gönder" }),
    );

    expect(
      screen.getAllByText("Bu bölümde doldurulmamış zorunlu alanlar var."),
    ).toHaveLength(5);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Zorunlu alanları eksik bölümler: Konu ve amaç, Görüşme detayları, Kullandığın beceriler, Çıktılar ve sonraki adımlar, Değerlendirme",
    );
    expect(screen.getByRole("heading", { name: "Konu ve amaç" })).toHaveFocus();
    expect(savePeerMeetingReport).not.toHaveBeenCalled();
    expect(submitPeerMeetingReport).not.toHaveBeenCalled();
  });

  it("saves the draft with the mentor's edits", async () => {
    vi.mocked(getPeerMeetingReport).mockResolvedValue(
      peerMeetingReportFixture(),
    );
    vi.mocked(savePeerMeetingReport).mockImplementation(async () =>
      peerMeetingReportFixture({
        id: "report-1",
        status: PeerReportStatus.Draft,
        topics: [PeerMeetingTopic.CvPreparation],
        updatedAt: "2026-11-12T11:52:00Z",
      }),
    );
    const user = userEvent.setup();
    renderScreen();

    await user.click(
      await screen.findByRole("checkbox", { name: "CV hazırlama" }),
    );
    await user.type(
      screen.getByLabelText(/Görüşmede neler konuştunuz/),
      "Hedef listesi",
    );
    await user.click(screen.getByRole("radio", { name: "4" }));
    await user.click(screen.getByRole("radio", { name: "Hayır" }));
    await user.click(
      screen.getByRole("button", { name: "Taslak Olarak Kaydet" }),
    );

    await waitFor(() => expect(savePeerMeetingReport).toHaveBeenCalledTimes(1));
    expect(vi.mocked(savePeerMeetingReport).mock.calls[0]).toEqual([
      "meeting-1",
      expect.objectContaining({
        topics: [PeerMeetingTopic.CvPreparation],
        discussion: "Hedef listesi",
        productivity: 4,
        coordinatorSupportNeeded: false,
      }),
    ]);
    expect(await screen.findByText(/Son kaydetme/)).toBeInTheDocument();
  });

  it("adds, edits and removes action steps", async () => {
    vi.mocked(getPeerMeetingReport).mockResolvedValue(
      peerMeetingReportFixture(),
    );
    vi.mocked(savePeerMeetingReport).mockResolvedValue(
      peerMeetingReportFixture({ id: "report-1" }),
    );
    const user = userEvent.setup();
    renderScreen();

    await user.click(
      await screen.findByRole("button", { name: "+ Eylem adımı ekle" }),
    );
    await user.click(
      screen.getByRole("button", { name: "+ Eylem adımı ekle" }),
    );
    await user.type(
      screen.getByRole("textbox", { name: "1. eylem adımı" }),
      "CV'yi yeniden yaz",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "1. adımı kim yapacak" }),
      PeerActionOwner.Mentor,
    );
    await user.click(
      screen.getByRole("button", { name: "2. eylem adımını kaldır" }),
    );
    expect(
      screen.queryByRole("textbox", { name: "2. eylem adımı" }),
    ).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Taslak Olarak Kaydet" }),
    );

    await waitFor(() => expect(savePeerMeetingReport).toHaveBeenCalled());
    expect(vi.mocked(savePeerMeetingReport).mock.calls[0]?.[1].actions).toEqual(
      [
        {
          id: null,
          text: "CV'yi yeniden yaz",
          owner: PeerActionOwner.Mentor,
          dueDate: null,
          done: false,
        },
      ],
    );
  });

  it("asks for a follow-up time once a follow-up is needed", async () => {
    vi.mocked(getPeerMeetingReport).mockResolvedValue(
      peerMeetingReportFixture(),
    );
    const user = userEvent.setup();
    renderScreen();

    expect(
      screen.queryByLabelText("Takip görüşmesi zamanı"),
    ).not.toBeInTheDocument();
    await user.click(
      await screen.findByRole("switch", { name: /Takip görüşmesi gerekiyor/ }),
    );
    expect(screen.getByLabelText("Takip görüşmesi zamanı")).toBeInTheDocument();
  });

  it("saves then sends a complete report and goes back to the day", async () => {
    vi.mocked(getPeerMeetingReport).mockResolvedValue(
      completePeerMeetingReportFixture(),
    );
    vi.mocked(savePeerMeetingReport).mockResolvedValue(
      completePeerMeetingReportFixture(),
    );
    vi.mocked(submitPeerMeetingReport).mockResolvedValue(
      completePeerMeetingReportFixture({
        status: PeerReportStatus.InReview,
        editable: false,
        submittedAt: "2026-11-12T12:00:00Z",
      }),
    );
    const user = userEvent.setup();
    renderScreen();

    await user.click(
      await screen.findByRole("button", { name: "Görüşme Raporunu Gönder" }),
    );

    await waitFor(() =>
      expect(submitPeerMeetingReport).toHaveBeenCalledWith("meeting-1"),
    );
    expect(savePeerMeetingReport).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith(
      "/student/peer-mentoring?tab=report&view=daily&day=2026-11-12",
    );
  });

  it("locks a sent report but still ticks its action steps off", async () => {
    vi.mocked(getPeerMeetingReport).mockResolvedValue(
      completePeerMeetingReportFixture({
        status: PeerReportStatus.InReview,
        editable: false,
        submittedAt: "2026-11-12T12:00:00Z",
      }),
    );
    vi.mocked(setPeerReportActionDone).mockResolvedValue(
      completePeerMeetingReportFixture({
        status: PeerReportStatus.InReview,
        editable: false,
      }),
    );
    const user = userEvent.setup();
    renderScreen();

    expect(await screen.findByText("İncelemede")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Görüşme Raporunu Gönder" }),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Görüşmede neler konuştunuz/)).toHaveAttribute(
      "readonly",
    );
    await user.click(
      screen.getByRole("checkbox", {
        name: "1. adımı tamamlandı olarak işaretle",
      }),
    );
    await waitFor(() =>
      expect(setPeerReportActionDone).toHaveBeenCalledWith(
        "meeting-1",
        "action-1",
        true,
      ),
    );
  });

  it("shows the coordinator's note on a report sent back, and the previous meeting's link", async () => {
    vi.mocked(getPeerMeetingReport).mockResolvedValue(
      completePeerMeetingReportFixture({
        status: PeerReportStatus.RevisionRequested,
        revisionNote: "Eylem adımlarına tarih ekle.",
        context: {
          meetingNumber: 2,
          previousMeeting: {
            meetingId: "meeting-0",
            scheduledAt: "2026-11-05T11:00:00Z",
            topics: [PeerMeetingTopic.InternshipApplication],
          },
          openActions: 1,
        },
      }),
    );
    renderScreen();

    expect(
      await screen.findByText(
        "Koordinatörün notu: Eylem adımlarına tarih ekle.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Revizyon Gerekli")).toBeInTheDocument();
    const card = screen.getByText("2. görüşme").closest("section");
    expect(card).not.toBeNull();
    expect(
      within(card ?? document.body).getByRole("link", {
        name: "Önceki görüşme raporunu gör",
      }),
    ).toHaveAttribute(
      "href",
      "/student/peer-mentoring/reports/meetings/meeting-0",
    );
    expect(screen.getByText("1 adım (önceki görüşmeden)")).toBeInTheDocument();
  });

  it("moves through a choice with the arrow keys, one tab stop per group", async () => {
    vi.mocked(getPeerMeetingReport).mockResolvedValue(
      peerMeetingReportFixture(),
    );
    const user = userEvent.setup();
    renderScreen();

    const first = await screen.findByRole("radio", { name: "İlk görüşme" });
    const followUp = screen.getByRole("radio", { name: "Takip görüşmesi" });
    expect(first).toHaveAttribute("tabindex", "0");
    expect(followUp).toHaveAttribute("tabindex", "-1");
    first.focus();
    await user.keyboard("{ArrowRight}");

    expect(followUp).toHaveFocus();
    expect(followUp).toHaveAttribute("aria-checked", "true");
    await user.keyboard("{Home}");
    expect(first).toHaveAttribute("aria-checked", "true");
  });

  it("keeps a sent report's choices focusable but unchanged", async () => {
    vi.mocked(getPeerMeetingReport).mockResolvedValue(
      completePeerMeetingReportFixture({
        status: PeerReportStatus.InReview,
        editable: false,
        submittedAt: "2026-11-12T12:00:00Z",
      }),
    );
    const user = userEvent.setup();
    renderScreen();

    const four = await screen.findByRole("radio", { name: "4" });
    expect(four).not.toBeDisabled();
    await user.click(screen.getByRole("radio", { name: "5" }));
    expect(four).toHaveAttribute("aria-checked", "true");
    await user.click(screen.getByRole("checkbox", { name: "Diğer" }));
    expect(screen.getByRole("checkbox", { name: "Diğer" })).not.toBeChecked();
  });

  it("keeps the saved copy when sending fails after the save", async () => {
    vi.mocked(getPeerMeetingReport).mockResolvedValue(
      completePeerMeetingReportFixture({ updatedAt: null }),
    );
    vi.mocked(savePeerMeetingReport).mockResolvedValue(
      completePeerMeetingReportFixture(),
    );
    vi.mocked(submitPeerMeetingReport).mockRejectedValue(
      new Error("Rapor gönderilemedi."),
    );
    const user = userEvent.setup();
    renderScreen();

    expect(await screen.findByText("Henüz kaydedilmedi")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Görüşme Raporunu Gönder" }),
    );

    expect(await screen.findByText(/Son kaydetme/)).toBeInTheDocument();
    expect(await screen.findByText("Rapor gönderilemedi.")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("keeps what was typed while a save was on its way", async () => {
    vi.mocked(getPeerMeetingReport).mockResolvedValue(
      peerMeetingReportFixture(),
    );
    let finish: (
      report: ReturnType<typeof peerMeetingReportFixture>,
    ) => void = () => undefined;
    vi.mocked(savePeerMeetingReport).mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const user = userEvent.setup();
    renderScreen();

    const discussion = await screen.findByLabelText(
      /Görüşmede neler konuştunuz/,
    );
    await user.type(discussion, "İlk");
    await user.click(
      screen.getByRole("button", { name: "Taslak Olarak Kaydet" }),
    );
    await user.type(discussion, " ve sonra");
    finish(
      peerMeetingReportFixture({
        id: "report-1",
        status: PeerReportStatus.Draft,
        discussion: "İlk",
        updatedAt: "2026-11-12T11:52:00Z",
      }),
    );

    expect(await screen.findByText(/Son kaydetme/)).toBeInTheDocument();
    expect(discussion).toHaveValue("İlk ve sonra");
  });

  it("tells the mentor when the report cannot be loaded", async () => {
    vi.mocked(getPeerMeetingReport).mockRejectedValue(
      new Error("Bu görüşmenin raporu bulunamadı."),
    );
    renderScreen();

    expect(
      await screen.findByText("Bu görüşmenin raporu bulunamadı."),
    ).toBeInTheDocument();
  });
});
