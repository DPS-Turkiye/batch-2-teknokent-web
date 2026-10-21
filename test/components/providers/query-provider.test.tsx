import { useQuery } from "@tanstack/react-query";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { QueryProvider } from "@/components/providers/query-provider";
import { polling, POLL_INTERVAL, recordActivity } from "@/lib/poll";

function Screen({
  polled,
  plain,
}: {
  polled: () => Promise<string>;
  plain: () => Promise<string>;
}) {
  useQuery({
    queryKey: ["polled"],
    queryFn: polled,
    ...polling(POLL_INTERVAL.background),
  });
  useQuery({ queryKey: ["plain"], queryFn: plain });
  return null;
}

describe("QueryProvider", () => {
  it("refreshes only polled queries when the user returns from idle", async () => {
    const polled = vi.fn().mockResolvedValue("polled");
    const plain = vi.fn().mockResolvedValue("plain");
    render(
      <QueryProvider>
        <Screen polled={polled} plain={plain} />
      </QueryProvider>,
    );
    await waitFor(() => expect(polled).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(plain).toHaveBeenCalledTimes(1));

    recordActivity(Date.now() - 3 * 60_000);
    fireEvent.pointerDown(window);

    await waitFor(() => expect(polled).toHaveBeenCalledTimes(2));
    expect(plain).toHaveBeenCalledTimes(1);
  });

  it("does not refetch on activity while the user is active", async () => {
    const polled = vi.fn().mockResolvedValue("polled");
    const plain = vi.fn().mockResolvedValue("plain");
    render(
      <QueryProvider>
        <Screen polled={polled} plain={plain} />
      </QueryProvider>,
    );
    await waitFor(() => expect(polled).toHaveBeenCalledTimes(1));

    recordActivity();
    fireEvent.keyDown(window);

    expect(polled).toHaveBeenCalledTimes(1);
  });
});
