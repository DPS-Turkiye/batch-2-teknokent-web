import {
  fetchCoordinatorMessages,
  sendCoordinatorMessage,
} from "@/lib/api/coordinator-conversations";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionIds } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { userId } = await getSessionIds();
    if (!userId) throw new SessionRequiredError();
    const { id } = await params;
    return backendResponse(await fetchCoordinatorMessages(userId, id));
  } catch (error) {
    return apiErrorResponse(error, { message: "Mesajlar yüklenemedi." });
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { userId } = await getSessionIds();
    if (!userId) throw new SessionRequiredError();
    const { id } = await params;
    const body = await request.json();
    return backendResponse(
      await sendCoordinatorMessage(userId, id, String(body.body ?? "")),
    );
  } catch (error) {
    return apiErrorResponse(error, { message: "Mesaj gönderilemedi." });
  }
}
