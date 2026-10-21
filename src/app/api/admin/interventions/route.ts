import {
  fetchAdminInterventions,
  openAdminIntervention,
} from "@/lib/api/admin-interventions";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { requireAdminSession } from "@/lib/server/require-admin";

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
    const body = await request.json();
    return backendResponse(
      await openAdminIntervention(auth.session.userId, {
        mentorshipId: String(body.mentorshipId ?? ""),
        action: String(body.action ?? ""),
        note: String(body.note ?? ""),
      }),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("notificationSendFailed"),
    });
  }
}
