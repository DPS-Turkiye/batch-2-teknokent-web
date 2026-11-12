import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import AcademicianLayout from "@/app/academician/layout";
import StudentLayout from "@/app/student/layout";

class NotFound extends Error {}

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new NotFound();
  },
}));
vi.mock("next/server", () => ({ connection: vi.fn(async () => {}) }));
vi.mock("@/components/student/student-frame", () => ({
  StudentFrame: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="student-frame">{children}</div>
  ),
}));
vi.mock("@/components/academician/academician-frame", () => ({
  AcademicianFrame: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="academician-frame">{children}</div>
  ),
}));

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("ODTÜ workspace layouts", () => {
  it.each([undefined, "", "TEKNOKENT", "teknokent"])(
    "answer like a missing route in the Teknokent edition (APP_EDITION=%s)",
    async (value) => {
      vi.stubEnv("APP_EDITION", value);
      await expect(StudentLayout({ children: <p>x</p> })).rejects.toThrow(
        NotFound,
      );
      await expect(AcademicianLayout({ children: <p>x</p> })).rejects.toThrow(
        NotFound,
      );
    },
  );

  it("open the student workspace in its frame in the ODTÜ edition", async () => {
    vi.stubEnv("APP_EDITION", "ODTU");
    render(await StudentLayout({ children: <p>Ana Sayfa</p> }));
    expect(screen.getByTestId("student-frame")).toHaveTextContent("Ana Sayfa");
  });

  it("open the academician workspace in its frame in the ODTÜ edition", async () => {
    vi.stubEnv("APP_EDITION", "ODTU");
    render(await AcademicianLayout({ children: <p>Randevu Talepleri</p> }));
    expect(screen.getByTestId("academician-frame")).toHaveTextContent(
      "Randevu Talepleri",
    );
  });
});
