import { IskurAppointmentsView } from "@/components/student/iskur-appointments-view";

/** `?sent=<name>`: arriving right after a request was sent shows its confirmation banner. */
export default async function StudentAppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const { sent } = await searchParams;
  return <IskurAppointmentsView sentTo={sent?.trim() || null} />;
}
