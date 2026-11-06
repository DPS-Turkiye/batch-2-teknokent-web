import { beforeEach, describe, expect, it, vi } from "vitest";

import { ClientApiError } from "@/lib/client/api";
import {
  requestPasswordResetEmail,
  requestVerificationEmail,
} from "@/lib/client/auth-email";
import {
  createFirebaseAccount,
  requestPasswordReset,
  resendVerificationEmail,
} from "@/lib/firebase/auth";

const firebase = vi.hoisted(() => ({
  createUserWithEmailAndPassword: vi.fn(),
  sendEmailVerification: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
}));
const auth = vi.hoisted(() => ({ currentUser: null as unknown }));

vi.mock("firebase/auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("firebase/auth")>()),
  ...firebase,
}));
vi.mock("@/lib/firebase/client", () => ({ firebaseAuth: () => auth }));
vi.mock("@/lib/client/auth-email", () => ({
  requestPasswordResetEmail: vi.fn(),
  requestVerificationEmail: vi.fn(),
}));

const mentor = {
  email: "mentor@bilkent.edu.tr",
  getIdToken: async () => "token-1",
};

describe("sign-in e-mails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.currentUser = mentor;
    firebase.createUserWithEmailAndPassword.mockResolvedValue({ user: mentor });
  });

  it("sends the sign-up verification through our own sender, not Firebase's", async () => {
    await createFirebaseAccount("mentor@bilkent.edu.tr", "secret-123");

    expect(requestVerificationEmail).toHaveBeenCalledWith("token-1");
    expect(firebase.sendEmailVerification).not.toHaveBeenCalled();
  });

  it("falls back to Firebase's e-mail when ours cannot be sent", async () => {
    vi.mocked(requestVerificationEmail).mockRejectedValue(
      new ClientApiError("unavailable", 503),
    );

    await resendVerificationEmail();

    expect(firebase.sendEmailVerification).toHaveBeenCalledWith(mentor);
  });

  it("asks to wait, without a second e-mail, when too many were sent", async () => {
    vi.mocked(requestVerificationEmail).mockRejectedValue(
      new ClientApiError("slow down", 429),
    );

    await expect(resendVerificationEmail()).rejects.toThrow(
      "Çok fazla deneme yapıldı. Biraz bekleyip tekrar deneyin.",
    );
    expect(firebase.sendEmailVerification).not.toHaveBeenCalled();
  });

  it("sends a password reset through our own sender", async () => {
    await requestPasswordReset("  mentor@metu.edu.tr ");

    expect(requestPasswordResetEmail).toHaveBeenCalledWith(
      "mentor@metu.edu.tr",
    );
    expect(firebase.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("falls back to Firebase's reset e-mail when ours fails", async () => {
    vi.mocked(requestPasswordResetEmail).mockRejectedValue(
      new Error("network"),
    );

    await requestPasswordReset("mentor@metu.edu.tr");

    expect(firebase.sendPasswordResetEmail).toHaveBeenCalledWith(
      auth,
      "mentor@metu.edu.tr",
    );
  });
});
