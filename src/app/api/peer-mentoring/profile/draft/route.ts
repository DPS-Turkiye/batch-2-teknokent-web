import type { NextRequest } from "next/server";
import { z } from "zod";

import {
  PeerExperienceKind,
  PeerTopicCategory,
  PeerTopicLevel,
} from "@/interfaces/peer-mentoring";
import {
  deletePeerMentorDraft,
  fetchPeerMentorDraft,
  savePeerMentorDraft,
} from "@/lib/api/peer-mentoring";
import {
  PEER_ERASMUS_MAX,
  PEER_EXPERIENCE_CARDS_MAX,
  PEER_EXPERIENCE_SUMMARY_MAX,
  PEER_EXPERIENCE_TITLE_MAX,
  PEER_HELP_WITH_MAX,
} from "@/lib/peer-mentoring";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readJsonBody } from "@/lib/server/request-body";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionUser } from "@/lib/session";

const YEAR_MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const text = (max: number) => z.string().max(max).nullable();

/** The backend's draft limits: the publish limits without their minimums. */
const draftSchema = z.object({
  draft: z.object({
    step: text(32),
    categories: z.array(z.enum(PeerTopicCategory)).max(8).nullable(),
    subTopics: z.array(z.string().max(100)).max(20).nullable(),
    strongCourses: z.array(z.string().max(255)).max(10).nullable(),
    projects: z.array(z.string().max(500)).max(10).nullable(),
    erasmus: text(PEER_ERASMUS_MAX),
    helpWith: text(PEER_HELP_WITH_MAX),
    linkedinUrl: text(255),
    levels: z
      .partialRecord(z.enum(PeerTopicCategory), z.enum(PeerTopicLevel))
      .nullable(),
    experiences: z
      .array(
        z.object({
          kind: z.enum(PeerExperienceKind).nullable(),
          title: text(PEER_EXPERIENCE_TITLE_MAX),
          organization: text(PEER_EXPERIENCE_TITLE_MAX),
          startedOn: z.string().regex(YEAR_MONTH).nullable(),
          endedOn: z.string().regex(YEAR_MONTH).nullable(),
          summary: text(PEER_EXPERIENCE_SUMMARY_MAX),
        }),
      )
      .max(PEER_EXPERIENCE_CARDS_MAX)
      .nullable(),
  }),
});

async function sessionUserId() {
  const session = await getSessionUser();
  if (!session) throw new SessionRequiredError();
  return session.userId;
}

export async function GET() {
  try {
    return backendResponse(await fetchPeerMentorDraft(await sessionUserId()));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("peerMentoringLoadFailed"),
    });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await sessionUserId();
    const body = await readJsonBody(request, draftSchema);
    if (!body.ok) return body.response;
    return backendResponse(await savePeerMentorDraft(userId, body.data.draft));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("peerMentorProfileSaveFailed"),
    });
  }
}

export async function DELETE() {
  try {
    return backendResponse(await deletePeerMentorDraft(await sessionUserId()));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("peerMentorProfileSaveFailed"),
    });
  }
}
