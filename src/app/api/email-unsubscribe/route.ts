import { unsubscribeEmail } from "@/lib/api/email-center";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
  invalidRequest,
} from "@/lib/server/api-response";
import { unsubscribeTokenSchema } from "@/lib/server/email-center-schemas";

/** Called by the unsubscribe page and by mail programs (List-Unsubscribe-Post): the link's token is the only proof. */
export async function POST(request: Request) {
  try {
    const token = unsubscribeTokenSchema.safeParse(
      new URL(request.url).searchParams.get("t"),
    );
    if (!token.success) return await invalidRequest("invalidRequestBody");
    return backendResponse(await unsubscribeEmail(token.data));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("unsubscribeFailed"),
    });
  }
}
