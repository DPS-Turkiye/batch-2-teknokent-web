"use client";

import { useParams } from "next/navigation";

import { OrganizationStartupDetail } from "@/components/organizations/organization-startup-detail";

export default function OrganizationStartupPage() {
  const params = useParams<{ id: string }>();
  return <OrganizationStartupDetail organizationId={params.id} />;
}
