import type { NextRequest } from "next/server";
import { z } from "zod";

import { PeerDocumentVisibility } from "@/interfaces/peer-mentor-documents";
import { addPeerMentorLink } from "@/lib/api/peer-mentor-documents";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readJsonBody } from "@/lib/server/request-body";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionUser } from "@/lib/session";
import { httpUrlOrNull } from "@/lib/utils";

const linkSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1)
    .max(500)
    .refine((url) => httpUrlOrNull(url) !== null),
  visibility: z.enum(PeerDocumentVisibility),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) throw new SessionRequiredError();
    const body = await readJsonBody(request, linkSchema);
    if (!body.ok) return body.response;
    return backendResponse(await addPeerMentorLink(session.userId, body.data));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("documentAddFailed"),
    });
  }
}
