import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AssistantPage from "@/app/assistant/page";
import { useMeetings } from "@/hooks/use-meetings";
import {
  getAssistantShareApiUrl,
  getBotApiUrl,
  getMeetingReportApiUrl,
  getStopBotApiUrl,
  getTranscriptApiUrl,
  TRANSCRIPT_POLL_MS,
} from "@/lib/const";
import { httpClient } from "@/lib/http-client";
import { createAxiosResponse } from "@test/fixtures/health";
import { InLocale } from "@test/test-utils";

vi.mock("@/components/hoc/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/components/providers/session-provider", () => ({
  useAppSession: () => null,
}));

vi.mock("@/hooks/use-meetings", () => ({
  useMeetings: vi.fn(),
}));

vi.mock("@/lib/http-client", () => ({
  UPLOAD_TIMEOUT_MS: 120_000,
  httpClient: {
    post: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
}));

const defaultMeetings = {
  data: [
    {
      id: "meeting-1",
      organizationId: "org-1",
      scheduledAt: "2026-09-01T10:00:00Z",
      durationMinutes: 45,
      agenda: "Sprint review",
      status: "SCHEDULED",
    },
  ],
  isLoading: false,
  isError: false,
  isPending: false,
  isSuccess: true,
  refetch: vi.fn(),
};

describe("AssistantPage integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    vi.mocked(useMeetings).mockReturnValue(defaultMeetings as never);
    vi.mocked(httpClient.get).mockResolvedValue(
      createAxiosResponse({ segments: [] }, 200),
    );
    vi.mocked(httpClient.patch).mockResolvedValue(
      createAxiosResponse({ id: "meeting-1" }, 200),
    );
  });

  it("reads in English", () => {
    render(
      <InLocale locale="en">
        <AssistantPage />
      </InLocale>,
    );

    expect(
      screen.getByPlaceholderText("Paste a meeting link…"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add bot" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Meetings" }),
    ).toBeInTheDocument();
  });

  it("adds a meeting from UI through assistant lib client", async () => {
    const user = userEvent.setup();

    vi.mocked(httpClient.post).mockImplementation(async (url: string) => {
      if (url === getBotApiUrl()) {
        return createAxiosResponse(
          {
            id: "bot-1",
            platform: "google_meet",
            nativeMeetingId: "abc-defg-hij",
            status: "scheduled",
            title: "Yeni Test Toplantisi",
          },
          201,
        );
      }
      throw new Error(`Unexpected POST URL: ${String(url)}`);
    });

    render(<AssistantPage />);

    await user.type(
      screen.getByPlaceholderText("Toplantı linki yapıştır…"),
      "https://meet.google.com/abc-defg-hij",
    );
    await user.click(screen.getByRole("button", { name: "Bot ekle" }));

    await waitFor(() => {
      expect(httpClient.post).toHaveBeenCalledWith(getBotApiUrl(), {
        meetingUrl: "https://meet.google.com/abc-defg-hij",
      });
    });

    expect(screen.getAllByText("Yeni Test Toplantisi").length).toBeGreaterThan(
      0,
    );

    await waitFor(() => {
      expect(httpClient.get).toHaveBeenCalledWith(
        getTranscriptApiUrl("google_meet", "abc-defg-hij"),
      );
    });
  });

  it("stops an added meeting then generates a report from the transcript", async () => {
    const user = userEvent.setup();
    const segments = [
      { id: "s1", speaker: "Ayşe", text: "Merhaba", at: "00:10" },
    ];

    vi.mocked(httpClient.get).mockResolvedValue(
      createAxiosResponse({ segments }, 200),
    );

    vi.mocked(httpClient.post).mockImplementation(async (url: string) => {
      if (url === getBotApiUrl()) {
        return createAxiosResponse(
          {
            id: "bot-1",
            platform: "google_meet",
            nativeMeetingId: "abc-defg-hij",
            status: "scheduled",
            title: "Yeni Test Toplantisi",
          },
          201,
        );
      }

      if (url === getMeetingReportApiUrl("google_meet", "abc-defg-hij")) {
        return createAxiosResponse(
          {
            title: "Mentorluk Gorusmesi",
            meetingDate: "2026-08-27",
            topic: "Urun Yol Haritasi",
            summary: "Toplanti verimli gecti.",
            topicsDiscussed: ["Yol haritasi"],
            decisions: ["MVP iki haftada cikacak"],
            actionItems: [
              { owner: "Ayse", task: "Demo hazirla", due: "2026-09-01" },
            ],
            risksOrBlockers: ["Kaynak kisiti"],
            nextSteps: ["Backlog netlestir"],
            model: "gpt-5.4",
          },
          200,
        );
      }

      throw new Error(`Unexpected POST URL: ${String(url)}`);
    });

    vi.mocked(httpClient.delete).mockResolvedValue(
      createAxiosResponse({}, 204),
    );

    render(<AssistantPage />);

    await user.type(
      screen.getByPlaceholderText("Toplantı linki yapıştır…"),
      "https://meet.google.com/abc-defg-hij",
    );
    await user.click(screen.getByRole("button", { name: "Bot ekle" }));

    await waitFor(() => {
      expect(
        screen.getAllByText("Yeni Test Toplantisi").length,
      ).toBeGreaterThan(0);
    });

    await user.click(screen.getByRole("button", { name: "Asistanı durdur" }));

    await waitFor(() => {
      expect(httpClient.delete).toHaveBeenCalledWith(
        getStopBotApiUrl("google_meet", "abc-defg-hij"),
      );
    });

    await waitFor(() => {
      expect(httpClient.post).toHaveBeenCalledWith(
        getMeetingReportApiUrl("google_meet", "abc-defg-hij"),
        { segments },
        { timeout: 120_000 },
      );
    });

    expect(screen.getByText("Düzenlenebilir")).toBeInTheDocument();
    expect(screen.getByText("Mentorluk Gorusmesi")).toBeInTheDocument();
    expect(screen.getByText("Toplanti verimli gecti.")).toBeInTheDocument();
  });

  it("does not generate a report after stop when the transcript is empty", async () => {
    const user = userEvent.setup();

    vi.mocked(httpClient.post).mockImplementation(async (url: string) => {
      if (url === getBotApiUrl()) {
        return createAxiosResponse(
          {
            id: "bot-1",
            platform: "google_meet",
            nativeMeetingId: "abc-defg-hij",
            status: "scheduled",
            title: "Yeni Test Toplantisi",
          },
          201,
        );
      }
      throw new Error(`Unexpected POST URL: ${String(url)}`);
    });
    vi.mocked(httpClient.delete).mockResolvedValue(
      createAxiosResponse({}, 204),
    );

    render(<AssistantPage />);

    await user.type(
      screen.getByPlaceholderText("Toplantı linki yapıştır…"),
      "https://meet.google.com/abc-defg-hij",
    );
    await user.click(screen.getByRole("button", { name: "Bot ekle" }));

    await waitFor(() => {
      expect(
        screen.getAllByText("Yeni Test Toplantisi").length,
      ).toBeGreaterThan(0);
    });

    await user.click(screen.getByRole("button", { name: "Asistanı durdur" }));

    await waitFor(() => {
      expect(httpClient.delete).toHaveBeenCalledWith(
        getStopBotApiUrl("google_meet", "abc-defg-hij"),
      );
    });

    expect(httpClient.post).not.toHaveBeenCalledWith(
      getMeetingReportApiUrl("google_meet", "abc-defg-hij"),
      expect.anything(),
    );
    expect(
      screen.getByText(/Asistanı durdur düğmesine basın/),
    ).toBeInTheDocument();
  });

  it("stores the stop in the meeting row so a reopened assistant stops polling", async () => {
    const user = userEvent.setup();
    const startedAt = new Date(Date.now() - 5 * 60_000).toISOString();
    const liveMeeting = {
      id: "meeting-1",
      organizationId: "org-1",
      scheduledAt: startedAt,
      durationMinutes: 120,
      agenda: "Mentorluk — Ürün roadmap",
      meetLink: "https://meet.google.com/abc-defg-hij",
      transcribeRequested: true,
      botDispatchedAt: startedAt,
      status: "SCHEDULED",
    };

    vi.mocked(useMeetings).mockReturnValue({
      ...defaultMeetings,
      data: [liveMeeting],
    } as never);

    vi.mocked(httpClient.get).mockImplementation(async (url: string) => {
      if (String(url).includes("assistant-share")) {
        return createAxiosResponse(
          { meetingId: "meeting-1", transcript: null, report: null },
          200,
        );
      }
      return createAxiosResponse({ segments: [] }, 200);
    });
    vi.mocked(httpClient.delete).mockResolvedValue(
      createAxiosResponse({}, 204),
    );

    const first = render(<AssistantPage />);
    expect((await screen.findAllByText("Canlı")).length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Asistanı durdur" }));
    await waitFor(() => {
      expect(httpClient.patch).toHaveBeenCalledWith("/api/meetings/meeting-1", {
        status: "COMPLETED",
        transcriptBotDispatched: true,
      });
    });
    expect(defaultMeetings.refetch).toHaveBeenCalled();

    first.unmount();
    vi.mocked(useMeetings).mockReturnValue({
      ...defaultMeetings,
      data: [{ ...liveMeeting, status: "COMPLETED" }],
    } as never);
    render(<AssistantPage />);

    expect((await screen.findAllByText("Bitti")).length).toBeGreaterThan(0);
    expect(screen.queryAllByText("Canlı")).toHaveLength(0);
    expect(
      screen.queryAllByText(/Transkripti görmek ve rapor oluşturmak için/),
    ).toHaveLength(0);

    const transcriptCalls = () =>
      vi
        .mocked(httpClient.get)
        .mock.calls.filter(
          ([url]) =>
            String(url) === getTranscriptApiUrl("google_meet", "abc-defg-hij"),
        ).length;
    const before = transcriptCalls();
    vi.useFakeTimers();
    vi.advanceTimersByTime(TRANSCRIPT_POLL_MS * 3);
    vi.useRealTimers();

    expect(transcriptCalls()).toBe(before);
  });

  it("warns the mentor when the stop could not be stored on the meeting", async () => {
    const user = userEvent.setup();
    const startedAt = new Date(Date.now() - 5 * 60_000).toISOString();

    vi.mocked(useMeetings).mockReturnValue({
      ...defaultMeetings,
      data: [
        {
          id: "meeting-1",
          organizationId: "org-1",
          scheduledAt: startedAt,
          durationMinutes: 120,
          agenda: "Mentorluk — Ürün roadmap",
          meetLink: "https://meet.google.com/abc-defg-hij",
          transcribeRequested: true,
          botDispatchedAt: startedAt,
          status: "SCHEDULED",
        },
      ],
    } as never);

    vi.mocked(httpClient.get).mockImplementation(async (url: string) => {
      if (String(url).includes("assistant-share")) {
        return createAxiosResponse(
          { meetingId: "meeting-1", transcript: null, report: null },
          200,
        );
      }
      return createAxiosResponse({ segments: [] }, 200);
    });
    vi.mocked(httpClient.delete).mockResolvedValue(
      createAxiosResponse({}, 204),
    );
    vi.mocked(httpClient.patch).mockResolvedValue(
      createAxiosResponse({ message: "Meeting could not be updated." }, 502),
    );

    render(<AssistantPage />);
    expect((await screen.findAllByText("Canlı")).length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Asistanı durdur" }));

    expect(
      await screen.findByText(/sunucuda bitti olarak işaretlenemedi/),
    ).toBeInTheDocument();
  });

  it("restores a saved transcript after the mentor opens the assistant again", async () => {
    vi.mocked(useMeetings).mockReturnValue({
      ...defaultMeetings,
      data: [
        {
          id: "meeting-1",
          organizationId: "org-1",
          organizationName: "NovaMed",
          scheduledAt: "2026-09-01T10:00:00Z",
          durationMinutes: 45,
          agenda: "Mentorluk — Ürün roadmap",
          meetLink: "https://meet.google.com/aaa-bbbb-ccc",
          transcribeRequested: true,
          status: "COMPLETED",
        },
      ],
    } as never);

    vi.mocked(httpClient.get).mockImplementation(async (url: string) => {
      if (url === getAssistantShareApiUrl("meeting-1")) {
        return createAxiosResponse(
          {
            meetingId: "meeting-1",
            transcript: [
              {
                id: "s1",
                speaker: "Ayşe",
                text: "Kayıtlı transkript",
                at: "00:10",
              },
            ],
            report: {
              title: "Kayıtlı rapor",
              meetingDate: "2026-09-01",
              topic: "Ürün",
              summary: "Özet veritabanından geldi.",
              topicsDiscussed: [],
              decisions: [],
              actionItems: [],
              risksOrBlockers: [],
              nextSteps: [],
              model: "gpt-5.4",
            },
          },
          200,
        );
      }
      return createAxiosResponse({ segments: [] }, 200);
    });

    render(<AssistantPage />);

    expect(
      (await screen.findAllByText("Mentorluk — Ürün roadmap")).length,
    ).toBeGreaterThan(0);
    expect(await screen.findByText("Kayıtlı transkript")).toBeInTheDocument();
    expect(screen.getByText("Kayıtlı rapor")).toBeInTheDocument();
    expect(screen.getByText("Özet veritabanından geldi.")).toBeInTheDocument();
  });

  it("does not publish after stop until the mentor sends the edited transcript", async () => {
    const user = userEvent.setup();
    const segments = [
      { id: "s1", speaker: "Ayşe", text: "Merhaba", at: "00:10" },
    ];

    vi.mocked(useMeetings).mockReturnValue({
      ...defaultMeetings,
      data: [
        {
          id: "meeting-1",
          organizationId: "org-1",
          scheduledAt: "2099-09-01T10:00:00Z",
          durationMinutes: 45,
          agenda: "Sprint review",
          meetLink: "https://meet.google.com/abc-defg-hij",
          transcribeRequested: true,
          status: "SCHEDULED",
        },
      ],
    } as never);

    vi.mocked(httpClient.get).mockImplementation(async (url: string) => {
      if (String(url).includes("assistant-share")) {
        return createAxiosResponse(
          { meetingId: "meeting-1", transcript: null, report: null },
          200,
        );
      }
      return createAxiosResponse({ segments }, 200);
    });
    vi.mocked(httpClient.post).mockImplementation(async (url: string) => {
      if (url === getBotApiUrl()) {
        return createAxiosResponse(
          {
            id: "bot-1",
            platform: "google_meet",
            nativeMeetingId: "abc-defg-hij",
            status: "scheduled",
            title: "Yeni Test Toplantisi",
          },
          201,
        );
      }
      if (url === getAssistantShareApiUrl("meeting-1")) {
        return createAxiosResponse({ meetingId: "meeting-1" }, 200);
      }
      if (url === getMeetingReportApiUrl("google_meet", "abc-defg-hij")) {
        return createAxiosResponse(
          {
            title: "Mentorluk Gorusmesi",
            summary: "Toplanti verimli gecti.",
            topicsDiscussed: [],
            decisions: [],
            actionItems: [],
            risksOrBlockers: [],
            nextSteps: [],
            model: "gpt-5.4",
          },
          200,
        );
      }
      throw new Error(`Unexpected POST URL: ${String(url)}`);
    });
    vi.mocked(httpClient.delete).mockResolvedValue(
      createAxiosResponse({}, 204),
    );

    render(<AssistantPage />);

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText("Toplantı linki yapıştır…"),
      ).toHaveValue("https://meet.google.com/abc-defg-hij");
    });
    await user.click(screen.getByRole("button", { name: "Bot ekle" }));
    await user.click(screen.getByRole("button", { name: "Asistanı durdur" }));

    await waitFor(() => {
      expect(httpClient.post).toHaveBeenCalledWith(
        getMeetingReportApiUrl("google_meet", "abc-defg-hij"),
        { segments },
        { timeout: 120_000 },
      );
    });
    expect(httpClient.post).not.toHaveBeenCalledWith(
      getAssistantShareApiUrl("meeting-1"),
      expect.anything(),
    );

    const textInput = await screen.findByDisplayValue("Merhaba");
    expect(screen.queryByText("00:10")).not.toBeInTheDocument();
    await user.clear(textInput);
    await user.type(textInput, "Düzenlenmiş merhaba");
    await user.click(
      screen.getByRole("button", { name: "Transkripti gönder" }),
    );

    await waitFor(() => {
      expect(httpClient.post).toHaveBeenCalledWith(
        getAssistantShareApiUrl("meeting-1"),
        {
          kind: "TRANSCRIPT",
          transcript: [
            {
              id: "s1",
              speaker: "Ayşe",
              text: "Düzenlenmiş merhaba",
              at: "00:10",
            },
          ],
        },
      );
    });
  });
});
