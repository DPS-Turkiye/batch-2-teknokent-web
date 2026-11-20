/** What the "Tehlikeli bölge" is deleting. */
export enum DeletionTarget {
  Account = "account",
  Startup = "startup",
}

/** The two confirmations, and the sign-in a deletion may ask for in between. */
export enum DeletionStep {
  /** First: what is erased and what stays, anonymized. */
  Explain = "explain",
  /** Second: type SİL, or the startup's name. */
  Confirm = "confirm",
  /** The sign-in is too old to delete with; the person signs in again first. */
  SignInAgain = "signInAgain",
}
