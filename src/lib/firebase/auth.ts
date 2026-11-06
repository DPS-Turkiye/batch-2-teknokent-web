import { FirebaseError } from "firebase/app";
import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";

import { clientText, hasClientText } from "@/i18n/client-texts";
import { ClientApiError } from "@/lib/client/api";
import {
  requestPasswordResetEmail,
  requestVerificationEmail,
} from "@/lib/client/auth-email";
import { EMAIL_VERIFICATION_EXEMPT } from "@/lib/const";
import { firebaseAuth } from "@/lib/firebase/client";

const TOO_MANY_REQUESTS = 429;

/**
 * Our e-mail goes out from menton.com.tr, which university and Yahoo filters accept where they drop Firebase's
 * sender. Firebase's own e-mail stays the fallback for when ours cannot be sent.
 */
async function sendOwnEmailOrFirebase(
  ownEmail: () => Promise<void>,
  firebaseEmail: () => Promise<void>,
): Promise<void> {
  try {
    await ownEmail();
  } catch (error) {
    if (error instanceof ClientApiError && error.status === TOO_MANY_REQUESTS) {
      throw new Error(clientText("firebase.too-many-requests"));
    }
    await firebaseEmail();
  }
}

function sendVerification(user: User): Promise<void> {
  return sendOwnEmailOrFirebase(
    async () => requestVerificationEmail(await user.getIdToken()),
    () => sendEmailVerification(user),
  );
}

const EXEMPT_EMAILS = new Set<string>(EMAIL_VERIFICATION_EXEMPT);

export function isEmailVerificationExempt(
  email: string | null | undefined,
): boolean {
  return EXEMPT_EMAILS.has(email?.trim().toLowerCase() ?? "");
}

export function describeAuthError(error: unknown): string {
  if (error instanceof FirebaseError) {
    const key = `firebase.${error.code.replace(/^auth\//, "")}`;
    return hasClientText(key) ? clientText(key) : clientText("authFailed");
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return clientText("authFailed");
}

export async function createFirebaseAccount(
  email: string,
  password: string,
): Promise<string> {
  const credential = await createUserWithEmailAndPassword(
    firebaseAuth(),
    email.trim(),
    password,
  );
  if (!isEmailVerificationExempt(credential.user.email)) {
    await sendVerification(credential.user);
  }
  return credential.user.getIdToken();
}

export async function resendVerificationEmail(): Promise<void> {
  const user = firebaseAuth().currentUser;
  if (!user) {
    throw new Error(clientText("verifySignIn"));
  }
  await sendVerification(user);
}

export function isCurrentEmailVerified(): boolean {
  try {
    const user = firebaseAuth().currentUser;
    if (!user) return false;
    return user.emailVerified === true || isEmailVerificationExempt(user.email);
  } catch {
    return false;
  }
}

export async function reloadAndCheckEmailVerified(): Promise<boolean> {
  const user = firebaseAuth().currentUser;
  if (!user) return false;
  if (isEmailVerificationExempt(user.email)) return true;
  await user.reload();
  return user.emailVerified;
}

export async function signInToFirebase(
  email: string,
  password: string,
  rememberMe: boolean,
): Promise<string> {
  const auth = firebaseAuth();
  await setPersistence(
    auth,
    rememberMe ? browserLocalPersistence : browserSessionPersistence,
  );
  const credential = await signInWithEmailAndPassword(
    auth,
    email.trim(),
    password,
  );
  return credential.user.getIdToken();
}

export async function requestPasswordReset(email: string): Promise<void> {
  const address = email.trim();
  await sendOwnEmailOrFirebase(
    () => requestPasswordResetEmail(address),
    () => sendPasswordResetEmail(firebaseAuth(), address),
  );
}

export function currentUserEmail(): string | null {
  try {
    return firebaseAuth().currentUser?.email ?? null;
  } catch {
    return null;
  }
}

export async function currentFirebaseAccount(): Promise<{
  email: string;
  fullName: string;
  verified: boolean;
} | null> {
  try {
    const auth = firebaseAuth();
    await auth.authStateReady();
    const user = auth.currentUser;
    if (!user?.email) return null;
    return {
      email: user.email,
      fullName: user.displayName?.trim() ?? "",
      verified:
        user.emailVerified === true || isEmailVerificationExempt(user.email),
    };
  } catch {
    return null;
  }
}

export async function currentIdToken(): Promise<string | null> {
  const auth = firebaseAuth();
  // Right after a page load currentUser is null until Firebase restores the saved session.
  await auth.authStateReady();
  const user = auth.currentUser;
  return user ? user.getIdToken() : null;
}

export async function signOutOfFirebase(): Promise<void> {
  await signOut(firebaseAuth());
}
