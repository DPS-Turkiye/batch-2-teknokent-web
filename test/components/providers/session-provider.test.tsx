import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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
