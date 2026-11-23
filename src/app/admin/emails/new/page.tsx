import { notFound } from "next/navigation";

import { EmailComposeForm } from "@/components/email-center/email-compose-form";
import { EMAIL_CENTER_ENABLED, EmailCenterPath } from "@/lib/email-center";

export default function NewAdminEmailsPage() {
  if (!EMAIL_CENTER_ENABLED) notFound();
  return <EmailComposeForm detail={null} basePath={EmailCenterPath.Admin} />;
}
