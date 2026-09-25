import { notFound } from "next/navigation";

import { MobileChatView } from "@/components/mobile/mobile-chat-view";
import { isMobileConversationKind } from "@/lib/mobile";

export default async function MobileChatPage({
  params,
}: {
  params: Promise<{ kind: string; id: string }>;
}) {
  const { kind, id } = await params;
  if (!isMobileConversationKind(kind)) notFound();
  return <MobileChatView kind={kind} id={id} />;
}
