import { StudentProfileView } from "@/components/academician/student-profile-view";
import { isEnumValue } from "@/lib/enum";
import { StudentProfileOrigin } from "@/types/academician-office-hours";

/** `?from=` only picks the back link, so anything else falls back to Randevularım. */
export default async function AcademicianStudentPage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ from?: string | string[] }>;
}) {
  const { userId } = await params;
  const { from } = await searchParams;
  const origin = isEnumValue(StudentProfileOrigin, from)
    ? from
    : StudentProfileOrigin.Appointments;
  return (
    <StudentProfileView userId={decodeURIComponent(userId)} from={origin} />
  );
}
