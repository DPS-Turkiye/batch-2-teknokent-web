import { Suspense } from "react";

import { MentorMessagesView } from "@/components/mentor-dashboard/mentor-messages-view";

export default function MentorMessagesPage() {
  return (
    <Suspense fallback={null}>
      <MentorMessagesView />
    </Suspense>
  );
}
