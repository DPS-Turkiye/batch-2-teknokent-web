import { Edition } from "@/interfaces/edition";
import { SignupRole } from "@/interfaces/signup";
import { offersMemberSignup, signupRolesOf } from "@/lib/edition-screens";
import { INVITE_PATH } from "@/lib/invite-intent";

/** Which card text the role page shows; its copy lives under `roleSelect.cards.<value>`. */
export enum SignupCardCopy {
  Founder = "founder",
  Mentor = "mentor",
  /** ODTÜ's founder flow: an İŞKUR student joining an individual program, with no startup. */
  Student = "student",
  /** A teammate with their founder's code: not a role of the wizard, so the card links to /invite. */
  Member = "member",
}

/** A card either starts the wizard as `role` or, for a teammate with a code, links to `href`. */
export type SignupCard =
  | {
      copy: Exclude<SignupCardCopy, SignupCardCopy.Member>;
      role: SignupRole;
      href: null;
    }
  | { copy: SignupCardCopy.Member; role: null; href: string };

const ROLE_COPY: Record<
  SignupRole,
  Exclude<SignupCardCopy, SignupCardCopy.Member>
> = {
  [SignupRole.Founder]: SignupCardCopy.Founder,
  [SignupRole.Mentor]: SignupCardCopy.Mentor,
};

/** The role cards of the edition's sign-up page, in display order. */
export function signupCards(edition: Edition): SignupCard[] {
  const roles: SignupCard[] = signupRolesOf(edition).map((role) => ({
    role,
    href: null,
    copy:
      edition === Edition.Odtu && role === SignupRole.Founder
        ? SignupCardCopy.Student
        : ROLE_COPY[role],
  }));
  return offersMemberSignup(edition)
    ? [...roles, { copy: SignupCardCopy.Member, role: null, href: INVITE_PATH }]
    : roles;
}

/** The small "Davet kodun mu var?" link under the cards, for an edition without the team member card. */
export function showsCodeLink(cards: readonly SignupCard[], invite: boolean) {
  return invite && !cards.some((card) => card.copy === SignupCardCopy.Member);
}
