import { fetchPendingMembers } from "@/lib/api/organization-members";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { getSessionIds } from "@/lib/session";

export async function GET() {
  try {
    const { organizationId, userId } = await getSessionIds();
    return backendResponse(await fetchPendingMembers(organizationId, userId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Katılım bekleyen üyeler yüklenemedi.",
    });
  }
}
