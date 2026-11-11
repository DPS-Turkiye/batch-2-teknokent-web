import { z } from "zod";

import {
  addCoordinatorNote,
  fetchCoordinatorNotes,
} from "@/lib/api/coordinator-notes";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readJsonBody } from "@/lib/server/request-body";
import { requireCoordinatorOrAdminSession } from "@/lib/server/require-coordinator";

const noteSchema = z.object({ body: z.string() });

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const auth = await requireCoordinatorOrAdminSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    return backendResponse(
      await fetchCoordinatorNotes(auth.session.userId, id),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("notesLoadFailed"),
    });
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const auth = await requireCoordinatorOrAdminSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    const note = await readJsonBody(request, noteSchema);
    if (!note.ok) return note.response;
    return backendResponse(
      await addCoordinatorNote(auth.session.userId, id, note.data.body),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("noteSaveFailed"),
    });
  }
}
