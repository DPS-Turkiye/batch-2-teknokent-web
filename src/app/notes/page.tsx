import type { Metadata } from "next";

import { MeetingNotesListView } from "@/components/notes/meeting-notes-list-view";

export const metadata: Metadata = {
  title: "Toplantı Notları | Teknokent",
  description: "Konuya göre gruplanmış toplantı notların.",
};

export default function NotesPage() {
  return <MeetingNotesListView />;
}
