import { onAuthStateChanged } from "firebase/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  currentFirebaseLogin,
  onFirebaseAccountChange,
} from "@/lib/firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";

type FakeUser = { uid: string; getIdToken: () => Promise<string> };

const auth = vi.hoisted(() => ({
  currentUser: null as FakeUser | null,
  authStateReady: async () => {},
}));

vi.mock("@/lib/firebase/client", () => ({ firebaseAuth: vi.fn(() => auth) }));
/** The login reports Firebase would make to whoever watches; only the uid is read. */
const observers = vi.hoisted(
  () => [] as ((user: { uid: string } | null) => void)[],
);
vi.mock("firebase/auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("firebase/auth")>()),
  onAuthStateChanged: vi.fn(
    (_auth: unknown, next: (user: { uid: string } | null) => void) => {
      observers.push(next);
      return () => undefined;
    },
  ),
}));

beforeEach(() => {
  auth.currentUser = null;
  vi.mocked(onAuthStateChanged).mockClear();
  observers.length = 0;
});

describe("currentFirebaseLogin", () => {
  it("gives the uid with a token of that same login", async () => {
    auth.currentUser = { uid: "uid-1", getIdToken: async () => "token-1" };

    await expect(currentFirebaseLogin()).resolves.toEqual({
      uid: "uid-1",
      idToken: "token-1",
    });
  });

  it("is null when nobody is signed in", async () => {
    await expect(currentFirebaseLogin()).resolves.toBeNull();
  });
});

describe("onFirebaseAccountChange", () => {
  function watch() {
    const onChange = vi.fn();
    onFirebaseAccountChange(onChange);
    const report = (uid: string | null) => {
      for (const observer of observers) observer(uid ? { uid } : null);
    };
    return { onChange, report };
  }

  it("calls back when one account's login is replaced by another's", () => {
    const { onChange, report } = watch();

    report("uid-1");
    report("uid-1");
    expect(onChange).not.toHaveBeenCalled();

    report("uid-2");
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("leaves signing in and signing out alone", () => {
    const { onChange, report } = watch();

    report(null);
    report("uid-1");
    report(null);
    report("uid-2");

    expect(onChange).not.toHaveBeenCalled();
  });

  it("watches nothing when Firebase is not configured", () => {
    vi.mocked(firebaseAuth).mockImplementationOnce(() => {
      throw new Error("not configured");
    });

    const stop = onFirebaseAccountChange(vi.fn());

    expect(onAuthStateChanged).not.toHaveBeenCalled();
    expect(stop).not.toThrow();
  });
});
