import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useEdition } from "@/hooks/use-edition";
import { Edition } from "@/interfaces/edition";
import type { AppSession } from "@/interfaces/session";
import { appSession } from "@test/fixtures/session";

const mockUseAppSession = vi.fn<() => AppSession | null>();

vi.mock("@/components/providers/session-provider", () => ({
  useAppSession: () => mockUseAppSession(),
}));

describe("useEdition", () => {
  beforeEach(() => {
    mockUseAppSession.mockReset();
  });

  it("reads the edition the session was signed in on", () => {
    mockUseAppSession.mockReturnValue(appSession({ edition: Edition.Odtu }));

    expect(renderHook(() => useEdition()).result.current).toBe(Edition.Odtu);
  });

  it("reads a session from before editions, or none, as Teknokent", () => {
    mockUseAppSession.mockReturnValue(appSession());
    expect(renderHook(() => useEdition()).result.current).toBe(
      Edition.Teknokent,
    );

    mockUseAppSession.mockReturnValue(null);
    expect(renderHook(() => useEdition()).result.current).toBe(
      Edition.Teknokent,
    );
  });
});
