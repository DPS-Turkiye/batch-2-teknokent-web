import { fetchStartupDocumentRequests } from "@/lib/api/startup-documents";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { getSessionIds } from "@/lib/session";

export async function GET() {
  try {
    const { userId, organizationId } = await getSessionIds();
    return backendResponse(
      await fetchStartupDocumentRequests(organizationId, userId),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("requestedDocumentsLoadFailed"),
    });
  }
}
