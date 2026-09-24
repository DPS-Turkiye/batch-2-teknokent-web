import type {
  CoordinatorConversation,
  CoordinatorMessage,
  StartCoordinatorConversationInput,
} from "@/interfaces/coordinator-conversation";
import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";

const BASE = "/api/coordinator-conversations";

export async function getCoordinatorConversations() {
  return requireSuccess(await httpClient.get<CoordinatorConversation[]>(BASE));
}

export async function startCoordinatorConversation(
  input: StartCoordinatorConversationInput,
) {
  return requireSuccess(
    await httpClient.post<CoordinatorConversation>(BASE, input),
  );
}

export async function getCoordinatorMessages(id: string) {
  return requireSuccess(
    await httpClient.get<CoordinatorMessage[]>(
      `${BASE}/${encodeURIComponent(id)}/messages`,
    ),
  );
}

export async function sendCoordinatorMessage(id: string, body: string) {
  return requireSuccess(
    await httpClient.post<CoordinatorMessage>(
      `${BASE}/${encodeURIComponent(id)}/messages`,
      { body },
    ),
  );
}
