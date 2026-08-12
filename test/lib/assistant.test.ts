import { beforeEach, describe, expect, it, vi } from "vitest";

import { addMeetingBot, fetchTranscript } from "@/lib/assistant";
import { getBotApiUrl, getTranscriptApiUrl } from "@/lib/const";
import { httpClient } from "@/lib/http-client";
import { createAxiosResponse } from "@test/fixtures/health";

vi.mock("@/lib/http-client", () => ({ //gerçek axios yerine sahte post / get
  httpClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe("assistant lib", () => {
  beforeEach(() => { //her testten önce mock’ları temizle (testler birbirini bozmasın)
    vi.clearAllMocks();
  });
//spat: UI “Bot ekle” deyince helper doğru isteği atıp cevabı geri veriyor.
  it("addMeetingBot posts meeting url and returns data", async () => {
    const payload = {
      id: "bot-1",
      platform: "google_meet",
      nativeMeetingId: "abc-defg-hij",
      status: "joining",
      title: "Mentor Bot",
    };
    vi.mocked(httpClient.post).mockResolvedValue(
      createAxiosResponse(payload, 201),
    );

    const result = await addMeetingBot("https://meet.google.com/abc-defg-hij");

    expect(httpClient.post).toHaveBeenCalledWith(getBotApiUrl(), {
      meetingUrl: "https://meet.google.com/abc-defg-hij",
    });
    expect(result).toEqual(payload);
  });
//Sahte post → 400 + { detail: "bad link" },addMeetingBot exception atmalı
//spat: Hata status’ta UI’nin yakalayacağı throw oluşuyor (kırmızı mesaj için).
  it("addMeetingBot throws on error status", async () => {
    vi.mocked(httpClient.post).mockResolvedValue(
      createAxiosResponse({ detail: "bad link" }, 400),
    );

    await expect(
      addMeetingBot("https://zoom.us/j/1"),
    ).rejects.toThrow("bad link");
  });

  it("fetchTranscript returns segments", async () => {
    const segments = [
      { id: "s1", speaker: "Ayşe", text: "Merhaba", at: "01:05" },
    ];
    vi.mocked(httpClient.get).mockResolvedValue(
      createAxiosResponse({ segments }, 200), //Sahte get → 200 + { segments: [...] }
    );

    const result = await fetchTranscript("google_meet", "abc-defg-hij");
 
    expect(httpClient.get).toHaveBeenCalledWith(  //Doğru query URL mi? (/api/transcriptapi?platform=...&nativeMeetingId=...
      getTranscriptApiUrl("google_meet", "abc-defg-hij"),
    );
    expect(result).toEqual(segments); //Sonuç segments listesi mi?
  });
//İspat: Transcript alınamazsa sessizce yanlış data dönmez; hata fırlatır.
  it("fetchTranscript throws on error status", async () => {
    vi.mocked(httpClient.get).mockResolvedValue(
      createAxiosResponse({ detail: "missing" }, 404),  //Sahte get → 404 + { detail: "missing" }
    );

    await expect(
      fetchTranscript("google_meet", "abc-defg-hij"),  //fetchTranscript throw etmeli
    ).rejects.toThrow("missing");
  });
});