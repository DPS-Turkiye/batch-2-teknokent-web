import { notFound } from "next/navigation";

import { EmailTemplatesView } from "@/components/email-center/email-templates-view";
import { EMAIL_CENTER_ENABLED, EmailCenterPath } from "@/lib/email-center";

export default function AdminEmailTemplatesPage() {
  if (!EMAIL_CENTER_ENABLED) notFound();
  return <EmailTemplatesView basePath={EmailCenterPath.Admin} />;
}
