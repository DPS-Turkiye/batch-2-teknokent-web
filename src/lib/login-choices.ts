import type { Edition } from "@/interfaces/edition";
import { offersLogin } from "@/lib/edition-screens";
import { LoginOption } from "@/types/edition-screens";

export type LoginChoices = {
  /** ODTÜ's institutional login leads the page (the ODTÜ edition's own sign-in). */
  odtu: boolean;
  otg: boolean;
  signUp: boolean;
  invite: boolean;
};

/**
 * Which ways in /login shows. The ODTÜ button also needs a working institution login behind it: until ODTÜ's real
 * protocol is wired, that is the local dev persona login, so without it the page falls back to e-mail only.
 */
export function loginChoices(
  edition: Edition,
  odtuLoginReady: boolean,
): LoginChoices {
  return {
    odtu: odtuLoginReady && offersLogin(edition, LoginOption.Odtu),
    otg: offersLogin(edition, LoginOption.Otg),
    signUp: offersLogin(edition, LoginOption.SignUp),
    invite: offersLogin(edition, LoginOption.Invite),
  };
}
