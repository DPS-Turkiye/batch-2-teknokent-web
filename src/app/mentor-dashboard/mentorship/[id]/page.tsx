import { redirect } from "next/navigation";

import { mentorRequestStartupHref } from "@/lib/mentorship-workspace";

/** The mentor's request detail is /mentorships/requests/[id]; old links and notifications still land there. */
export default async function MentorshipDetailRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(mentorRequestStartupHref(id));
}
