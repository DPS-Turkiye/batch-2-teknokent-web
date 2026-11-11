import {
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { requestVerificationEmail } from "@/lib/client/auth-email";
import {
  createFirebaseAccount,
  currentFirebaseAccount,
  currentUserEmail,
  isCurrentEmailVerified,
  reloadAndCheckEmailVerified,
  resendVerificationEmail,
  signInToFirebase,
  signInWithInstitutionToken,
  signOutOfFirebase,
} from "@/lib/firebase/auth";

type FakeUser = {
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  getIdToken: (forceRefresh?: boolean) => Promise<string>;
  reload: () => Promise<void>;
};

const firebase = vi.hoisted(() => ({
  createUserWithEmailAndPassword: vi.fn(),
  sendEmailVerification: vi.fn(),
  setPersistence: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signInWithCustomToken: vi.fn(),
  signOut: vi.fn(),
}));
const auth = vi.hoisted(() => ({
  currentUser: null as FakeUser | null,
  authStateReady: async () => {},
}));
const clientModule = vi.hoisted(() => ({
  firebaseAuth: vi.fn(() => auth),
}));

vi.mock("firebase/auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("firebase/auth")>()),
  ...firebase,
}));
vi.mock("@/lib/firebase/client", () => clientModule);
vi.mock("@/lib/client/auth-email", () => ({
  requestPasswordResetEmail: vi.fn(),
  requestVerificationEmail: vi.fn(),
}));

function user(overrides: Partial<FakeUser> = {}): FakeUser {
  return {
    email: "ada@acme.test",
    displayName: "  Ada Kaya ",
    emailVerified: false,
    getIdToken: vi.fn(async () => "id-token"),
    reload: vi.fn(async () => {}),
    ...overrides,
  };
}

function firebaseNotConfigured() {
  clientModule.firebaseAuth.mockImplementation(() => {
    throw new Error("Firebase bağlantı ayarları yapılandırılmalıdır.");
  });
}

describe("Firebase session helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clientModule.firebaseAuth.mockImplementation(() => auth);
    auth.currentUser = null;
    auth.authStateReady = async () => {};
  });

  describe("createFirebaseAccount", () => {
    it("trims the e-mail and answers the new account's ID token", async () => {
      firebase.createUserWithEmailAndPassword.mockResolvedValue({
        user: user(),
      });

      await expect(
        createFirebaseAccount("  ada@acme.test ", "secret-123"),
      ).resolves.toBe("id-token");

      expect(firebase.createUserWithEmailAndPassword).toHaveBeenCalledWith(
        auth,
        "ada@acme.test",
        "secret-123",
      );
    });

    it("sends no verification e-mail to an exempt staff inbox", async () => {
      firebase.createUserWithEmailAndPassword.mockResolvedValue({
        user: user({ email: "admin@teknokent.demo" }),
      });

      await createFirebaseAccount("admin@teknokent.demo", "secret-123");

      expect(requestVerificationEmail).not.toHaveBeenCalled();
      expect(firebase.sendEmailVerification).not.toHaveBeenCalled();
    });
  });

  it("resendVerificationEmail asks to sign in when nobody is signed in", async () => {
    await expect(resendVerificationEmail()).rejects.toThrow(
      "Doğrulama maili için önce giriş yapın.",
    );

    expect(requestVerificationEmail).not.toHaveBeenCalled();
  });

  describe("isCurrentEmailVerified", () => {
    it("is false when nobody is signed in", () => {
      expect(isCurrentEmailVerified()).toBe(false);
    });

    it("is true for a verified address", () => {
      auth.currentUser = user({ emailVerified: true });

      expect(isCurrentEmailVerified()).toBe(true);
    });

    it("is true for an unverified but exempt staff inbox", () => {
      auth.currentUser = user({ email: "Coordinator@Teknokent.demo " });

      expect(isCurrentEmailVerified()).toBe(true);
    });

    it("is false for an unverified ordinary address", () => {
      auth.currentUser = user();

      expect(isCurrentEmailVerified()).toBe(false);
    });

    it("is false instead of throwing when Firebase is not configured", () => {
      firebaseNotConfigured();

      expect(isCurrentEmailVerified()).toBe(false);
    });
  });

  describe("reloadAndCheckEmailVerified", () => {
    it("is false without reloading when nobody is signed in", async () => {
      await expect(reloadAndCheckEmailVerified()).resolves.toBe(false);
    });

    it("trusts an exempt staff inbox without reloading it", async () => {
      const staff = user({ email: "admin@teknokent.demo" });
      auth.currentUser = staff;

      await expect(reloadAndCheckEmailVerified()).resolves.toBe(true);
      expect(staff.reload).not.toHaveBeenCalled();
    });
  });

  describe("signInToFirebase", () => {
    beforeEach(() => {
      firebase.signInWithEmailAndPassword.mockResolvedValue({ user: user() });
    });

    it("keeps a remembered sign-in across browser restarts", async () => {
      await expect(
        signInToFirebase(" ada@acme.test ", "secret-123", true),
      ).resolves.toBe("id-token");

      expect(firebase.setPersistence).toHaveBeenCalledWith(
        auth,
        browserLocalPersistence,
      );
      expect(firebase.signInWithEmailAndPassword).toHaveBeenCalledWith(
        auth,
        "ada@acme.test",
        "secret-123",
      );
    });

    it("keeps an unremembered sign-in only for the browser session", async () => {
      await signInToFirebase("ada@acme.test", "secret-123", false);

      expect(firebase.setPersistence).toHaveBeenCalledWith(
        auth,
        browserSessionPersistence,
      );
    });

    it("sets the persistence before signing in", async () => {
      await signInToFirebase("ada@acme.test", "secret-123", true);

      const [persistenceOrder] =
        firebase.setPersistence.mock.invocationCallOrder;
      const [signInOrder] =
        firebase.signInWithEmailAndPassword.mock.invocationCallOrder;
      expect(persistenceOrder).toBeLessThan(signInOrder ?? 0);
    });
  });

  it("signInWithInstitutionToken signs in with the backend's custom token", async () => {
    firebase.signInWithCustomToken.mockResolvedValue({ user: user() });

    await expect(signInWithInstitutionToken("custom-token")).resolves.toBe(
      "id-token",
    );
    expect(firebase.signInWithCustomToken).toHaveBeenCalledWith(
      auth,
      "custom-token",
    );
  });

  describe("currentUserEmail", () => {
    it("answers the signed-in user's address", () => {
      auth.currentUser = user();

      expect(currentUserEmail()).toBe("ada@acme.test");
    });

    it("is null when nobody is signed in", () => {
      expect(currentUserEmail()).toBeNull();
    });

    it("is null instead of throwing when Firebase is not configured", () => {
      firebaseNotConfigured();

      expect(currentUserEmail()).toBeNull();
    });
  });

  describe("currentFirebaseAccount", () => {
    it("waits for the restored session and answers the trimmed name", async () => {
      auth.authStateReady = async () => {
        auth.currentUser = user({ emailVerified: true });
      };

      await expect(currentFirebaseAccount()).resolves.toEqual({
        email: "ada@acme.test",
        fullName: "Ada Kaya",
        verified: true,
      });
    });

    it("answers an empty name and counts an exempt inbox as verified", async () => {
      auth.currentUser = user({
        email: "admin@teknokent.demo",
        displayName: null,
      });

      await expect(currentFirebaseAccount()).resolves.toEqual({
        email: "admin@teknokent.demo",
        fullName: "",
        verified: true,
      });
    });

    it("is null for an account with no e-mail", async () => {
      auth.currentUser = user({ email: null });

      await expect(currentFirebaseAccount()).resolves.toBeNull();
    });

    it("is null instead of rejecting when Firebase is not configured", async () => {
      firebaseNotConfigured();

      await expect(currentFirebaseAccount()).resolves.toBeNull();
    });
  });

  it("signOutOfFirebase signs the current auth out", async () => {
    await signOutOfFirebase();

    expect(firebase.signOut).toHaveBeenCalledWith(auth);
  });
});
