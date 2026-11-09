import type { NextRequest } from "next/server";

import type { SaveTrainingInput } from "@/interfaces/training";
import { fetchTrainingForEditor, saveTraining } from "@/lib/api/training";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Context) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    return backendResponse(
      await fetchTrainingForEditor(auth.session.userId, id),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("trainingLoadFailed"),
    });
  }
}

/** The backend validates the link and the ten questions; the actor is always the session's. */
export async function PUT(request: NextRequest, { params }: Context) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    const body = (await request
      .json()
      .catch(() => ({}))) as Partial<SaveTrainingInput>;
    return backendResponse(
      await saveTraining(auth.session.userId, id, {
        videoUrl: body.videoUrl ?? "",
        questions: body.questions ?? [],
      }),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("trainingSaveFailed"),
    });
  }
}
