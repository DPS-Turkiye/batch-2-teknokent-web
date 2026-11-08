import { redirect } from "next/navigation";

/** Programs are created by the admin now; an old link lands on Programlarım. */
export default function CoordinatorNewProgramPage() {
  redirect("/coordinator/programs");
}
