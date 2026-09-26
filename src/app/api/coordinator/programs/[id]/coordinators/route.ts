import {
  addProgramCoordinator,
  fetchProgramCoordinators,
} from "@/lib/api/coordinator-programs";
import type { BackendResponse } from "@/lib/server/backend-client";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    return backendResponse(
      await fetchProgramCoordinators(auth.session.userId, id),
    );
  } catch (error) {
    return apiErrorResponse(error, { message: "Koordinatörler yüklenemedi." });
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    const body = await request.json();
    const response = await addProgramCoordinator(
      auth.session.userId,
      id,
      String(body.userId ?? ""),
    );
    return backendResponse(translateAssignment(response));
  } catch (error) {
    return apiErrorResponse(error, { message: "Koordinatör eklenemedi." });
  }
}

function translateAssignment(response: BackendResponse): BackendResponse {
  if (
    response.status !== 400 ||
    !response.data ||
    typeof response.data !== "object"
  ) {
    return response;
  }
  const message =
    "message" in response.data && typeof response.data.message === "string"
      ? response.data.message
      : "";
  const turkish = message.includes("already runs")
    ? "Bu kişi zaten bu programın koordinatörü."
    : message.includes("approved coordinator")
      ? "Yalnızca onaylı bir koordinatör programa atanabilir."
      : null;
  if (!turkish) return response;
  return { ...response, data: { ...response.data, message: turkish } };
}
