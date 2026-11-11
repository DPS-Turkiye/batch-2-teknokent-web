import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MyProgramsPanel } from "@/components/dashboard/my-programs-panel";
import { useOrganizationPrograms, usePrograms } from "@/hooks/use-programs";
import { idleQuery } from "@test/mocks/query-results";

vi.mock("@/components/providers/session-provider", () => ({
  useAppSession: () => ({ userId: "mentor-1" }),
}));

vi.mock("@/hooks/use-programs", () => ({
  useOrganizationPrograms: vi.fn(),
  usePrograms: vi.fn(),
}));

describe("MyProgramsPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useOrganizationPrograms).mockReturnValue(idleQuery());
    vi.mocked(usePrograms).mockReturnValue(idleQuery());
  });

  it("asks a mentor's home only for mentor programs", () => {
    render(<MyProgramsPanel variant="mentor" />);

    expect(useOrganizationPrograms).toHaveBeenCalledWith({ enabled: false });
    expect(usePrograms).toHaveBeenCalledWith({ enabled: true });
  });

  it("asks a mentee's home only for the startup's programs", () => {
    render(<MyProgramsPanel />);

    expect(useOrganizationPrograms).toHaveBeenCalledWith({ enabled: true });
    expect(usePrograms).toHaveBeenCalledWith({ enabled: false });
  });
});
