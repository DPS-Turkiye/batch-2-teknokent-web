import { MeetingReportScreen } from "@/components/student/reports/meeting-report-form";

export default async function PeerMeetingReportPage({
  params,
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = await params;
  return <MeetingReportScreen meetingId={meetingId} />;
}
