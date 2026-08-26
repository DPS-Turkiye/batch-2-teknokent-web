import type { Metadata } from "next";

import { MeetingNoteRoomView } from "@/components/notes/meeting-note-room-view";

export const metadata: Metadata = {
  title: "Toplantı Not Defteri | Teknokent",
  description: "Aynı toplantıdaki herkesin ortak düzenlediği not defteri.",
};

export default async function MeetingNotePage({
  params,
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = await params;
  return <MeetingNoteRoomView meetingId={meetingId} />;
}
