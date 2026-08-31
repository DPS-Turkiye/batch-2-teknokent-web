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
  "auth/email-already-in-use":
    "Bu e-posta adresiyle kayıtlı bir hesap zaten var.",
  "auth/invalid-email": "E-posta adresi geçersiz.",
  "auth/weak-password": "Şifre çok zayıf. Daha uzun bir şifre seçin.",
  "auth/invalid-credential": "E-posta veya şifre hatalı.",
  "auth/user-not-found": "E-posta veya şifre hatalı.",
  "auth/wrong-password": "E-posta veya şifre hatalı.",
  "auth/too-many-requests":
    "Çok fazla deneme yapıldı. Biraz bekleyip tekrar deneyin.",
  "auth/network-request-failed": "Bağlantı kurulamadı. Tekrar deneyin.",
};

export function describeAuthError(error: unknown): string {
  if (error instanceof FirebaseError) {
    return ERROR_MESSAGES[error.code] ?? "Kimlik doğrulama tamamlanamadı.";
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
