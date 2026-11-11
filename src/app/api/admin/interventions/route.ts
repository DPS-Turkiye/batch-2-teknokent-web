import { z } from "zod";

import {
  fetchAdminInterventions,
  openAdminIntervention,
} from "@/lib/api/admin-interventions";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readJsonBody } from "@/lib/server/request-body";
import { requireAdminSession } from "@/lib/server/require-admin";

const openInterventionSchema = z.object({
  mentorshipId: z.string(),
  action: z.string(),
  note: z.string(),
});

export async function GET() {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) return auth.response;
    return backendResponse(await fetchAdminInterventions(auth.session.userId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("followUpsLoadFailed"),
    });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) return auth.response;
    const body = await readJsonBody(request, openInterventionSchema);
    if (!body.ok) return body.response;
    return backendResponse(
      await openAdminIntervention(auth.session.userId, body.data),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("notificationSendFailed"),
    });
  }
}
