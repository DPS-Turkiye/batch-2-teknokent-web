import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  PeerDocumentVisibility,
  PeerEvidenceType,
} from "@/interfaces/peer-mentor-documents";
import { ClientApiError } from "@/lib/client/api";
import { backendHttp } from "@/lib/client/backend-http";
import { postUpload } from "@/lib/client/documents";
import {
  addPeerMentorLink,
  deletePeerMentorDocument,
  downloadPeerMentorDocument,
  getOwnPeerMentorDocuments,
  getPeerMentorDocuments,
  updatePeerMentorDocumentVisibility,
  uploadPeerMentorDocument,
} from "@/lib/client/peer-mentor-documents";
import { itemAt } from "@test/fixtures/list-assertions";
import {
  peerFileFixture,
  peerLinkFixture,
} from "@test/fixtures/peer-mentor-documents";

vi.mock("@/lib/client/backend-http", async () =>
  (await import("@test/mocks/backend-http")).backendHttpMock(),
);
vi.mock("@/lib/client/documents", () => ({ postUpload: vi.fn() }));

beforeEach(() => vi.clearAllMocks());

describe("peer mentor documents client", () => {
  it("lists the mentor's own documents", async () => {
    vi.mocked(backendHttp.get).mockResolvedValue({
      status: 200,
      data: [peerFileFixture()],
    });

    expect(await getOwnPeerMentorDocuments()).toEqual([peerFileFixture()]);
    expect(backendHttp.get).toHaveBeenCalledWith(
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
    vi.mocked(backendHttp.post).mockResolvedValue({
      status: 201,
      data: peerLinkFixture(),
    });
    vi.mocked(backendHttp.patch).mockResolvedValue({
      status: 200,
      data: peerFileFixture(),
    });
    vi.mocked(backendHttp.delete).mockResolvedValue({
      status: 204,
      data: null,
    });
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

    expect(backendHttp.post).toHaveBeenCalledWith(
      "/api/peer-mentoring/profile/links",
      input,
    );
    expect(backendHttp.patch).toHaveBeenCalledWith(
      "/api/peer-mentoring/profile/documents/doc%201",
      { visibility: PeerDocumentVisibility.VerificationOnly },
    );
    expect(backendHttp.delete).toHaveBeenCalledWith(
      "/api/peer-mentoring/profile/documents/doc%201",
    );
  });

  it("reads a mentor's shared documents as none when the backend hides them", async () => {
    vi.mocked(backendHttp.get)
      .mockResolvedValueOnce({ status: 200, data: [peerLinkFixture()] })
      .mockResolvedValueOnce({ status: 404, data: { message: "not found" } })
      .mockResolvedValueOnce({ status: 500, data: { message: "boom" } });

    expect(await getPeerMentorDocuments("mentor-1")).toEqual([
      peerLinkFixture(),
    ]);
    expect(await getPeerMentorDocuments("mentor-1")).toEqual([]);
    await expect(getPeerMentorDocuments("mentor-1")).rejects.toThrow();
    expect(backendHttp.get).toHaveBeenCalledWith(
      "/api/peer-mentoring/mentors/mentor-1/documents",
    );
  });

  it("saves a file from the backend as a download, never as a page of this origin", async () => {
    vi.mocked(backendHttp.get).mockResolvedValue({
      status: 200,
      data: new Blob(["<html>"]),
      headers: { "content-type": "text/html" },
    });
    const urls = stubObjectUrls();
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(function (this: HTMLAnchorElement) {
        expect(this.href).toBe("blob:peer-file");
        expect(this.download).toBe("Transkript.pdf");
      });

    await downloadPeerMentorDocument("doc 1", "Transkript.pdf");

    expect(backendHttp.get).toHaveBeenCalledWith(
      "/api/peer-mentoring/documents/doc%201/content",
      { responseType: "blob", headers: { Accept: "*/*" } },
    );
    expect(click).toHaveBeenCalledTimes(1);
    expect(urls.types).toEqual(["application/octet-stream"]);
    expect(urls.revoked).toEqual(["blob:peer-file"]);
    expect(document.querySelector("a[download]")).toBeNull();
    click.mockRestore();
    urls.restore();
  });

  it("keeps a PDF a PDF and saves nothing when the backend refuses", async () => {
    vi.mocked(backendHttp.get)
      .mockResolvedValueOnce({
        status: 200,
        data: new Blob(["%PDF"]),
        headers: { "content-type": "application/pdf" },
      })
      .mockResolvedValueOnce({ status: 404, data: new Blob([]), headers: {} });
    const urls = stubObjectUrls();
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);

    await downloadPeerMentorDocument("doc-1", "cv.pdf");
    await expect(
      downloadPeerMentorDocument("doc-2", "cv.pdf"),
    ).rejects.toBeInstanceOf(ClientApiError);

    expect(urls.types).toEqual(["application/pdf"]);
    expect(click).toHaveBeenCalledTimes(1);
    click.mockRestore();
    urls.restore();
  });
});

/** jsdom has no object URLs; these record what would have been made of each blob. */
function stubObjectUrls() {
  const original = {
    create: URL.createObjectURL,
    revoke: URL.revokeObjectURL,
  };
  const types: string[] = [];
  const revoked: string[] = [];
  URL.createObjectURL = (object: Blob | MediaSource) => {
    if (object instanceof Blob) types.push(object.type);
    return "blob:peer-file";
  };
  URL.revokeObjectURL = (url: string) => {
    revoked.push(url);
  };
  return {
    types,
    revoked,
    restore: () => {
      URL.createObjectURL = original.create;
      URL.revokeObjectURL = original.revoke;
    },
  };
}
