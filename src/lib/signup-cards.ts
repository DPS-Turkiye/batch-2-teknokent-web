import { Edition } from "@/interfaces/edition";
import { SignupRole } from "@/interfaces/signup";
import { signupRolesOf } from "@/lib/edition-screens";

/** Which card text the role page shows; its copy lives under `roleSelect.cards.<value>`. */
export enum SignupCardCopy {
  Founder = "founder",
  Mentor = "mentor",
  /** ODTÜ's founder flow: an İŞKUR student joining an individual program, with no startup. */
  Student = "student",
}

export type SignupCard = { role: SignupRole; copy: SignupCardCopy };

const ROLE_COPY: Record<SignupRole, SignupCardCopy> = {
  [SignupRole.Founder]: SignupCardCopy.Founder,
  [SignupRole.Mentor]: SignupCardCopy.Mentor,
};

/** The role cards of the edition's sign-up page, in display order. */
export function signupCards(edition: Edition): SignupCard[] {
  return signupRolesOf(edition).map((role) => ({
    role,
    copy:
      edition === Edition.Odtu && role === SignupRole.Founder
        ? SignupCardCopy.Student
        : ROLE_COPY[role],
  }));
}
