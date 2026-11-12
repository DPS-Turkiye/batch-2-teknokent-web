import { Edition } from "@/interfaces/edition";
import { ProgramType } from "@/interfaces/program";
import { SignupRole } from "@/interfaces/signup";
import { UserTab } from "@/types/admin-users";
import { LoginOption } from "@/types/edition-screens";

type EditionScreens = {
  loginOptions: readonly LoginOption[];
  signupRoles: readonly SignupRole[];
  programTypes: readonly ProgramType[];
  adminUserTabs: readonly UserTab[];
};

/**
 * What each edition's screens offer. The backend enforces the same split (program types, sign-up routes, closed
 * endpoints), so these lists only keep the other edition's choices out of sight; they must stay in step with
 * `Edition.java` on the backend.
 */
const SCREENS: Record<Edition, EditionScreens> = {
  [Edition.Teknokent]: {
    loginOptions: [
      LoginOption.Password,
      LoginOption.Otg,
      LoginOption.SignUp,
      LoginOption.Invite,
    ],
    signupRoles: [SignupRole.Founder, SignupRole.Mentor],
    programTypes: [ProgramType.StartupMentoring],
    adminUserTabs: [UserTab.Coordinators, UserTab.Mentors, UserTab.Teams],
  },
  [Edition.Odtu]: {
    // Password stays for ODTÜ's seeded admin and coordinator accounts; invite codes and OTG belong to Teknokent.
    loginOptions: [LoginOption.Password, LoginOption.Odtu, LoginOption.SignUp],
    // Students sign up through the founder flow into an individual (İŞKUR) program; there is no mentor sign-up.
    signupRoles: [SignupRole.Founder],
    programTypes: [ProgramType.PeerMentoring, ProgramType.OfficeHours],
    adminUserTabs: [UserTab.Coordinators, UserTab.Students, UserTab.Academics],
  },
};

/** The sign-in choices /login shows, in display order. */
export function loginOptionsOf(edition: Edition): readonly LoginOption[] {
  return SCREENS[edition].loginOptions;
}

export function offersLogin(edition: Edition, option: LoginOption) {
  return SCREENS[edition].loginOptions.includes(option);
}

/** The roles the sign-up role page offers, in display order. */
export function signupRolesOf(edition: Edition): readonly SignupRole[] {
  return SCREENS[edition].signupRoles;
}

/** The program types the program wizard offers; the backend refuses any other. */
export function programTypesOf(edition: Edition): readonly ProgramType[] {
  return SCREENS[edition].programTypes;
}

/** The tabs of the admin's Kullanıcılar screen, in display order. */
export function adminUserTabsOf(edition: Edition): readonly UserTab[] {
  return SCREENS[edition].adminUserTabs;
}
