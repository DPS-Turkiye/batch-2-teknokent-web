import { z } from "zod";

import { setCoordinatorAccess } from "@/lib/api/admin-coordinators";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readJsonBody } from "@/lib/server/request-body";
import { requireAdminSession } from "@/lib/server/require-admin";

const accessSchema = z.object({ active: z.boolean() });

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    const body = await readJsonBody(request, accessSchema);
    if (!body.ok) return body.response;
    return backendResponse(
      await setCoordinatorAccess(auth.session.userId, id, body.data.active),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("coordinatorAccessChangeFailed"),
    });
  }
}
