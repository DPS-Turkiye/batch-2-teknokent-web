import {
  addCoordinatorNote,
  fetchCoordinatorNotes,
} from "@/lib/api/coordinator-notes";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    return backendResponse(
      await fetchCoordinatorNotes(auth.session.userId, id),
    );
  } catch (error) {
    return apiErrorResponse(error, { message: "Notlar yüklenemedi." });
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    const body = await request.json();
    return backendResponse(
      await addCoordinatorNote(auth.session.userId, id, body.body),
    );
  } catch (error) {
    return apiErrorResponse(error, { message: "Not kaydedilemedi." });
  }
}
