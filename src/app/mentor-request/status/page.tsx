import { Suspense } from "react";

import { RequestStatusView } from "@/components/product-views";

export default function RequestStatusPage() {
  return (
    <Suspense>
      <RequestStatusView />
    </Suspense>
  );
}
