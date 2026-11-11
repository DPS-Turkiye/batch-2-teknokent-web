import { z } from "zod";

import { PeerTopicCategory } from "@/interfaces/peer-mentoring";
import {
  fetchProgramPeerCategories,
  replaceProgramPeerCategories,
} from "@/lib/api/program-peer-categories";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readJsonBody } from "@/lib/server/request-body";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";

// Never fall back to [] here: an empty set turns every category off.
const peerCategoriesSchema = z.object({
  categories: z.array(z.enum(PeerTopicCategory)),
});

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    return backendResponse(
      await fetchProgramPeerCategories(auth.session.userId, id),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("peerCategoriesLoadFailed"),
    });
  }
}

export async function PUT(request: Request, { params }: Context) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    const body = await readJsonBody(request, peerCategoriesSchema, {
      invalidMessage: "peerCategoriesInvalid",
    });
    if (!body.ok) return body.response;
    return backendResponse(
      await replaceProgramPeerCategories(
        auth.session.userId,
        id,
        body.data.categories,
      ),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("peerCategoriesSaveFailed"),
    });
  }
}
