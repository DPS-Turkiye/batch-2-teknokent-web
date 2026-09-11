import { fetchStartupProcess } from "@/lib/api/startup-process";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { getSessionIds } from "@/lib/session";

export async function GET() {
  try {
    const { organizationId } = await getSessionIds();
    return backendResponse(await fetchStartupProcess(organizationId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Startup süreci yüklenemedi.",
    });
  }
}
