import type { NextRequest } from "next/server";
import { z } from "zod";

import {
  PeerExperienceKind,
  PeerTopicCategory,
  PeerTopicLevel,
} from "@/interfaces/peer-mentoring";
import {
  fetchPeerMentorProfile,
  savePeerMentorProfile,
} from "@/lib/api/peer-mentoring";
import {
  PEER_EXPERIENCE_CARDS_MAX,
  PEER_EXPERIENCE_SUMMARY_MAX,
  PEER_EXPERIENCE_TITLE_MAX,
  YEAR_MONTH,
} from "@/lib/peer-mentoring";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readJsonBody } from "@/lib/server/request-body";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionUser } from "@/lib/session";

const peerMentorProfileSchema = z.object({
  categories: z.array(z.enum(PeerTopicCategory)),
  subTopics: z.array(z.string()),
  strongCourses: z.array(z.string()),
  projects: z.array(z.string()),
  erasmus: z.string(),
  helpWith: z.string(),
  linkedinUrl: z.string(),
  levels: z.partialRecord(z.enum(PeerTopicCategory), z.enum(PeerTopicLevel)),
  experiences: z
    .array(
      z.object({
        kind: z.enum(PeerExperienceKind),
        title: z.string().trim().min(1).max(PEER_EXPERIENCE_TITLE_MAX),
        organization: z.string().max(PEER_EXPERIENCE_TITLE_MAX).nullable(),
        startedOn: z.string().regex(YEAR_MONTH),
        endedOn: z.string().regex(YEAR_MONTH).nullable(),
        summary: z.string().max(PEER_EXPERIENCE_SUMMARY_MAX).nullable(),
      }),
    )
    .max(PEER_EXPERIENCE_CARDS_MAX),
});

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) throw new SessionRequiredError();
    return backendResponse(await fetchPeerMentorProfile(session.userId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("peerMentoringLoadFailed"),
    });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) throw new SessionRequiredError();
    const body = await readJsonBody(request, peerMentorProfileSchema);
    if (!body.ok) return body.response;
    return backendResponse(
      await savePeerMentorProfile(session.userId, body.data),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("peerMentorProfileSaveFailed"),
    });
  }
}
