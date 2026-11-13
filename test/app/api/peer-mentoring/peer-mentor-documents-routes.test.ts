import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET as getContent } from "@/app/api/peer-mentoring/documents/[documentId]/content/route";
import { GET as getMentorDocuments } from "@/app/api/peer-mentoring/mentors/[mentorId]/documents/route";
import {
  DELETE as deleteDocument,
  PATCH as patchDocument,
} from "@/app/api/peer-mentoring/profile/documents/[documentId]/route";
import {
  GET as getOwnDocuments,
  POST as postDocument,
} from "@/app/api/peer-mentoring/profile/documents/route";
import { POST as postLink } from "@/app/api/peer-mentoring/profile/links/route";
import {
  PeerDocumentVisibility,
  PeerEvidenceType,
} from "@/interfaces/peer-mentor-documents";
import { UserRole } from "@/interfaces/session";
import {
  addPeerMentorLink,
  deletePeerMentorDocument,
  fetchOwnPeerMentorDocuments,
  fetchPeerMentorDocumentContent,
  fetchPeerMentorDocuments,
  updatePeerMentorDocument,
  uploadPeerMentorDocument,
} from "@/lib/api/peer-mentor-documents";
import { getSessionUser } from "@/lib/session";
import { itemAt } from "@test/fixtures/list-assertions";
import {
  peerFileFixture,
  peerLinkFixture,
} from "@test/fixtures/peer-mentor-documents";
import {
  backendRefusal,
  backendResponse,
  tokenRequest,
} from "@test/fixtures/route-handlers";

vi.mock("@/lib/api/peer-mentor-documents", () => ({
  addPeerMentorLink: vi.fn(),
  deletePeerMentorDocument: vi.fn(),
  fetchOwnPeerMentorDocuments: vi.fn(),
  fetchPeerMentorDocumentContent: vi.fn(),
  fetchPeerMentorDocuments: vi.fn(),
  updatePeerMentorDocument: vi.fn(),
  uploadPeerMentorDocument: vi.fn(),
}));
vi.mock("@/lib/session", () => ({ getSessionUser: vi.fn() }));

const DOCUMENT_ID = "8a0e2f4c-0000-4000-8000-000000000001";
const MENTOR_ID = "6d1f5a2b-0000-4000-8000-000000000002";

function params<T extends string>(key: T, value: string) {
  return { params: Promise.resolve({ [key]: value } as Record<T, string>) };
}

function uploadRequest(
  fields: Record<string, string | File>,
  token: string | null = "id-token",
) {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) form.set(key, value);
  return new NextRequest(
    "http://localhost/api/peer-mentoring/profile/documents",
    {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    },
  );
}

const pdf = new File(["%PDF-1.4"], "cv.pdf", { type: "application/pdf" });

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getSessionUser).mockResolvedValue({
    userId: "mentor-1",
    email: "mert@odtu-dev.invalid",
    fullName: "Mert Demir",
    jobTitle: "",
    role: UserRole.Mentee,
  });
});

describe("peer mentor document routes", () => {
  it("need a session", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);

    expect((await getOwnDocuments()).status).toBe(401);
    expect(
      (
        await postLink(
          tokenRequest("http://localhost/api/peer-mentoring/profile/links", {
            method: "POST",
            body: { url: "https://x.test", visibility: "PROFILE" },
          }),
        )
      ).status,
    ).toBe(401);
    expect(
      (
        await getMentorDocuments(
          new Request("http://localhost"),
          params("mentorId", MENTOR_ID),
        )
      ).status,
    ).toBe(401);
    expect(fetchOwnPeerMentorDocuments).not.toHaveBeenCalled();
    expect(addPeerMentorLink).not.toHaveBeenCalled();
  });

  it("list the signed-in mentor's own documents", async () => {
    vi.mocked(fetchOwnPeerMentorDocuments).mockResolvedValue(
      backendResponse([peerFileFixture()]),
    );

    const response = await getOwnDocuments();

    expect(response.status).toBe(200);
    expect(fetchOwnPeerMentorDocuments).toHaveBeenCalledWith("mentor-1");
  });

  it("upload with the bearer token and only the known fields", async () => {
    vi.mocked(uploadPeerMentorDocument).mockResolvedValue(
      backendResponse(peerFileFixture(), 201),
    );

    const response = await postDocument(
      uploadRequest({
        file: pdf,
        evidenceType: PeerEvidenceType.Cv,
        visibility: PeerDocumentVisibility.Profile,
        actorId: "someone-else",
      }),
    );

    expect(response.status).toBe(201);
    const [form, token] = itemAt(
      vi.mocked(uploadPeerMentorDocument).mock.calls,
      0,
    );
    expect(token).toBe("id-token");
    expect([...form.keys()].sort()).toEqual([
      "evidenceType",
      "file",
      "visibility",
    ]);
    expect(form.get("evidenceType")).toBe(PeerEvidenceType.Cv);
  });

  it("refuse an upload without a token or with unknown values", async () => {
    expect(
      (
        await postDocument(
          uploadRequest(
            {
              file: pdf,
              evidenceType: PeerEvidenceType.Cv,
              visibility: PeerDocumentVisibility.Profile,
            },
            null,
          ),
        )
      ).status,
    ).toBe(401);
    expect(
      (
        await postDocument(
          uploadRequest({
            file: pdf,
            evidenceType: "PASSPORT",
            visibility: PeerDocumentVisibility.Profile,
          }),
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await postDocument(
          uploadRequest({
            evidenceType: PeerEvidenceType.Cv,
            visibility: PeerDocumentVisibility.Profile,
          }),
        )
      ).status,
    ).toBe(400);
    expect(uploadPeerMentorDocument).not.toHaveBeenCalled();
  });

  it("refuse an empty or oversized file, a portfolio sent as a file, and a body too large for one file", async () => {
    const huge = new File([new Uint8Array(10 * 1024 * 1024 + 1)], "big.pdf", {
      type: "application/pdf",
    });
    const fields = {
      evidenceType: PeerEvidenceType.Cv,
      visibility: PeerDocumentVisibility.Profile,
    };

    for (const sent of [
      { ...fields, file: new File([], "empty.pdf") },
      { ...fields, file: huge },
      { ...fields, file: pdf, evidenceType: PeerEvidenceType.Portfolio },
    ]) {
      expect((await postDocument(uploadRequest(sent))).status).toBe(400);
    }
    const tooLong = new NextRequest(
      "http://localhost/api/peer-mentoring/profile/documents",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer id-token",
          "content-length": String(20 * 1024 * 1024),
        },
        body: "x",
      },
    );
    expect((await postDocument(tooLong)).status).toBe(400);
    expect(uploadPeerMentorDocument).not.toHaveBeenCalled();
  });

  it("refuse a link that is not a web address", async () => {
    const response = await postLink(
      tokenRequest("http://localhost/api/peer-mentoring/profile/links", {
        method: "POST",
        body: {
          url: "javascript:alert(1)",
          visibility: PeerDocumentVisibility.Profile,
        },
      }),
    );

    expect(response.status).toBe(400);
    expect(addPeerMentorLink).not.toHaveBeenCalled();
  });

  it("add a link as the session's mentor and refuse an unknown visibility", async () => {
    vi.mocked(addPeerMentorLink).mockResolvedValue(
      backendResponse(peerLinkFixture(), 201),
    );
    const url = "http://localhost/api/peer-mentoring/profile/links";

    const added = await postLink(
      tokenRequest(url, {
        method: "POST",
        body: {
          url: " https://github.com/mertdemir ",
          visibility: PeerDocumentVisibility.Profile,
          actorId: "someone-else",
        },
      }),
    );
    const refused = await postLink(
      tokenRequest(url, {
        method: "POST",
        body: { url: "https://x.test", visibility: "EVERYONE" },
      }),
    );

    expect(added.status).toBe(201);
    expect(addPeerMentorLink).toHaveBeenCalledWith("mentor-1", {
      url: "https://github.com/mertdemir",
      visibility: PeerDocumentVisibility.Profile,
    });
    expect(refused.status).toBe(400);
    expect(addPeerMentorLink).toHaveBeenCalledTimes(1);
  });

  it("change visibility and delete by a uuid only", async () => {
    vi.mocked(updatePeerMentorDocument).mockResolvedValue(
      backendResponse(peerFileFixture()),
    );
    vi.mocked(deletePeerMentorDocument).mockResolvedValue(
      backendResponse(null, 204),
    );
    const url = `http://localhost/api/peer-mentoring/profile/documents/${DOCUMENT_ID}`;

    await patchDocument(
      tokenRequest(url, {
        method: "PATCH",
        body: { visibility: PeerDocumentVisibility.Profile },
      }),
      params("documentId", DOCUMENT_ID),
    );
    await deleteDocument(
      tokenRequest(url, { method: "DELETE" }),
      params("documentId", DOCUMENT_ID),
    );
    const traversal = await deleteDocument(
      tokenRequest(url, { method: "DELETE" }),
      params("documentId", ".."),
    );

    expect(updatePeerMentorDocument).toHaveBeenCalledWith(
      "mentor-1",
      DOCUMENT_ID,
      { visibility: PeerDocumentVisibility.Profile },
    );
    expect(deletePeerMentorDocument).toHaveBeenCalledWith(
      "mentor-1",
      DOCUMENT_ID,
    );
    expect(traversal.status).toBe(400);
    expect(deletePeerMentorDocument).toHaveBeenCalledTimes(1);
  });

  it("pass on what the viewer may see of a mentor's documents", async () => {
    vi.mocked(fetchPeerMentorDocuments).mockResolvedValue(
      backendRefusal(404, { code: "NOT_FOUND", message: "not found" }),
    );

    const response = await getMentorDocuments(
      new Request("http://localhost"),
      params("mentorId", MENTOR_ID),
    );

    expect(response.status).toBe(404);
    expect(fetchPeerMentorDocuments).toHaveBeenCalledWith(
      "mentor-1",
      MENTOR_ID,
    );
  });

  it("hand out a file as the backend's attachment, never sniffed or cached", async () => {
    vi.mocked(fetchPeerMentorDocumentContent).mockResolvedValue({
      data: new TextEncoder().encode("%PDF-1.4").buffer,
      headers: {
        "content-type": "application/pdf",
        "content-disposition": "attachment; filename*=UTF-8''cv.pdf",
      },
      status: 200,
    });

    const response = await getContent(
      new Request("http://localhost"),
      params("documentId", DOCUMENT_ID),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("content-disposition")).toBe(
      "attachment; filename*=UTF-8''cv.pdf",
    );
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(await response.text()).toBe("%PDF-1.4");
  });

  it("never serves a file inline or as anything but a PDF, whatever the backend says", async () => {
    vi.mocked(fetchPeerMentorDocumentContent).mockResolvedValue({
      data: new TextEncoder().encode("<script>").buffer,
      headers: { "content-type": "text/html", "content-disposition": "inline" },
      status: 200,
    });

    const response = await getContent(
      new Request("http://localhost"),
      params("documentId", DOCUMENT_ID),
    );

    expect(response.headers.get("content-type")).toBe(
      "application/octet-stream",
    );
    expect(response.headers.get("content-disposition")).toMatch(
      /^attachment; filename="document\.pdf"/,
    );
    expect(response.headers.get("content-security-policy")).toBe(
      "sandbox; default-src 'none'",
    );
  });

  it("answers the backend's refusal for a file the viewer may not open", async () => {
    vi.mocked(fetchPeerMentorDocumentContent).mockResolvedValue(
      backendRefusal(404),
    );

    const response = await getContent(
      new Request("http://localhost"),
      params("documentId", DOCUMENT_ID),
    );
    const invalid = await getContent(
      new Request("http://localhost"),
      params("documentId", "not-an-id"),
    );

    expect(response.status).toBe(404);
    expect(invalid.status).toBe(400);
    expect(fetchPeerMentorDocumentContent).toHaveBeenCalledTimes(1);
  });
});
