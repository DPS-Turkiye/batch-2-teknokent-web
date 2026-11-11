import { z } from "zod";

import { addCoordinator } from "@/lib/api/admin-coordinators";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readJsonBody } from "@/lib/server/request-body";
import { requireAdminSession } from "@/lib/server/require-admin";

const addCoordinatorSchema = z.object({
  fullName: z.string(),
  email: z.string(),
});

export async function POST(request: Request) {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) return auth.response;
    const body = await readJsonBody(request, addCoordinatorSchema);
    if (!body.ok) return body.response;
    return backendResponse(
      await addCoordinator(auth.session.userId, body.data),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("coordinatorAddFailed"),
    });
  }
}
