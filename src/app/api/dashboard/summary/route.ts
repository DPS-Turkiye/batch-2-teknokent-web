import { fetchDashboardSummary } from "@/lib/api/dashboard";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { getSessionIds } from "@/lib/session";
import { forbiddenWithoutOrganization } from "@/lib/server/without-organization";

export async function GET() {
  try {
    const { organizationId } = await getSessionIds();
    if (!organizationId) return forbiddenWithoutOrganization();
    return backendResponse(await fetchDashboardSummary(organizationId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("homeServiceUnavailable"),
    });
  }
}
