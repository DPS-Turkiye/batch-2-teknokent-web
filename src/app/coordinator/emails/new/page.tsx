import { notFound } from "next/navigation";

import { NewEmailView } from "@/components/email-center/new-email-view";
import {
  EMAIL_CENTER_ENABLED,
  EmailCenterPath,
  startFromQuery,
  type EmailStartQuery,
} from "@/lib/email-center";

export default async function NewCoordinatorEmailsPage({
  searchParams,
}: {
  searchParams: Promise<EmailStartQuery>;
}) {
  if (!EMAIL_CENTER_ENABLED) notFound();
  return (
    <NewEmailView
      basePath={EmailCenterPath.Coordinator}
      {...startFromQuery(await searchParams)}
    />
  );
}
