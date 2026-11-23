import {
  deleteEmailCampaign,
  fetchEmailCampaign,
  updateEmailCampaign,
} from "@/lib/api/email-center";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { emailDraftSchema } from "@/lib/server/email-center-schemas";
import { readJsonBody } from "@/lib/server/request-body";
import { requireCoordinatorOrAdminSession } from "@/lib/server/require-coordinator";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireCoordinatorOrAdminSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    return backendResponse(await fetchEmailCampaign(auth.session.userId, id));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("emailsLoadFailed"),
    });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireCoordinatorOrAdminSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    const body = await readJsonBody(request, emailDraftSchema);
    if (!body.ok) return body.response;
    return backendResponse(
      await updateEmailCampaign(auth.session.userId, id, body.data),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("emailSaveFailed"),
    });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireCoordinatorOrAdminSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    return backendResponse(await deleteEmailCampaign(auth.session.userId, id));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("emailSaveFailed"),
    });
  }
}
