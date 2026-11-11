import { OfficeHoursProfileView } from "@/components/student/office-hours-profile-view";

export default async function StudentOfficeHoursProfilePage({
  params,
}: {
  params: Promise<{ academicianId: string }>;
}) {
  const { academicianId } = await params;
  return (
    <OfficeHoursProfileView academicianId={decodeURIComponent(academicianId)} />
  );
}
