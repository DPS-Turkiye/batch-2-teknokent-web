import { PeerMentorPublicProfile } from "@/components/student/peer-mentor-public-profile";

export default async function StudentPeerMentorPage({
  params,
}: {
  params: Promise<{ mentorId: string }>;
}) {
  const { mentorId } = await params;
  return <PeerMentorPublicProfile mentorId={mentorId} />;
}
