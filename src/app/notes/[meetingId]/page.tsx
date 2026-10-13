import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { MeetingNoteRoomView } from "@/components/notes/meeting-note-room-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  return { title: t("notebook"), description: t("notebookDescription") };
}

export default async function MeetingNotePage({
  params,
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = await params;
  return <MeetingNoteRoomView meetingId={meetingId} />;
}
