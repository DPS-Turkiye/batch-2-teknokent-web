import { Suspense } from "react";

import { MenteeMessagesView } from "@/components/mentee-messages-view";

export default function MenteeMessagesPage() {
  return (
    <Suspense fallback={null}>
      <MenteeMessagesView />
    </Suspense>
  );
}
