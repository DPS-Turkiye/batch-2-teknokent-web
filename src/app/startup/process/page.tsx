import { StartupProcessView } from "@/components/startup/startup-process-view";
import { PROCESS_FOCUS_PARAM } from "@/lib/startup-process";

export default async function StartupProcessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const focus = (await searchParams)[PROCESS_FOCUS_PARAM];
  const focusAssignmentId = typeof focus === "string" ? focus : null;
  // A new link remounts Süreç so it opens on that Ödev, whatever was picked before.
  return (
    <StartupProcessView
      key={focusAssignmentId ?? ""}
      focusAssignmentId={focusAssignmentId}
    />
  );
}
