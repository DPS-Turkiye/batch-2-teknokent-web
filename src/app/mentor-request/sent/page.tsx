import { Suspense } from "react";

import { RequestSentView } from "@/components/product-views";

export default function RequestSentPage() {
  return (
    <Suspense>
      <RequestSentView />
    </Suspense>
  );
}
