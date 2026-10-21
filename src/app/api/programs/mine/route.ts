import { fetchOrganizationPrograms } from "@/lib/api/programs";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { requireStartupSession } from "@/lib/server/require-program-access";

export async function GET() {
  try {
    const auth = await requireStartupSession();
    if (!auth.ok) return auth.response;
    return backendResponse(
      await fetchOrganizationPrograms(auth.session.userId),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("myProgramsLoadFailed"),
    });
  }
}
