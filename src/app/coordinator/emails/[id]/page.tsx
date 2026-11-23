import { notFound } from "next/navigation";

import { EmailView } from "@/components/email-center/email-view";
import { EMAIL_CENTER_ENABLED, EmailCenterPath } from "@/lib/email-center";

export default async function CoordinatorEmailsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!EMAIL_CENTER_ENABLED) notFound();
  const { id } = await params;
  return <EmailView id={id} basePath={EmailCenterPath.Coordinator} />;
}
