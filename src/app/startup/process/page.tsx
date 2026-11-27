import { StartupProcessView } from "@/components/startup/startup-process-view";

export default async function StartupProcessPage({
  searchParams,
}: {
  searchParams: Promise<{ assignment?: string | string[] }>;
}) {
  const { assignment } = await searchParams;
  return (
    <StartupProcessView
      focusAssignmentId={typeof assignment === "string" ? assignment : null}
    />
  );
}
