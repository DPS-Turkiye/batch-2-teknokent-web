import { extractSyllabusPhases } from "@/lib/api/coordinator-programs";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";

const dateOrNull = (value: unknown) =>
  typeof value === "string" && value ? value : null;

export async function POST(request: Request) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const body = await request.json();
    return backendResponse(
      await extractSyllabusPhases(auth.session.userId, {
        documentId: String(body.documentId ?? ""),
        startDate: dateOrNull(body.startDate),
        endDate: dateOrNull(body.endDate),
      }),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("syllabusReadFailed"),
    });
  }
}
