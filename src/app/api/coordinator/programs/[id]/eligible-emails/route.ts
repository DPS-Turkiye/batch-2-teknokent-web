import {
  addProgramEligibleEmails,
  fetchProgramEligibleEmails,
} from "@/lib/api/coordinator-programs";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    return backendResponse(
      await fetchProgramEligibleEmails(auth.session.userId, id),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("eligibleEmailsLoadFailed"),
    });
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    const body = await request.json();
    const emails = Array.isArray(body.emails) ? body.emails.map(String) : [];
    return backendResponse(
      await addProgramEligibleEmails(auth.session.userId, id, emails),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("eligibleEmailsSaveFailed"),
    });
  }
}
