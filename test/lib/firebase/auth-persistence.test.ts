import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({
  value: {},
  setPersistence: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  browserLocalPersistence: { kind: "local" },
  browserSessionPersistence: { kind: "session" },
}));

vi.mock("firebase/auth", () => ({
  browserLocalPersistence: auth.browserLocalPersistence,
  browserSessionPersistence: auth.browserSessionPersistence,
  createUserWithEmailAndPassword: vi.fn(),
  sendEmailVerification: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  setPersistence: auth.setPersistence,
  signInWithEmailAndPassword: auth.signInWithEmailAndPassword,
  signOut: vi.fn(),
}));

vi.mock("@/lib/firebase/client", () => ({
  firebaseAuth: () => auth.value,
}));

const { reloadAndCheckEmailVerified, signInToFirebase } =
  await import("@/lib/firebase/auth");

describe("signInToFirebase persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.signInWithEmailAndPassword.mockResolvedValue({
      user: { getIdToken: vi.fn().mockResolvedValue("token") },
    });
  });

  it("uses browser session persistence when Remember me is unchecked", async () => {
    await signInToFirebase("person@example.com", "secret", false);

    expect(auth.setPersistence).toHaveBeenCalledWith(
      auth.value,
      auth.browserSessionPersistence,
    );
    expect(auth.signInWithEmailAndPassword).toHaveBeenCalledWith(
      auth.value,
      "person@example.com",
      "secret",
    );
  });

  it("uses browser local persistence when Remember me is checked", async () => {
    await signInToFirebase("person@example.com", "secret", true);

    expect(auth.setPersistence).toHaveBeenCalledWith(
      auth.value,
      auth.browserLocalPersistence,
    );
  });

  it("refreshes the token after email verification", async () => {
    const user = {
      email: "person@example.com",
      emailVerified: false,
      getIdToken: vi.fn().mockResolvedValue("verified-token"),
      reload: vi.fn().mockImplementation(async () => {
        user.emailVerified = true;
      }),
    };
    auth.value = { currentUser: user };

    expect(await reloadAndCheckEmailVerified()).toBe(true);
    expect(user.getIdToken).toHaveBeenCalledWith(true);
  });
});
