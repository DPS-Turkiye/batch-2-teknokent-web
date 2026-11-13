import type { NextRequest } from "next/server";

import {
  fetchOwnPeerMentorDocuments,
  uploadPeerMentorDocument,
} from "@/lib/api/peer-mentor-documents";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readBearerToken } from "@/lib/server/bearer-token";
import { readPeerEvidenceUpload } from "@/lib/server/peer-evidence-upload";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionUser } from "@/lib/session";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) throw new SessionRequiredError();
    return backendResponse(await fetchOwnPeerMentorDocuments(session.userId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("documentsLoadFailed"),
    });
  }
}

/**
 * The fallback when the browser cannot reach the backend directly (lib/client/documents.ts). Like /api/documents, the
 * signed-in person's Firebase token is the identity here: the backend verifies it and files the upload under them, so
 * no id from the browser is ever passed on.
 */
export async function POST(request: NextRequest) {
  try {
    const idToken = readBearerToken(request);
    if (!idToken) throw new SessionRequiredError();
    const upload = await readPeerEvidenceUpload(request);
    if (!upload.ok) return upload.response;
    return backendResponse(
      await uploadPeerMentorDocument(upload.form, idToken),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("documentAddFailed"),
    });
  }
}
