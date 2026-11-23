import { notFound } from "next/navigation";

import { EmailsView } from "@/components/email-center/emails-view";
import { EMAIL_CENTER_ENABLED, EmailCenterPath } from "@/lib/email-center";

export default function CoordinatorEmailsPage() {
  if (!EMAIL_CENTER_ENABLED) notFound();
  return <EmailsView basePath={EmailCenterPath.Coordinator} />;
}
