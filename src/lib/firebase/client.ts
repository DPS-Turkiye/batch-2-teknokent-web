import {
  getApp,
  getApps,
  initializeApp,
  type FirebaseApp,
  type FirebaseOptions,
} from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

const APP_NAME = "metual-auth";

function firebaseOptions(): FirebaseOptions {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!apiKey || !authDomain || !projectId) {
    throw new Error("Firebase bağlantı ayarları yapılandırılmalıdır.");
  }

  const options: FirebaseOptions = { apiKey, authDomain, projectId };
  // The optional settings are left out when unset rather than passed as undefined.
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
  const messagingSenderId =
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (appId !== undefined) options.appId = appId;
  if (messagingSenderId !== undefined) {
    options.messagingSenderId = messagingSenderId;
  }
  if (storageBucket !== undefined) options.storageBucket = storageBucket;
  return options;
}

export function firebaseApp(): FirebaseApp {
  return getApps().some((candidate) => candidate.name === APP_NAME)
    ? getApp(APP_NAME)
    : initializeApp(firebaseOptions(), APP_NAME);
}

export function firebaseAuth(): Auth {
  return getAuth(firebaseApp());
}

export function isFirebaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  );
}
