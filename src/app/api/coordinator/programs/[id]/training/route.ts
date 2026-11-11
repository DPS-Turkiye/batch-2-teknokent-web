import type { NextRequest } from "next/server";
import { z } from "zod";

import { fetchTrainingForEditor, saveTraining } from "@/lib/api/training";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readJsonBody } from "@/lib/server/request-body";
import { requireCoordinatorOrAdminSession } from "@/lib/server/require-coordinator";

// Only the shape is checked here; the backend checks the link and the ten questions. The editor
// always sends four options and a chosen answer (TrainingQuestionDraft), so anything else is refused.
const questionSchema = z.looseObject({
  text: z.string(),
  options: z.tuple([z.string(), z.string(), z.string(), z.string()]),
  correctOption: z.number(),
});

const saveTrainingSchema = z.object({
  videoUrl: z.string(),
  questions: z.array(questionSchema),
});

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Context) {
  try {
    const auth = await requireCoordinatorOrAdminSession();
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
    const auth = await requireCoordinatorOrAdminSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    const body = await readJsonBody(request, saveTrainingSchema);
    if (!body.ok) return body.response;
    return backendResponse(
      await saveTraining(auth.session.userId, id, body.data),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("trainingSaveFailed"),
    });
  }
}
