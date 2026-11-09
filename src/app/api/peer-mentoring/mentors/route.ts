import type { NextRequest } from "next/server";

import {
  PEER_TOPIC_CATEGORIES,
  type PeerTopicCategory,
} from "@/interfaces/peer-mentoring";
import { fetchPeerMentors } from "@/lib/api/peer-mentoring";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionUser } from "@/lib/session";

function categoryParam(value: string | null): PeerTopicCategory | undefined {
  return PEER_TOPIC_CATEGORIES.find((category) => category === value);
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) throw new SessionRequiredError();
    const params = request.nextUrl.searchParams;
    const q = params.get("q")?.trim();
    return backendResponse(
      await fetchPeerMentors(session.userId, {
        category: categoryParam(params.get("category")),
        q: q || undefined,
      }),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("peerMentoringLoadFailed"),
    });
  }
}
