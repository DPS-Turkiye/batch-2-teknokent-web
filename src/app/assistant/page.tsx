import { AppShell } from "@/components/app-shell";
import { MeetingAssistantWorkbench } from "@/components/meeting-assistant-workbench";

export default function AssistantPage() {
  return (
    <AppShell active="assistant">
      <MeetingAssistantWorkbench />
    </AppShell>
  );
}
