import type { StartupStatusInput } from "@/interfaces/organization";
import { updateOrganizationStatus } from "@/lib/api/organization";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { getSessionIds } from "@/lib/session";

export async function PUT(request: Request) {
  try {
    const { userId, organizationId } = await getSessionIds();
    const status = (await request.json()) as StartupStatusInput;
    return backendResponse(
      await updateOrganizationStatus(organizationId, userId, status),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("startupStatusSaveFailed"),
    });
  }
}
