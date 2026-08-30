import { FirebaseError } from "firebase/app";
import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import { firebaseAuth } from "@/lib/firebase/client";

const ERROR_MESSAGES: Record<string, string> = {
  "auth/email-already-in-use": "An account already exists with this email.",
  "auth/invalid-email": "The email address is invalid.",
  "auth/weak-password": "The password is too weak. Choose a longer password.",
  "auth/invalid-credential": "Incorrect email or password.",
  "auth/user-not-found": "Incorrect email or password.",
  "auth/wrong-password": "Incorrect email or password.",
  "auth/too-many-requests": "Too many attempts. Wait a bit and try again.",
  "auth/network-request-failed": "Could not connect. Try again.",
};

export function describeAuthError(error: unknown): string {
  if (error instanceof FirebaseError) {
    return (
      ERROR_MESSAGES[error.code] ?? "Authentication could not be completed."
    );
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Authentication could not be completed.";
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
  return credential.user.getIdToken();
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

export async function currentIdToken(): Promise<string | null> {
  const user = firebaseAuth().currentUser;
  return user ? user.getIdToken() : null;
}

export async function signOutOfFirebase(): Promise<void> {
  await signOut(firebaseAuth());
}
