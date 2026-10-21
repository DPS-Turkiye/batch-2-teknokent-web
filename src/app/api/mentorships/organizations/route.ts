import { fetchOrganizationsDirectory } from "@/lib/api/mentorships";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { getSessionMentorId } from "@/lib/session";

export async function GET() {
  try {
    await getSessionMentorId();
    const response = await fetchOrganizationsDirectory();
    const orgs = Array.isArray(response.data)
      ? response.data.map((item: { id: string; name: string }) => ({
          id: item.id,
          name: item.name,
        }))
      : [];
    return backendResponse({ ...response, data: orgs });
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("startupListUnavailable"),
    });
  }
}
