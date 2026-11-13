import { UserAccountStatus, UserRole } from "@/interfaces/session";

/**
 * Whether the admin looking at an account is offered its deletion. The backend refuses the same cases; this only
 * keeps a button that can never work off the screen.
 */
export function canOfferDeletion(
  person: { id: string; role: UserRole; status: UserAccountStatus },
  viewerId: string | null,
) {
  return (
    viewerId !== null &&
    person.id !== viewerId &&
    person.role !== UserRole.Admin &&
    person.status !== UserAccountStatus.Deleted
  );
}

/** The typed confirmation counts when it is the account's address, whatever its case or surrounding spaces. */
export function confirmsDeletion(typed: string, email: string) {
  const entered = typed.trim().toLowerCase();
  return entered.length > 0 && entered === email.trim().toLowerCase();
}
