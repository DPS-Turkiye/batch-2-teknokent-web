import { z } from "zod";

import {
  fetchCoordinatorMessages,
  sendCoordinatorMessage,
} from "@/lib/api/coordinator-conversations";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readJsonBody } from "@/lib/server/request-body";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionIds } from "@/lib/session";

const messageSchema = z.object({ body: z.string() });

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { userId } = await getSessionIds();
    if (!userId) throw new SessionRequiredError();
    const { id } = await params;
    return backendResponse(await fetchCoordinatorMessages(userId, id));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("messagesLoadFailed"),
    });
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { userId } = await getSessionIds();
    if (!userId) throw new SessionRequiredError();
    const { id } = await params;
    const message = await readJsonBody(request, messageSchema);
    if (!message.ok) return message.response;
    return backendResponse(
      await sendCoordinatorMessage(userId, id, message.data.body),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("messageSendFailed"),
    });
  }
}
