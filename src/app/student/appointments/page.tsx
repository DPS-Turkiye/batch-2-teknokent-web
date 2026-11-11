import { StudentAppointmentsView } from "@/components/student/appointments-view";

/** `?sent=<name>`: arriving right after a request was sent shows its confirmation banner. */
export default async function StudentAppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const { sent } = await searchParams;
  return <StudentAppointmentsView sentTo={sent?.trim() || null} />;
}
