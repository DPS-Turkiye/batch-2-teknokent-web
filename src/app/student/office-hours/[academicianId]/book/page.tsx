import { OfficeHoursBookingView } from "@/components/student/office-hours-booking-view";

export default async function StudentOfficeHoursBookingPage({
  params,
}: {
  params: Promise<{ academicianId: string }>;
}) {
  const { academicianId } = await params;
  return <OfficeHoursBookingView academicianId={academicianId} />;
}
