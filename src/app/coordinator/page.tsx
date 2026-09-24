import { redirect } from "next/navigation";

// The coordinator home (01.1) lands in its own PR; until then the programs are home.
export default function CoordinatorHomePage() {
  redirect("/coordinator/programs");
}
