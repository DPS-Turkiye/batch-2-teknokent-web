import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import MobileLayout from "@/app/m/layout";

class NotFound extends Error {}

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new NotFound();
  },
}));
vi.mock("next/server", () => ({ connection: vi.fn(async () => {}) }));

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("phone app layout", () => {
  it("opens in the Teknokent edition", async () => {
    vi.stubEnv("APP_EDITION", undefined);
    render(await MobileLayout({ children: <p>Bugün</p> }));
    expect(screen.getByText("Bugün")).toBeInTheDocument();
  });

  it("answers like a missing route in the ODTÜ edition", async () => {
    vi.stubEnv("APP_EDITION", "ODTU");
    await expect(MobileLayout({ children: <p>Bugün</p> })).rejects.toThrow(
      NotFound,
    );
  });
});
