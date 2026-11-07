import { StartupHome } from "@/components/startup/startup-start-view";
import { redirectIndividualMentee } from "@/lib/server/individual-program";

export default async function StartupProfilePage() {
  await redirectIndividualMentee();
  return <StartupHome />;
}
