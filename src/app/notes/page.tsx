import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { MeetingNotesListView } from "@/components/notes/meeting-notes-list-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  return { title: t("notes"), description: t("notesDescription") };
}

export default function NotesPage() {
  return <MeetingNotesListView />;
}
