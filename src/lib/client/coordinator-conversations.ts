import type {
  CoordinatorConversation,
  CoordinatorMessage,
  StartCoordinatorConversationInput,
} from "@/interfaces/coordinator-conversation";
import { requireSuccess } from "@/lib/client/api";
import { backendHttp } from "@/lib/client/backend-http";

const BASE = "/api/coordinator-conversations";

export async function getCoordinatorConversations() {
  return requireSuccess(await backendHttp.get<CoordinatorConversation[]>(BASE));
}

export async function startCoordinatorConversation(
  input: StartCoordinatorConversationInput,
) {
  return requireSuccess(
    await backendHttp.post<CoordinatorConversation>(BASE, input),
  );
}

export async function getCoordinatorMessages(id: string) {
  return requireSuccess(
    await backendHttp.get<CoordinatorMessage[]>(
      `${BASE}/${encodeURIComponent(id)}/messages`,
    ),
  );
}

export async function sendCoordinatorMessage(id: string, body: string) {
  return requireSuccess(
    await backendHttp.post<CoordinatorMessage>(
      `${BASE}/${encodeURIComponent(id)}/messages`,
      { body },
    ),
  );
}
