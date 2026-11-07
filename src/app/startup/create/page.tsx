import { StartupCreateView } from "@/components/startup/startup-create-view";
import { redirectIndividualMentee } from "@/lib/server/individual-program";

export default async function StartupCreatePage() {
  await redirectIndividualMentee();
  return <StartupCreateView />;
}
