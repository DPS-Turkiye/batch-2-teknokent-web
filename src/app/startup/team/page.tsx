import { StartupTeamView } from "@/components/startup/startup-team-view";
import { redirectIndividualMentee } from "@/lib/server/individual-program";

export default async function StartupTeamPage() {
  await redirectIndividualMentee();
  return <StartupTeamView />;
}
