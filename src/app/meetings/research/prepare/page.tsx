import { redirect } from "next/navigation";

import { meetingNotebookHref } from "@/lib/startup-meetings";

// The generic preparation checklist is gone: a meeting is prepared in its own
// notebook (notes, tasks and the documents the mentor asked for).
export default async function MeetingPreparationPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  redirect(id ? meetingNotebookHref(id) : "/notes");
}
