import { notFound } from "next/navigation";
import { Suspense } from "react";

import { OtgStartView } from "@/components/login/otg-start-view";
import { isOtgLoginEnabled } from "@/lib/otg-login";

export default function OtgStartPage() {
  if (!isOtgLoginEnabled()) notFound();
  return (
    <Suspense>
      <OtgStartView />
    </Suspense>
  );
}
