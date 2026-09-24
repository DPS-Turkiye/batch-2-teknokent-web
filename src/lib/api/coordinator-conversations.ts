import "server-only";

import type {
  CoordinatorConversation,
  CoordinatorMessage,
  StartCoordinatorConversationInput,
} from "@/interfaces/coordinator-conversation";
import { backendRequest } from "@/lib/server/backend-client";

const BASE = "/api/coordinator-conversations";

export function fetchCoordinatorConversations(actorId: string) {
  return backendRequest<CoordinatorConversation[]>({
    method: "GET",
    url: BASE,
    params: { actorId },
  });
}

export function startCoordinatorConversation(
  actorId: string,
  input: StartCoordinatorConversationInput,
) {
  return backendRequest<CoordinatorConversation>({
    method: "POST",
    url: BASE,
    data: { ...input, actorId },
  });
}

export function fetchCoordinatorMessages(actorId: string, id: string) {
  return backendRequest<CoordinatorMessage[]>({
    method: "GET",
    url: `${BASE}/${encodeURIComponent(id)}/messages`,
    params: { actorId },
  });
}

export function sendCoordinatorMessage(
  actorId: string,
  id: string,
  body: string,
) {
  return backendRequest<CoordinatorMessage>({
    method: "POST",
    url: `${BASE}/${encodeURIComponent(id)}/messages`,
    data: { actorId, body },
  });
}
