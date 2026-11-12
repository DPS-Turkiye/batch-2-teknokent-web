/** The ways into the app that /login can offer; each edition shows its own set. */
export enum LoginOption {
  /** E-mail and password: every account in Teknokent, and the seeded staff accounts in ODTÜ. */
  Password = "password",
  /** ODTÜ TEKNOKENT Girişimcilik (OTG) single sign-on. */
  Otg = "otg",
  /** ODTÜ's institutional login. */
  Odtu = "odtu",
  /** The self-service sign-up link. */
  SignUp = "signUp",
  /** Joining a team with an invite code. */
  Invite = "invite",
}
