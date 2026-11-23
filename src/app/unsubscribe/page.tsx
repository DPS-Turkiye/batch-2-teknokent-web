import { UnsubscribeView } from "@/components/email-center/unsubscribe-view";

/** The link at the bottom of every email-center mail; it works with the center switched off too. */
export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { t } = await searchParams;
  return <UnsubscribeView token={typeof t === "string" ? t : null} />;
}
