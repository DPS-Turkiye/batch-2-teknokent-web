import { fetchProgramDirectory } from "@/lib/api/programs";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { requireCoordinatorSession } from "@/lib/server/require-program-access";

export async function GET() {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    return backendResponse(await fetchProgramDirectory());
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("startupsAndMentorsLoadFailed"),
    });
  }
}
