import { connection } from "next/server";
import { Suspense } from "react";

import { SignupFlow } from "@/components/signup/signup-flow";
import { appEdition } from "@/lib/server/edition";

export default async function SignupPage() {
  // Read per request: a prerendered page would freeze the edition the build ran with.
  await connection();
  return (
    <Suspense>
      <SignupFlow edition={appEdition()} />
    </Suspense>
  );
}
