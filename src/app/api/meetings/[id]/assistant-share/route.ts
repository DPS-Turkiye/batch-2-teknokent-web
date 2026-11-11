import { NextResponse, type NextRequest } from "next/server";

import { AssistantShareKind } from "@/interfaces/meeting-note";
import { UserRole } from "@/interfaces/session";
import {
  fetchAssistantShare,
  publishAssistantShare,
} from "@/lib/api/meeting-notes";
import { publishAssistantShareBodySchema } from "@/lib/notes-schemas";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readJsonBody } from "@/lib/server/request-body";
import { requireMentorSession } from "@/lib/server/require-program-access";
import { SessionRequiredError } from "@/lib/server/session-error";
import { sessionSide, SIDE_PARAM } from "@/lib/server/session-side";
import { getSessionUser } from "@/lib/session";
import { fetchMeetingTranscript } from "@/lib/transcriptapi";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSessionUser();
    if (!session) throw new SessionRequiredError();
    const { id } = await context.params;
    if (
      sessionSide(session, request.nextUrl.searchParams.get(SIDE_PARAM)) ===
      UserRole.Mentor
    ) {
      return backendResponse(
        await fetchAssistantShare(id, { viewerId: session.userId }),
      );
    }
    if (!session.organizationId) throw new SessionRequiredError();
    return backendResponse(
      await fetchAssistantShare(id, { organizationId: session.organizationId }),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("assistantShareLoadFailed"),
    });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireMentorSession();
    if (!auth.ok) return auth.response;
    const { id } = await context.params;
    const parsed = await readJsonBody(
      request,
      publishAssistantShareBodySchema,
      { invalidMessage: "transcriptOrReportRequired" },
    );
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;
    if (body.kind === AssistantShareKind.ProviderTranscript) {
      const transcript = await fetchMeetingTranscript(
        body.platform,
        body.nativeMeetingId,
      );
      if (transcript.status < 200 || transcript.status >= 300) {
        return NextResponse.json(transcript.data, {
          status: transcript.status,
        });
      }
      const segments = providerTranscriptSegments(transcript.data);
      if (segments.length === 0) {
        return NextResponse.json(
          {
            code: "INVALID_REQUEST",
            message: await apiText("transcriptEmpty"),
          },
          { status: 400 },
        );
      }
      return backendResponse(
        await publishAssistantShare(id, auth.session.userId, {
          kind: AssistantShareKind.Transcript,
          transcript: segments,
        }),
      );
    }
    return backendResponse(
      await publishAssistantShare(id, auth.session.userId, body),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("assistantSharePublishFailed"),
    });
  }
}

function providerTranscriptSegments(data: unknown) {
  if (!data || typeof data !== "object" || !("segments" in data)) return [];
  const segments = (data as { segments?: unknown }).segments;
  if (!Array.isArray(segments)) return [];
  return segments
    .map((item, index) => {
      const row =
        item && typeof item === "object"
          ? (item as Record<string, unknown>)
          : {};
      const text = typeof row.text === "string" ? row.text : "";
      const at = typeof row.at === "string" ? row.at : "";
      const speaker =
        typeof row.speaker === "string" && row.speaker.trim()
          ? row.speaker
          : "Speaker";
      const id =
        (typeof row.id === "string" && row.id.trim()) ||
        `${at}-${text}` ||
        `line-${index}`;
      return { id, speaker, text, at };
    })
    .filter((line) => line.text.trim());
}
