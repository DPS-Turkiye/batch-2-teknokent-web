import { Edition } from "@/interfaces/edition";
import { UserAccountStatus, UserRole } from "@/interfaces/session";
import { offersUserDeletion } from "@/lib/edition-screens";
import { hasPermission } from "@/lib/permissions";

/** The account an admin may be offered to delete, as both the profile page and the users drawer know it. */
export type DeletablePerson = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserAccountStatus | undefined;
};

type DeletionViewer = {
  userId: string;
  role: UserRole;
  permissions?: readonly UserRole[] | undefined;
  edition?: Edition | undefined;
};

/**
 * Whether the viewer is offered deleting an account. The backend refuses the same cases; this only keeps a button
 * that can never work off the screen. A session without an edition reads as Teknokent, as in `useEdition`.
 */
export function canOfferDeletion(
  person: Pick<DeletablePerson, "id" | "role" | "status">,
  viewer: DeletionViewer | null,
) {
  return (
    viewer !== null &&
    hasPermission(viewer, UserRole.Admin) &&
    offersUserDeletion(viewer.edition ?? Edition.Teknokent) &&
    person.id !== viewer.userId &&
    person.role !== UserRole.Admin &&
    person.status !== UserAccountStatus.Deleted
  );
}

/** The typed confirmation counts when it is the account's address, whatever its case or surrounding spaces. */
export function confirmsDeletion(typed: string, email: string) {
  const entered = typed.trim().toLowerCase();
  return entered.length > 0 && entered === email.trim().toLowerCase();
}
