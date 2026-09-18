import { redirect } from "next/navigation";

/** Toplantılar moved under profile → Toplantı Notlarım (`/notes`). */
export default function StartupMeetingsPage() {
  redirect("/notes");
}
