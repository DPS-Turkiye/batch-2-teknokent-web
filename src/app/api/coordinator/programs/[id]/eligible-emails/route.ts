import { z } from "zod";

import {
  addProgramEligibleEmails,
  fetchProgramEligibleEmails,
} from "@/lib/api/coordinator-programs";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readJsonBody } from "@/lib/server/request-body";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";

const eligibleEmailsSchema = z.object({ emails: z.array(z.string()) });

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
    const body = await readJsonBody(request, eligibleEmailsSchema);
    if (!body.ok) return body.response;
    return backendResponse(
      await addProgramEligibleEmails(auth.session.userId, id, body.data.emails),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("eligibleEmailsSaveFailed"),
    });
  }
}
