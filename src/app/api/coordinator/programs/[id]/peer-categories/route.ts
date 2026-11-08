import {
  PEER_TOPIC_CATEGORIES,
  type PeerTopicCategory,
} from "@/interfaces/peer-mentoring";
import {
  fetchProgramPeerCategories,
  replaceProgramPeerCategories,
} from "@/lib/api/program-peer-categories";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";

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
    const body = (await request.json().catch(() => null)) as {
      categories?: unknown;
    } | null;
    const categories = body?.categories;
    // Never fall back to [] here: an empty set turns every category off.
    if (
      !Array.isArray(categories) ||
      !categories.every((value) =>
        PEER_TOPIC_CATEGORIES.includes(value as PeerTopicCategory),
      )
    ) {
      return apiErrorResponse(new Error("Invalid categories"), {
        message: await apiText("peerCategoriesInvalid"),
        status: 400,
      });
    }
    return backendResponse(
      await replaceProgramPeerCategories(
        auth.session.userId,
        id,
        categories as PeerTopicCategory[],
      ),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("peerCategoriesSaveFailed"),
    });
  }
}
