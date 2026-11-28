"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { useProfileRedirect } from "@/hooks/use-individual-program";
import { PREFER_WEB_PARAM } from "@/lib/mobile";

function ProfileRedirect() {
  useProfileRedirect(useSearchParams().get(PREFER_WEB_PARAM) === "1");
  return null;
}

export default function ProfilePage() {
  return (
    <Suspense>
      <ProfileRedirect />
    </Suspense>
  );
}
