import { testEmailCampaign } from "@/lib/api/email-center";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { requireCoordinatorOrAdminSession } from "@/lib/server/require-coordinator";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireCoordinatorOrAdminSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    return backendResponse(await testEmailCampaign(auth.session.userId, id));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("emailTestSendFailed"),
    });
  }
}
