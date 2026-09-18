import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  parseCv,
  parseStoredCv,
  uploadProfileAnalysis,
} from "@/lib/client/profile-analysis";
import { currentIdToken } from "@/lib/firebase/auth";
import { httpClient } from "@/lib/http-client";

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
    } as never);

    await parseCv(file);

    const [url, , config] = vi.mocked(httpClient.post).mock.calls[0];
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
    } as never);

    await parseStoredCv("cv-1");

    const [url, body, config] = vi.mocked(httpClient.post).mock.calls[0];
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

  it("uploadProfileAnalysis posts to the backend with its params in the query", async () => {
    vi.mocked(httpClient.post).mockResolvedValue({
      status: 201,
      data: { id: "analysis-1" },
    } as never);

    await uploadProfileAnalysis({
      file,
      ocrMode: "force",
      profileType: "individual_mentee",
      appUserId: "user-1",
    });

    const [url, , config] = vi.mocked(httpClient.post).mock.calls[0];
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
    } as never);

    await uploadProfileAnalysis({
      file,
      ocrMode: "auto",
      profileType: "mentee",
    });

    const [url] = vi.mocked(httpClient.post).mock.calls[0];
    expect(url).not.toContain("organizationId");
  });

  it("fails with a clear message when there is no token", async () => {
    vi.mocked(currentIdToken).mockResolvedValue(null);

    await expect(parseCv(file)).rejects.toThrow(/Oturumunuz sona erdi/);
    expect(httpClient.post).not.toHaveBeenCalled();
  });
});
