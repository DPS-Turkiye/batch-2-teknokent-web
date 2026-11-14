import "server-only";

import type {
  AddPeerMentorLinkInput,
  PeerMentorDocument,
  UpdatePeerMentorDocumentInput,
} from "@/interfaces/peer-mentor-documents";
import { UPLOAD_TIMEOUT_MS } from "@/lib/http-client";
import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";

const PROFILE_DOCUMENTS = "/api/peer-mentoring/profile/documents";

function documentUrl(documentId: string) {
  return `${PROFILE_DOCUMENTS}/${encodeURIComponent(documentId)}`;
}

export function fetchOwnPeerMentorDocuments(actorId: string) {
  return backendRequest<PeerMentorDocument[]>({
    method: HttpMethod.Get,
    url: PROFILE_DOCUMENTS,
    params: { actorId },
  });
}

/** The form carries the file, its type and visibility; the backend takes the uploader from the bearer token. */
export function uploadPeerMentorDocument(formData: FormData, idToken: string) {
  return backendRequest<PeerMentorDocument>(
    {
      method: HttpMethod.Post,
      url: PROFILE_DOCUMENTS,
      data: formData,
      timeout: UPLOAD_TIMEOUT_MS,
    },
    { idToken },
  );
}

export function addPeerMentorLink(
  actorId: string,
  input: AddPeerMentorLinkInput,
) {
  return backendRequest<PeerMentorDocument>({
    method: HttpMethod.Post,
    url: "/api/peer-mentoring/profile/links",
    data: { ...input, actorId },
  });
}

export function updatePeerMentorDocument(
  actorId: string,
  documentId: string,
  input: UpdatePeerMentorDocumentInput,
) {
  return backendRequest<PeerMentorDocument>({
    method: HttpMethod.Patch,
    url: documentUrl(documentId),
    data: { ...input, actorId },
  });
}

export function deletePeerMentorDocument(actorId: string, documentId: string) {
  return backendRequest<null>({
    method: HttpMethod.Delete,
    url: documentUrl(documentId),
    params: { actorId },
  });
}

/** What the actor may see of a mentor's evidence; the backend answers 404 when that is nothing. */
export function fetchPeerMentorDocuments(actorId: string, mentorId: string) {
  return backendRequest<PeerMentorDocument[]>({
    method: HttpMethod.Get,
    url: `/api/peer-mentoring/mentors/${encodeURIComponent(mentorId)}/documents`,
    params: { actorId },
  });
}

export function fetchPeerMentorDocumentContent(
  actorId: string,
  documentId: string,
) {
  return backendRequest<ArrayBuffer>({
    method: HttpMethod.Get,
    url: `/api/peer-mentoring/documents/${encodeURIComponent(documentId)}/content`,
    params: { actorId },
    responseType: "arraybuffer",
    headers: { Accept: "*/*" },
  });
}
