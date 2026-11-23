import {
  createEmailCampaign,
  fetchEmailCampaigns,
} from "@/lib/api/email-center";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { emailDraftSchema } from "@/lib/server/email-center-schemas";
import { readJsonBody } from "@/lib/server/request-body";
import { requireCoordinatorOrAdminSession } from "@/lib/server/require-coordinator";

export async function GET() {
  try {
    const auth = await requireCoordinatorOrAdminSession();
    if (!auth.ok) return auth.response;
    return backendResponse(await fetchEmailCampaigns(auth.session.userId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("emailsLoadFailed"),
    });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireCoordinatorOrAdminSession();
    if (!auth.ok) return auth.response;
    const body = await readJsonBody(request, emailDraftSchema);
    if (!body.ok) return body.response;
    return backendResponse(
      await createEmailCampaign(auth.session.userId, body.data),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("emailSaveFailed"),
    });
  }
}
