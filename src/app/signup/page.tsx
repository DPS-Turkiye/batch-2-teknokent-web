import { Suspense } from "react";

import { SignupFlow } from "@/components/signup/signup-flow";

export default function SignupPage() {
  return (
    <Suspense>
      <SignupFlow />
    </Suspense>
  );
}
