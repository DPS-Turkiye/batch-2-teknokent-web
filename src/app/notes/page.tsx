import type { Metadata } from "next";

import { MeetingNotesListView } from "@/components/notes/meeting-notes-list-view";

export const metadata: Metadata = {
  title: "Not Defterlerim | Teknokent",
  description: "Toplantı başına ortak not defteri ve yapılacaklar listesi.",
};

export default function NotesPage() {
  return <MeetingNotesListView />;
}
