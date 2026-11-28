import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  SessionProvider,
  useAppSession,
  useSession,
} from "@/components/providers/session-provider";
import { UserRole } from "@/interfaces/session";
import { reloadPage } from "@/lib/assign-location";
import { backendHttp, endBackendSession } from "@/lib/client/backend-http";
import {
  onFirebaseAccountChange,
  signOutOfFirebase,
} from "@/lib/firebase/auth";
import { SIGNED_IN_HINT_COOKIE } from "@/lib/session-hint";
import {
  markSignedIn,
  SIGNED_IN_KEY,
  SIGNED_OUT_KEY,
} from "@/lib/session-signals";
import { backendUser } from "@test/fixtures/session";

vi.mock("@/lib/client/backend-http", async () =>
  (await import("@test/mocks/backend-http")).backendHttpMock(),
);
vi.mock("@/lib/firebase/auth", () => ({
  currentIdToken: vi.fn(() => Promise.resolve(null)),
  signOutOfFirebase: vi.fn(() => Promise.resolve()),
  onFirebaseAccountChange: vi.fn((_onChange: () => void) => () => undefined),
}));
vi.mock("@/lib/assign-location", () => ({ reloadPage: vi.fn() }));

const navigation = vi.hoisted(() => ({
  pathname: "/dashboard",
  replace: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({ replace: navigation.replace }),
}));

beforeEach(() => {
  navigation.pathname = "/dashboard";
  navigation.replace.mockClear();
  vi.mocked(backendHttp.get).mockReset();
  vi.mocked(reloadPage).mockClear();
  vi.mocked(signOutOfFirebase).mockClear();
});

afterEach(() => {
  markSignedIn();
  localStorage.clear();
});

/** Another tab writing `key` to the shared storage, as this tab's `storage` event reports it. */
function anotherTabWrites(key: string, value: string) {
  localStorage.setItem(key, value);
  act(() => {
    window.dispatchEvent(new StorageEvent("storage", { key, newValue: value }));
  });
}

function answerSessionOf(fullName: string, id: string) {
  vi.mocked(backendHttp.get).mockResolvedValue({
    status: 200,
    data: backendUser({ id, fullName }),
  });
}

function SessionLabel() {
  const session = useAppSession();
  return <p>{session ? session.fullName : "no session"}</p>;
}

function renderSession(queryClient: QueryClient) {
  return render(
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <SessionLabel />
      </SessionProvider>
    </QueryClientProvider>,
  );
}

describe("SessionProvider on a page that needs a session", () => {
  // Reported: a page left open after the session ended kept rendering, with
  // the user shown as "Kullanıcı".
  it("sends a signed-out visitor to login and shows nothing meanwhile", async () => {
    vi.mocked(backendHttp.get).mockResolvedValue({ status: 401 });
    renderSession(new QueryClient());

    await waitFor(() =>
      expect(navigation.replace).toHaveBeenCalledWith(
        "/login?next=%2Fdashboard",
      ),
    );
    expect(screen.queryByText("no session")).not.toBeInTheDocument();
  });

  it("leaves public pages alone", async () => {
    navigation.pathname = "/login";
    vi.mocked(backendHttp.get).mockResolvedValue({ status: 401 });
    renderSession(new QueryClient());

    expect(await screen.findByText("no session")).toBeInTheDocument();
    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it("does not sign someone out over a failed check", async () => {
    vi.mocked(backendHttp.get).mockResolvedValue({ status: 503 });
    renderSession(
      new QueryClient({ defaultOptions: { queries: { retry: false } } }),
    );

    expect(await screen.findByText("no session")).toBeInTheDocument();
    await waitFor(() => expect(backendHttp.get).toHaveBeenCalled());
    expect(navigation.replace).not.toHaveBeenCalled();
  });
});

describe("SessionProvider cross-tab freshness", () => {
  it("re-fetches the session on every mount instead of serving a stale cached identity", async () => {
    const queryClient = new QueryClient();
    vi.mocked(backendHttp.get).mockResolvedValueOnce({
      status: 200,
      data: backendUser({ fullName: "Leyla Aksoy" }),
    });

    const first = renderSession(queryClient);
    await waitFor(() =>
      expect(screen.getByText("Leyla Aksoy")).toBeInTheDocument(),
    );
    first.unmount();

    vi.mocked(backendHttp.get).mockResolvedValueOnce({
      status: 200,
      data: backendUser({ fullName: "Ayşe Kaya" }),
    });

    renderSession(queryClient);
    await waitFor(() =>
      expect(screen.getByText("Ayşe Kaya")).toBeInTheDocument(),
    );

    expect(backendHttp.get).toHaveBeenCalledTimes(2);
  });
});

describe("SessionProvider signing out", () => {
  function SignOut() {
    const { logout } = useSession();
    return (
      <button type="button" onClick={() => void logout()}>
        Çıkış
      </button>
    );
  }

  it("ends the API's session cookie, the proxy's hint and the Firebase sign-in", async () => {
    vi.mocked(backendHttp.get).mockResolvedValue({ status: 401 });
    document.cookie = `${SIGNED_IN_HINT_COOKIE}=${UserRole.Mentee}; path=/`;
    render(
      <QueryClientProvider client={new QueryClient()}>
        <SessionProvider>
          <SignOut />
        </SessionProvider>
      </QueryClientProvider>,
    );

    screen.getByRole("button", { name: "Çıkış" }).click();

    await waitFor(() => expect(signOutOfFirebase).toHaveBeenCalled());
    expect(endBackendSession).toHaveBeenCalled();
    expect(document.cookie).not.toContain(SIGNED_IN_HINT_COOKIE);
  });
});

describe("SessionProvider and the other tabs", () => {
  it("signs this tab out when another one signs the browser out", async () => {
    answerSessionOf("Leyla Aksoy", "user-1");
    const queryClient = new QueryClient();
    queryClient.setQueryData(["meetings"], ["Leyla's meeting"]);
    renderSession(queryClient);
    expect(await screen.findByText("Leyla Aksoy")).toBeInTheDocument();

    anotherTabWrites(SIGNED_OUT_KEY, String(Date.now()));

    await waitFor(() =>
      expect(navigation.replace).toHaveBeenCalledWith(
        "/login?next=%2Fdashboard",
      ),
    );
    // Its own Firebase login (kept per tab without "beni hatırla") would otherwise start a session again.
    expect(signOutOfFirebase).toHaveBeenCalled();
    expect(queryClient.getQueryData(["meetings"])).toBeUndefined();
  });

  it("reloads with nothing cached when another tab signed in as someone else", async () => {
    answerSessionOf("Leyla Aksoy", "user-1");
    const queryClient = new QueryClient();
    renderSession(queryClient);
    expect(await screen.findByText("Leyla Aksoy")).toBeInTheDocument();
    queryClient.setQueryData(["meetings"], ["Leyla's meeting"]);

    answerSessionOf("Ayşe Kaya", "user-2");
    anotherTabWrites(SIGNED_IN_KEY, String(Date.now()));

    await waitFor(() => expect(reloadPage).toHaveBeenCalled());
    expect(queryClient.getQueryData(["meetings"])).toBeUndefined();
  });

  it("keeps the page when the other tab signed in as the same person", async () => {
    answerSessionOf("Leyla Aksoy", "user-1");
    renderSession(new QueryClient());
    expect(await screen.findByText("Leyla Aksoy")).toBeInTheDocument();

    anotherTabWrites(SIGNED_IN_KEY, String(Date.now()));

    await waitFor(() => expect(backendHttp.get).toHaveBeenCalledTimes(2));
    expect(reloadPage).not.toHaveBeenCalled();
  });

  it("re-reads the session when another account takes over the tab's Firebase login", async () => {
    let onChange = () => {};
    vi.mocked(onFirebaseAccountChange).mockImplementationOnce((callback) => {
      onChange = callback;
      return () => undefined;
    });
    answerSessionOf("Leyla Aksoy", "user-1");
    renderSession(new QueryClient());
    expect(await screen.findByText("Leyla Aksoy")).toBeInTheDocument();

    answerSessionOf("Ayşe Kaya", "user-2");
    act(() => onChange());

    await waitFor(() => expect(reloadPage).toHaveBeenCalled());
  });
});
