import { fetchPeerMentorDocuments } from "@/lib/api/peer-mentor-documents";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readUuidParam } from "@/lib/server/path-params";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionUser } from "@/lib/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ mentorId: string }> },
) {
  try {
    const session = await getSessionUser();
    if (!session) throw new SessionRequiredError();
    const mentor = await readUuidParam(
      (await params).mentorId,
      "personIdInvalid",
    );
    if (!mentor.ok) return mentor.response;
    return backendResponse(
      await fetchPeerMentorDocuments(session.userId, mentor.id),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("documentsLoadFailed"),
    });
  }
}
