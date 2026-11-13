import type { NextRequest } from "next/server";
import { z } from "zod";

import { PeerDocumentVisibility } from "@/interfaces/peer-mentor-documents";
import {
  deletePeerMentorDocument,
  updatePeerMentorDocument,
} from "@/lib/api/peer-mentor-documents";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readUuidParam } from "@/lib/server/path-params";
import { readJsonBody } from "@/lib/server/request-body";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionUser } from "@/lib/session";

type Params = { params: Promise<{ documentId: string }> };

const visibilitySchema = z.object({
  visibility: z.enum(PeerDocumentVisibility),
});

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await getSessionUser();
    if (!session) throw new SessionRequiredError();
    const document = await readUuidParam(
      (await params).documentId,
      "invalidRequestFields",
    );
    if (!document.ok) return document.response;
    const body = await readJsonBody(request, visibilitySchema);
    if (!body.ok) return body.response;
    return backendResponse(
      await updatePeerMentorDocument(session.userId, document.id, body.data),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("peerMentorProfileSaveFailed"),
    });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const session = await getSessionUser();
    if (!session) throw new SessionRequiredError();
    const document = await readUuidParam(
      (await params).documentId,
      "invalidRequestFields",
    );
    if (!document.ok) return document.response;
    return backendResponse(
      await deletePeerMentorDocument(session.userId, document.id),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("fileDeleteFailed"),
    });
  }
}
