import { fetchDashboardSummary } from "@/lib/api/dashboard";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { getSessionIds } from "@/lib/session";

export async function GET() {
  try {
    const { organizationId } = await getSessionIds();
    return backendResponse(await fetchDashboardSummary(organizationId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Dashboard service is unavailable.",
    });
  }
}
