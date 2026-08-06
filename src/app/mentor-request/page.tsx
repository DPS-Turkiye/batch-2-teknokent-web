import { Suspense } from "react";

import { MentorRequestFlow } from "@/components/mentor-request-flow";

export default function MentorRequestPage() {
  return (
    <Suspense>
      <MentorRequestFlow />
    </Suspense>
  );
}
