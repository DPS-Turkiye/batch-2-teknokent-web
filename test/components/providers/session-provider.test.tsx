import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  SessionProvider,
  useAppSession,
} from "@/components/providers/session-provider";
import { httpClient } from "@/lib/http-client";

vi.mock("@/lib/http-client", () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

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
  vi.mocked(httpClient.get).mockReset();
});

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
    vi.mocked(httpClient.get).mockResolvedValue({ status: 401 } as never);
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
    vi.mocked(httpClient.get).mockResolvedValue({ status: 401 } as never);
    renderSession(new QueryClient());

    expect(await screen.findByText("no session")).toBeInTheDocument();
    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it("does not sign someone out over a failed check", async () => {
    vi.mocked(httpClient.get).mockResolvedValue({ status: 503 } as never);
    renderSession(
      new QueryClient({ defaultOptions: { queries: { retry: false } } }),
    );

    expect(await screen.findByText("no session")).toBeInTheDocument();
    await waitFor(() => expect(httpClient.get).toHaveBeenCalled());
    expect(navigation.replace).not.toHaveBeenCalled();
  });
});

describe("SessionProvider cross-tab freshness", () => {
  it("re-fetches the session on every mount instead of serving a stale cached identity", async () => {
    const queryClient = new QueryClient();
    vi.mocked(httpClient.get).mockResolvedValueOnce({
      status: 200,
      data: { fullName: "Leyla Aksoy" },
    } as never);

    const first = renderSession(queryClient);
    await waitFor(() =>
      expect(screen.getByText("Leyla Aksoy")).toBeInTheDocument(),
    );
    first.unmount();

    vi.mocked(httpClient.get).mockResolvedValueOnce({
      status: 200,
      data: { fullName: "Ayşe Kaya" },
    } as never);

    renderSession(queryClient);
    await waitFor(() =>
      expect(screen.getByText("Ayşe Kaya")).toBeInTheDocument(),
    );

    expect(httpClient.get).toHaveBeenCalledTimes(2);
  });
});
