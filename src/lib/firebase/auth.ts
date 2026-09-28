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
} from "firebase/auth";

import {
  EMAIL_VERIFICATION_EXEMPT,
  FIREBASE_AUTH_ERROR_MESSAGES,
} from "@/lib/const";
import { firebaseAuth } from "@/lib/firebase/client";

const EXEMPT_EMAILS = new Set<string>(EMAIL_VERIFICATION_EXEMPT);

export function isEmailVerificationExempt(
  email: string | null | undefined,
): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    EXEMPT_EMAILS.has(email?.trim().toLowerCase() ?? "")
  );
}

export function describeAuthError(error: unknown): string {
  if (error instanceof FirebaseError) {
    return (
      FIREBASE_AUTH_ERROR_MESSAGES[error.code] ??
      "Kimlik doğrulama tamamlanamadı."
    );
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Kimlik doğrulama tamamlanamadı.";
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
    await sendEmailVerification(credential.user);
  }
  return credential.user.getIdToken();
}

export async function resendVerificationEmail(): Promise<void> {
  const user = firebaseAuth().currentUser;
  if (!user) {
    throw new Error("Doğrulama maili için önce giriş yapın.");
  }
  await sendEmailVerification(user);
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
  if (user.emailVerified) await user.getIdToken(true);
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
  await sendPasswordResetEmail(firebaseAuth(), email.trim());
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
  const user = firebaseAuth().currentUser;
  return user ? user.getIdToken() : null;
}

export async function signOutOfFirebase(): Promise<void> {
  await signOut(firebaseAuth());
}
