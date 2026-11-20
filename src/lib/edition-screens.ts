import { Edition } from "@/interfaces/edition";
import { ProgramType } from "@/interfaces/program";
import { SignupRole } from "@/interfaces/signup";
import { UserTab } from "@/types/admin-users";
import { LoginOption } from "@/types/edition-screens";

type EditionScreens = {
  loginOptions: readonly LoginOption[];
  signupRoles: readonly SignupRole[];
  /** Whether sign-up shows the "Ekip üyesiyim" card, which leads to /invite (Teknokent's team codes). */
  memberSignup: boolean;
  programTypes: readonly ProgramType[];
  adminUserTabs: readonly UserTab[];
  /** Whether an admin may delete a user; the backend closes the endpoint in the other edition. */
  userDeletion: boolean;
  /** Whether admins and coordinators may move a member to another team; the backend closes it in the other edition. */
  teamMove: boolean;
  /** Whether admins and coordinators may make another member a startup's founder; closed in the other edition. */
  founderChange: boolean;
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
    memberSignup: true,
    programTypes: [ProgramType.StartupMentoring],
    adminUserTabs: [UserTab.Coordinators, UserTab.Mentors, UserTab.Teams],
    userDeletion: true,
    teamMove: true,
    founderChange: true,
  },
  [Edition.Odtu]: {
    // Password stays for ODTÜ's seeded admin and coordinator accounts; invite codes and OTG belong to Teknokent.
    loginOptions: [LoginOption.Password, LoginOption.Odtu, LoginOption.SignUp],
    // Students sign up through the founder flow into an individual (İŞKUR) program; there is no mentor sign-up.
    signupRoles: [SignupRole.Founder],
    memberSignup: false,
    programTypes: [ProgramType.PeerMentoring, ProgramType.OfficeHours],
    adminUserTabs: [UserTab.Coordinators, UserTab.Students, UserTab.Academics],
    // Deferred: deleting an ODTÜ account would have to settle its roster and institution login first.
    userDeletion: false,
    // ODTÜ students sit in personal teams; moving between teams is a Teknokent startup concept.
    teamMove: false,
    founderChange: false,
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

export function offersMemberSignup(edition: Edition) {
  return SCREENS[edition].memberSignup;
}

/** The program types the program wizard offers; the backend refuses any other. */
export function programTypesOf(edition: Edition): readonly ProgramType[] {
  return SCREENS[edition].programTypes;
}

/** The tabs of the admin's Kullanıcılar screen, in display order. */
export function adminUserTabsOf(edition: Edition): readonly UserTab[] {
  return SCREENS[edition].adminUserTabs;
}

export function offersUserDeletion(edition: Edition) {
  return SCREENS[edition].userDeletion;
}

export function offersTeamMove(edition: Edition) {
  return SCREENS[edition].teamMove;
}

export function offersFounderChange(edition: Edition) {
  return SCREENS[edition].founderChange;
}
