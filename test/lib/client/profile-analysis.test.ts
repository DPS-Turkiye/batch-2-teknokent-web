import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  ProfileAnalysisType,
  ProfileOcrMode,
} from "@/interfaces/profile-analysis";
import {
  parseCv,
  parseStoredCv,
  readCv,
  uploadProfileAnalysis,
} from "@/lib/client/profile-analysis";
import {
  CV_CONSENT_TEXT_VERSION,
  STARTUP_IMPORT_CONSENT_TEXT_VERSION,
} from "@/lib/const";
import { currentIdToken } from "@/lib/firebase/auth";
import { httpClient } from "@/lib/http-client";
import { itemAt } from "@test/fixtures/list-assertions";

vi.mock("@/lib/http-client", () => ({
  httpClient: { post: vi.fn() },
  UPLOAD_TIMEOUT_MS: 120000,
}));

vi.mock("@/lib/firebase/auth", () => ({
  currentIdToken: vi.fn(),
}));

const file = new File(["cv"], "cv.pdf", { type: "application/pdf" });

describe("profile analysis uploads", () => {
  beforeEach(() => {
    vi.mocked(httpClient.post).mockReset();
    vi.mocked(currentIdToken).mockReset();
    vi.mocked(currentIdToken).mockResolvedValue("fresh-token");
  });

  it("parseCv posts to the backend, not the Next.js proxy", async () => {
    vi.mocked(httpClient.post).mockResolvedValue({
      status: 200,
      data: { current_role: "Ürün Yöneticisi" },
    });

    await parseCv(file, true);

    const [url, , config] = itemAt(vi.mocked(httpClient.post).mock.calls, 0);
    expect(url).toContain("http://localhost:8080/api/profile-analyses/preview");
    expect(config).toMatchObject({
      headers: { Authorization: "Bearer fresh-token" },
      timeout: 120000,
    });
  });

  it("parseStoredCv asks the backend to read the stored CV, sending no file", async () => {
    vi.mocked(httpClient.post).mockResolvedValue({
      status: 200,
      data: { current_role: "Ürün Yöneticisi" },
    });

    await parseStoredCv("cv-1", true);

    const [url, body, config] = itemAt(
      vi.mocked(httpClient.post).mock.calls,
      0,
    );
    expect(url).toContain(
      "http://localhost:8080/api/profile-analyses/preview/documents/cv-1?",
    );
    expect(new URLSearchParams(url.split("?")[1]).get("consentAccepted")).toBe(
      "true",
    );
    expect(body).toBeUndefined();
    expect(config).toMatchObject({
      headers: { Authorization: "Bearer fresh-token" },
    });
  });

  it("readCv reads a mentor's CV as one, whether new or stored", async () => {
    vi.mocked(httpClient.post).mockResolvedValue({
      status: 200,
      data: {},
    });

    await readCv(file, true, ProfileAnalysisType.Mentor);
    await readCv({ documentId: "cv-1" }, true, ProfileAnalysisType.Mentor);

    const [newUrl, newBody] = itemAt(vi.mocked(httpClient.post).mock.calls, 0);
    const [storedUrl] = itemAt(vi.mocked(httpClient.post).mock.calls, 1);
    expect(newUrl).toContain("/api/profile-analyses/preview?");
    expect(newBody).toBeInstanceOf(FormData);
    expect(storedUrl).toContain(
      "/api/profile-analyses/preview/documents/cv-1?",
    );
    for (const url of [newUrl, storedUrl]) {
      expect(new URLSearchParams(url.split("?")[1]).get("profileType")).toBe(
        "mentor",
      );
    }
  });

  it("uploadProfileAnalysis posts to the backend with its params in the query", async () => {
    vi.mocked(httpClient.post).mockResolvedValue({
      status: 201,
      data: { id: "analysis-1" },
    });

    await uploadProfileAnalysis({
      file,
      ocrMode: ProfileOcrMode.Force,
      profileType: ProfileAnalysisType.Personal,
      consentAccepted: true,
      appUserId: "user-1",
    });

    const [url, , config] = itemAt(vi.mocked(httpClient.post).mock.calls, 0);
    expect(url).toContain("http://localhost:8080/api/profile-analyses?");
    const query = new URLSearchParams(url.split("?")[1]);
    expect(query.get("profileType")).toBe("individual_mentee");
    expect(query.get("ocrMode")).toBe("force");
    expect(query.get("consentAccepted")).toBe("true");
    expect(query.get("appUserId")).toBe("user-1");
    expect(config).toMatchObject({
      headers: { Authorization: "Bearer fresh-token" },
    });
  });

  it("never sends an organizationId", async () => {
    vi.mocked(httpClient.post).mockResolvedValue({
      status: 201,
      data: { id: "analysis-1" },
    });

    await uploadProfileAnalysis({
      file,
      ocrMode: ProfileOcrMode.Auto,
      profileType: ProfileAnalysisType.Startup,
      consentAccepted: true,
    });

    const [url] = itemAt(vi.mocked(httpClient.post).mock.calls, 0);
    expect(url).not.toContain("organizationId");
  });

  it("sends the person's own answer, so a refused consent reaches the backend as false", async () => {
    vi.mocked(httpClient.post).mockResolvedValue({ status: 200, data: {} });

    await parseCv(file, false);
    await parseStoredCv("cv-1", false);
    await readCv(file, false, ProfileAnalysisType.Mentor);
    await uploadProfileAnalysis({
      file,
      ocrMode: ProfileOcrMode.Auto,
      profileType: ProfileAnalysisType.Startup,
      consentAccepted: false,
    });

    const urls = vi.mocked(httpClient.post).mock.calls.map(([url]) => url);
    expect(urls).toHaveLength(4);
    for (const url of urls) {
      expect(
        new URLSearchParams(url.split("?")[1]).get("consentAccepted"),
      ).toBe("false");
    }
  });

  it("names the consent text the person was shown on every read", async () => {
    vi.mocked(httpClient.post).mockResolvedValue({ status: 200, data: {} });

    await parseCv(file, true);
    await parseStoredCv("cv-1", true);
    await readCv(file, true, ProfileAnalysisType.Mentor);
    await uploadProfileAnalysis({
      file,
      ocrMode: ProfileOcrMode.Auto,
      profileType: ProfileAnalysisType.Startup,
      consentAccepted: true,
    });

    const versions = vi
      .mocked(httpClient.post)
      .mock.calls.map(([url]) =>
        new URLSearchParams(url.split("?")[1]).get("consentTextVersion"),
      );
    // The startup import shows its own consent text, so it names its own version.
    expect(versions).toEqual([
      CV_CONSENT_TEXT_VERSION,
      CV_CONSENT_TEXT_VERSION,
      CV_CONSENT_TEXT_VERSION,
      STARTUP_IMPORT_CONSENT_TEXT_VERSION,
    ]);
    for (const version of [
      CV_CONSENT_TEXT_VERSION,
      STARTUP_IMPORT_CONSENT_TEXT_VERSION,
    ]) {
      expect(version).toMatch(/^[A-Za-z0-9._-]{1,64}$/);
    }
  });

  it("fails with a clear message when there is no token", async () => {
    vi.mocked(currentIdToken).mockResolvedValue(null);

    await expect(parseCv(file, true)).rejects.toThrow(/Oturumunuz sona erdi/);
    expect(httpClient.post).not.toHaveBeenCalled();
  });
});
