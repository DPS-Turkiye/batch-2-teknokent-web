import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AssistantPage from "@/app/assistant/page";
import {
  getBotApiUrl,
  getMeetingReportApiUrl,
  getStopBotApiUrl,
  getTranscriptApiUrl,
} from "@/lib/const";
import { httpClient } from "@/lib/http-client";
import { createAxiosResponse } from "@test/fixtures/health";

vi.mock("@/components/hoc/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/lib/http-client", () => ({
  httpClient: {
    post: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("AssistantPage integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(httpClient.get).mockResolvedValue(
      createAxiosResponse({ segments: [] }, 200),
    );
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

  it("stops an added meeting and renders generated report", async () => {
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

    await user.click(screen.getByRole("button", { name: "Stop bot" }));

    await waitFor(() => {
      expect(httpClient.delete).toHaveBeenCalledWith(
        getStopBotApiUrl("google_meet", "abc-defg-hij"),
      );
    });

    await waitFor(() => {
      expect(httpClient.post).toHaveBeenCalledWith(
        getMeetingReportApiUrl("google_meet", "abc-defg-hij"),
        {},
      );
    });

    expect(screen.getByText("Mentorluk Gorusmesi")).toBeInTheDocument();
    expect(screen.getByText("Toplanti verimli gecti.")).toBeInTheDocument();
  });
});
