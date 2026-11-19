import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import AttendPage, { metadata } from "@/app/attend/[token]/page";
import { checkInSession } from "@/lib/client/program-attendance";
import { sessionCheckIn } from "@test/fixtures/program-attendance";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/program-attendance", () => ({
  checkInSession: vi.fn(),
}));

describe("/attend/[token]", () => {
  it("checks in with the token from the address", async () => {
    vi.mocked(checkInSession).mockResolvedValue(sessionCheckIn());

    renderWithQueryClient(
      await AttendPage({ params: Promise.resolve({ token: "Ab_-9" }) }),
    );

    expect(await screen.findByText("Yoklaman alındı")).toBeInTheDocument();
    expect(checkInSession).toHaveBeenCalledWith("Ab_-9");
  });

  // The token is in the address: it must not leak through a Referer header or a search index.
  it("sends no referrer and asks not to be indexed", () => {
    expect(metadata.referrer).toBe("no-referrer");
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
