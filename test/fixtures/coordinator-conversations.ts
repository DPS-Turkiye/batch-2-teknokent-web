import {
  type CoordinatorConversation,
  CoordinatorConversationCounterpart,
  type CoordinatorMessage,
} from "@/interfaces/coordinator-conversation";

export function coordinatorConversation(
  overrides: Partial<CoordinatorConversation> = {},
): CoordinatorConversation {
  return {
    id: "conversation-1",
    programId: "program-1",
    programName: "METU Stars 2026",
    counterpartType: CoordinatorConversationCounterpart.Mentor,
    counterpartId: "mentor-1",
    counterpartName: "Ayşe Demir",
    coordinatorId: "coordinator-1",
    coordinatorName: "Elif Demir",
    lastMessagePreview: "Bu hafta Perşembe uygunum",
    lastMessageAt: new Date().toISOString(),
    unread: true,
    ...overrides,
  };
}

export function coordinatorMessage(
  overrides: Partial<CoordinatorMessage> = {},
): CoordinatorMessage {
  return {
    id: "message-1",
    senderId: "mentor-1",
    senderName: "Ayşe Demir",
    mine: false,
    body: "Bu hafta Perşembe 10:30 uygun.",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}
