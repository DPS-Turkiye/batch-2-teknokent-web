import type {
  AddPeerMentorLinkInput,
  PeerDocumentVisibility,
  PeerEvidenceType,
  PeerMentorDocument,
} from "@/interfaces/peer-mentor-documents";
import { ClientApiError, requireSuccess } from "@/lib/client/api";
import { backendHttp } from "@/lib/client/backend-http";
import { postUpload } from "@/lib/client/documents";

const PDF = "application/pdf";

// The backend takes the peer mentor (or viewer) from the session and decides who may see which document.
const PROFILE_DOCUMENTS = "/api/peer-mentoring/profile/documents";

function documentUrl(documentId: string) {
  return `${PROFILE_DOCUMENTS}/${encodeURIComponent(documentId)}`;
}

export async function getOwnPeerMentorDocuments(): Promise<
  PeerMentorDocument[]
> {
  return requireSuccess(
    await backendHttp.get<PeerMentorDocument[]>(PROFILE_DOCUMENTS),
  );
}

export function uploadPeerMentorDocument(
  file: File,
  evidenceType: PeerEvidenceType,
  visibility: PeerDocumentVisibility,
): Promise<PeerMentorDocument> {
  const data = new FormData();
  data.set("file", file);
  data.set("evidenceType", evidenceType);
  data.set("visibility", visibility);
  return postUpload<PeerMentorDocument>(PROFILE_DOCUMENTS, data);
}

export async function addPeerMentorLink(
  input: AddPeerMentorLinkInput,
): Promise<PeerMentorDocument> {
  return requireSuccess(
    await backendHttp.post<PeerMentorDocument>(
      "/api/peer-mentoring/profile/links",
      input,
    ),
  );
}

export async function updatePeerMentorDocumentVisibility(
  documentId: string,
  visibility: PeerDocumentVisibility,
): Promise<PeerMentorDocument> {
  return requireSuccess(
    await backendHttp.patch<PeerMentorDocument>(documentUrl(documentId), {
      visibility,
    }),
  );
}

export async function deletePeerMentorDocument(
  documentId: string,
): Promise<void> {
  requireSuccess(await backendHttp.delete<null>(documentUrl(documentId)));
}

/** What the student may see of a mentor's evidence: nothing (an empty list) when the backend says 404. */
export async function getPeerMentorDocuments(
  mentorId: string,
): Promise<PeerMentorDocument[]> {
  try {
    return requireSuccess(
      await backendHttp.get<PeerMentorDocument[]>(
        `/api/peer-mentoring/mentors/${encodeURIComponent(mentorId)}/documents`,
      ),
    );
  } catch (error) {
    if (error instanceof ClientApiError && error.status === 404) return [];
    throw error;
  }
}

/**
 * "Görüntüle": fetches the file and saves it. It is never opened in this origin: the bytes are handed over as a PDF
 * or, whatever else the backend might say, as opaque bytes, and always as a download.
 */
export async function downloadPeerMentorDocument(
  documentId: string,
  filename: string,
): Promise<void> {
  const response = await backendHttp.get<Blob>(
    `/api/peer-mentoring/documents/${encodeURIComponent(documentId)}/content`,
    { responseType: "blob", headers: { Accept: "*/*" } },
  );
  const file = requireSuccess(response);
  const type =
    response.headers["content-type"] === PDF ? PDF : "application/octet-stream";
  const url = URL.createObjectURL(new Blob([file], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
