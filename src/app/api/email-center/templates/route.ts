import { z } from "zod";

import { fetchEmailTemplates } from "@/lib/api/email-center";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { invalidRequest } from "@/lib/server/request-body";
import { requireCoordinatorOrAdminSession } from "@/lib/server/require-coordinator";

export async function GET(request: Request) {
  try {
    const auth = await requireCoordinatorOrAdminSession();
    if (!auth.ok) return auth.response;
    const programId = z
      .uuid()
      .safeParse(new URL(request.url).searchParams.get("programId"));
    if (!programId.success) return await invalidRequest("invalidRequestBody");
    return backendResponse(
      await fetchEmailTemplates(auth.session.userId, programId.data),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("emailsLoadFailed"),
    });
  }
}
