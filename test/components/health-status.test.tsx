import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { HealthStatus } from "@/components/health-status";
import { fetchHealthClient, HealthFetchError } from "@/lib/health";
import { healthyResponse, unhealthyResponse } from "@test/fixtures/health";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/health", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/health")>();

  return {
    ...actual,
    fetchHealthClient: vi.fn(),
  };
});

describe("HealthStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state while health data is fetched", () => {
    vi.mocked(fetchHealthClient).mockReturnValue(new Promise(() => undefined));

    renderWithQueryClient(<HealthStatus />);

    expect(screen.getByTestId("health-status-loading")).toBeInTheDocument();
    expect(
      screen.getByText("Backend health status is loading..."),
    ).toBeInTheDocument();
  });

  it("renders healthy backend details", async () => {
    vi.mocked(fetchHealthClient).mockResolvedValue(healthyResponse);

    renderWithQueryClient(<HealthStatus />);

    await waitFor(() => {
      expect(screen.getByTestId("health-status-panel")).toBeInTheDocument();
    });

    expect(screen.getByTestId("health-status-badge")).toHaveTextContent("UP");
    expect(screen.getByText("Version")).toBeInTheDocument();
    expect(screen.getByText("local")).toBeInTheDocument();
    expect(screen.getByText("Database")).toBeInTheDocument();
    expect(screen.getByText("Redis")).toBeInTheDocument();
    expect(screen.getByText("2026-01-01T00:00:00Z")).toBeInTheDocument();
  });

  it("renders unhealthy backend details", async () => {
    vi.mocked(fetchHealthClient).mockResolvedValue(unhealthyResponse);

    renderWithQueryClient(<HealthStatus />);

    await waitFor(() => {
      expect(screen.getByTestId("health-status-badge")).toHaveTextContent(
        "DOWN",
      );
    });
  });

  it("shows error state and retries on demand", async () => {
    const user = userEvent.setup();

    vi.mocked(fetchHealthClient)
      .mockRejectedValueOnce(new HealthFetchError("Health API request failed"))
      .mockResolvedValueOnce(healthyResponse);

    renderWithQueryClient(<HealthStatus />);

    await waitFor(() => {
      expect(screen.getByTestId("health-status-error")).toBeInTheDocument();
    });

    expect(screen.getByText("Health check failed")).toBeInTheDocument();
    expect(screen.getByText("Health API request failed")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() => {
      expect(screen.getByTestId("health-status-panel")).toBeInTheDocument();
    });
  });

  it("refreshes health data from the refresh button", async () => {
    const user = userEvent.setup();
    vi.mocked(fetchHealthClient).mockResolvedValue(healthyResponse);

    renderWithQueryClient(<HealthStatus />);

    await waitFor(() => {
      expect(screen.getByTestId("health-status-panel")).toBeInTheDocument();
    });

    const initialCallCount = vi.mocked(fetchHealthClient).mock.calls.length;

    await user.click(screen.getByRole("button", { name: "Refresh" }));

    await waitFor(() => {
      expect(fetchHealthClient).toHaveBeenCalledTimes(initialCallCount + 1);
    });
  });
});
