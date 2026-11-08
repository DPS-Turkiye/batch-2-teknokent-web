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
    const body = (await request.json()) as { categories?: unknown };
    const categories = Array.isArray(body.categories)
      ? body.categories.filter((value): value is PeerTopicCategory =>
          PEER_TOPIC_CATEGORIES.includes(value as PeerTopicCategory),
        )
      : [];
    return backendResponse(
      await replaceProgramPeerCategories(auth.session.userId, id, categories),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("peerCategoriesSaveFailed"),
    });
  }
}
