import { redirect } from "next/navigation";

/** Old link, redirects to /notes. */
export default function StartupMeetingsPage() {
  redirect("/notes");
}
