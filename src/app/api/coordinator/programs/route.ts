import { fetchCoordinatorPrograms } from "@/lib/api/coordinator-programs";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";

export async function GET() {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    return backendResponse(await fetchCoordinatorPrograms(auth.session.userId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Programlar yüklenemedi.",
    });
  }
}
