import { Suspense } from "react";

import { PeerMentoringView } from "@/components/student/peer-mentoring-view";

// The Al | Ver switch reads the URL, so the view renders under Suspense.
export default function StudentPeerMentoringPage() {
  return (
    <Suspense>
      <PeerMentoringView />
    </Suspense>
  );
}
