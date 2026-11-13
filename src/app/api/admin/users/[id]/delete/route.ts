import type { NextRequest } from "next/server";
import { z } from "zod";

import { deleteUser } from "@/lib/api/accounts";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readBearerToken } from "@/lib/server/bearer-token";
import { readJsonBody } from "@/lib/server/request-body";
import { requireAdminSession } from "@/lib/server/require-admin";
import { SessionRequiredError } from "@/lib/server/session-error";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const deleteUserSchema = z.object({
  confirmEmail: z.string().trim().min(1).max(255),
});

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) return auth.response;
    // The backend takes the acting admin from this token alone; the shared service credentials cannot delete.
    const idToken = readBearerToken(request);
    if (!idToken) throw new SessionRequiredError();

    const { id } = await context.params;
    const body = await readJsonBody(request, deleteUserSchema);
    if (!body.ok) return body.response;
    return backendResponse(
      await deleteUser(id, body.data.confirmEmail, idToken),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("userDeleteFailed"),
    });
  }
}
