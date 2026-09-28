import { NextRequest, NextResponse } from "next/server";

import { UserRole } from "@/interfaces/session";
import {
  fetchAssistantShare,
  publishAssistantShare,
} from "@/lib/api/meeting-notes";
import { publishAssistantShareBodySchema } from "@/lib/notes-schemas";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { requireMentorSession } from "@/lib/server/require-program-access";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionUser } from "@/lib/session";
import { fetchMeetingTranscript } from "@/lib/transcriptapi";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getSessionUser();
    if (!session) throw new SessionRequiredError();
    const { id } = await context.params;
    if (session.role === UserRole.Mentor) {
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
      message: "Asistan paylaşımı yüklenemedi.",
    });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireMentorSession();
    if (!auth.ok) return auth.response;
    const { id } = await context.params;
    const parsed = publishAssistantShareBodySchema.safeParse(
      await request.json(),
    );
    if (!parsed.success) {
      return NextResponse.json(
        {
          code: "INVALID_REQUEST",
          message: "Transkript veya rapor içeriği gerekli.",
        },
        { status: 400 },
      );
    }
    const body = parsed.data;
    if (body.kind === "PROVIDER_TRANSCRIPT") {
      const idToken = request.headers
        .get("authorization")
        ?.match(/^Bearer\s+(.+)$/i)?.[1];
      if (!idToken)
        return NextResponse.json(
          { message: "Authentication is required" },
          { status: 401 },
        );
      const transcript = await fetchMeetingTranscript(
        body.assistantSessionId,
        idToken,
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
            message: "Toplantı transkripti boş.",
          },
          { status: 400 },
        );
      }
      return backendResponse(
        await publishAssistantShare(id, auth.session.userId, {
          kind: "TRANSCRIPT",
          transcript: segments,
        }),
      );
    }
    return backendResponse(
      await publishAssistantShare(id, auth.session.userId, body),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Asistan paylaşımı yayımlanamadı.",
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
