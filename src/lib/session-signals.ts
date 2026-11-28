/**
 * What one tab tells the others about signing in and out, through localStorage (shared by every tab of the
 * origin; its `storage` event reaches the other tabs only).
 *
 * The signed-out mark is set when this browser signs out and stays until the next sign-in. While it is set no
 * tab starts an API session on its own from a Firebase login it still holds: without "beni hatırla" Firebase keeps
 * its login per tab, so signing out in one tab leaves the others' logins behind, and one of them answering a 401
 * by starting a session would sign the whole browser back in.
 */
export const SIGNED_OUT_KEY = "menton_signed_out";
/** Rewritten on every sign-in, so the other tabs re-read whose session the shared API cookie now is. */
export const SIGNED_IN_KEY = "menton_signed_in_at";

/** The mark for this tab when storage is blocked (private mode), so at least this tab never resumes. */
let signedOutHere = false;

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function write(key: string, value: string | null) {
  try {
    const store = storage();
    if (value === null) store?.removeItem(key);
    else store?.setItem(key, value);
  } catch {
    // Blocked storage: the in-memory mark still covers this tab.
  }
}

/** Marks the browser signed out. A timestamp, so signing out again still reaches the other tabs. */
export function markSignedOut() {
  signedOutHere = true;
  write(SIGNED_OUT_KEY, String(Date.now()));
}

/** A sign-in: lifts the signed-out mark and tells the other tabs the session may now be someone else's. */
export function markSignedIn() {
  signedOutHere = false;
  write(SIGNED_OUT_KEY, null);
  write(SIGNED_IN_KEY, String(Date.now()));
}

export function isMarkedSignedOut(): boolean {
  if (signedOutHere) return true;
  try {
    return storage()?.getItem(SIGNED_OUT_KEY) != null;
  } catch {
    return false;
  }
}

type SessionSignalHandlers = {
  /** Another tab signed this browser out. */
  onSignedOut: () => void;
  /** Another tab signed in, perhaps as someone else. */
  onSignedIn: () => void;
};

/** Listens for the other tabs' sign-ins and sign-outs; returns the unsubscribe. */
export function subscribeToSessionSignals({
  onSignedOut,
  onSignedIn,
}: SessionSignalHandlers): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.newValue === null) return;
    if (event.key === SIGNED_OUT_KEY) onSignedOut();
    else if (event.key === SIGNED_IN_KEY) onSignedIn();
  };
  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}
