import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  PeerDocumentVisibility,
  PeerEvidenceType,
} from "@/interfaces/peer-mentor-documents";
import { postUpload } from "@/lib/client/documents";
import {
  addPeerMentorLink,
  deletePeerMentorDocument,
  getOwnPeerMentorDocuments,
  getPeerMentorDocuments,
  peerMentorDocumentContentHref,
  updatePeerMentorDocumentVisibility,
  uploadPeerMentorDocument,
} from "@/lib/client/peer-mentor-documents";
import { httpClient } from "@/lib/http-client";
import { itemAt } from "@test/fixtures/list-assertions";
import {
  peerFileFixture,
  peerLinkFixture,
} from "@test/fixtures/peer-mentor-documents";

vi.mock("@/lib/http-client", () => ({
  httpClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));
vi.mock("@/lib/client/documents", () => ({ postUpload: vi.fn() }));

beforeEach(() => vi.clearAllMocks());

describe("peer mentor documents client", () => {
  it("lists the mentor's own documents", async () => {
    vi.mocked(httpClient.get).mockResolvedValue({
      status: 200,
      data: [peerFileFixture()],
    });

    expect(await getOwnPeerMentorDocuments()).toEqual([peerFileFixture()]);
    expect(httpClient.get).toHaveBeenCalledWith(
      "/api/peer-mentoring/profile/documents",
    );
  });

  it("uploads a file with its type and visibility through the shared upload path", async () => {
    vi.mocked(postUpload).mockResolvedValue(peerFileFixture());
    const file = new File(["%PDF"], "cv.pdf", { type: "application/pdf" });

    await uploadPeerMentorDocument(
      file,
      PeerEvidenceType.Cv,
      PeerDocumentVisibility.Profile,
    );

    const [path, form] = itemAt(vi.mocked(postUpload).mock.calls, 0);
    expect(path).toBe("/api/peer-mentoring/profile/documents");
    expect(form.get("file")).toBe(file);
    expect(form.get("evidenceType")).toBe(PeerEvidenceType.Cv);
    expect(form.get("visibility")).toBe(PeerDocumentVisibility.Profile);
  });

  it("adds a link, changes visibility and deletes", async () => {
    vi.mocked(httpClient.post).mockResolvedValue({
      status: 201,
      data: peerLinkFixture(),
    });
    vi.mocked(httpClient.patch).mockResolvedValue({
      status: 200,
      data: peerFileFixture(),
    });
    vi.mocked(httpClient.delete).mockResolvedValue({ status: 204, data: null });
    const input = {
      url: "https://github.com/mertdemir",
      visibility: PeerDocumentVisibility.Profile,
    };

    expect(await addPeerMentorLink(input)).toEqual(peerLinkFixture());
    await updatePeerMentorDocumentVisibility(
      "doc 1",
      PeerDocumentVisibility.VerificationOnly,
    );
    await deletePeerMentorDocument("doc 1");

    expect(httpClient.post).toHaveBeenCalledWith(
      "/api/peer-mentoring/profile/links",
      input,
    );
    expect(httpClient.patch).toHaveBeenCalledWith(
      "/api/peer-mentoring/profile/documents/doc%201",
      { visibility: PeerDocumentVisibility.VerificationOnly },
    );
    expect(httpClient.delete).toHaveBeenCalledWith(
      "/api/peer-mentoring/profile/documents/doc%201",
    );
  });

  it("reads a mentor's shared documents as none when the backend hides them", async () => {
    vi.mocked(httpClient.get)
      .mockResolvedValueOnce({ status: 200, data: [peerLinkFixture()] })
      .mockResolvedValueOnce({ status: 404, data: { message: "not found" } })
      .mockResolvedValueOnce({ status: 500, data: { message: "boom" } });

    expect(await getPeerMentorDocuments("mentor-1")).toEqual([
      peerLinkFixture(),
    ]);
    expect(await getPeerMentorDocuments("mentor-1")).toEqual([]);
    await expect(getPeerMentorDocuments("mentor-1")).rejects.toThrow();
    expect(httpClient.get).toHaveBeenCalledWith(
      "/api/peer-mentoring/mentors/mentor-1/documents",
    );
  });

  it("opens a file through the app's own route", () => {
    expect(peerMentorDocumentContentHref("doc-1")).toBe(
      "/api/peer-mentoring/documents/doc-1/content",
    );
  });
});
