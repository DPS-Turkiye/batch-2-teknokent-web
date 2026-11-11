import { AcademicianAvailabilityEditView } from "@/components/academician/availability-edit-view";
import { parseAppointmentsSearch } from "@/lib/academician-calendar";

export default async function AcademicianAvailabilityPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <AcademicianAvailabilityEditView
      initial={parseAppointmentsSearch(await searchParams)}
    />
  );
}
