import { StudentAppointmentsView } from "@/components/student/appointments-view";
import { sentToParam } from "@/lib/student-appointments";

/** `?sent=<name>`: arriving right after a request was sent shows its confirmation banner. */
export default async function StudentAppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string | string[] }>;
}) {
  const { sent } = await searchParams;
  return <StudentAppointmentsView sentTo={sentToParam(sent)} />;
}
