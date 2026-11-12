import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import OfficeHoursLayout from "@/app/office-hours/layout";

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

describe("office hours layout", () => {
  it("opens in the ODTÜ edition", async () => {
    vi.stubEnv("APP_EDITION", "ODTU");
    render(await OfficeHoursLayout({ children: <p>Derslerim</p> }));
    expect(screen.getByText("Derslerim")).toBeInTheDocument();
  });

  it("answers like a missing route in the Teknokent edition", async () => {
    vi.stubEnv("APP_EDITION", "TEKNOKENT");
    await expect(
      OfficeHoursLayout({ children: <p>Derslerim</p> }),
    ).rejects.toThrow(NotFound);
  });
});
