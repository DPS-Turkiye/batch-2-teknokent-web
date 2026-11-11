import { AcademicianAppointmentsView } from "@/components/academician/appointments-view";
import { parseAppointmentsSearch } from "@/lib/academician-calendar";

export default async function AcademicianAppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <AcademicianAppointmentsView
      initial={parseAppointmentsSearch(await searchParams)}
    />
  );
}
