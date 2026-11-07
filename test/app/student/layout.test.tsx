import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import AcademicianLayout from "@/app/academician/layout";
import AcademicianHomePage from "@/app/academician/page";
import StudentLayout from "@/app/student/layout";
import StudentHomePage from "@/app/student/page";

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

const original = process.env.ODTU_WORKSPACES_ENABLED;

beforeEach(() => {
  delete process.env.ODTU_WORKSPACES_ENABLED;
});
afterEach(() => {
  if (original === undefined) delete process.env.ODTU_WORKSPACES_ENABLED;
  else process.env.ODTU_WORKSPACES_ENABLED = original;
});

describe("ODTÜ workspace layouts", () => {
  it.each([undefined, "", "false", "1", "TRUE"])(
    "answer like a missing route while the flag is %s",
    async (value) => {
      if (value !== undefined) process.env.ODTU_WORKSPACES_ENABLED = value;
      await expect(StudentLayout({ children: <p>x</p> })).rejects.toThrow(
        NotFound,
      );
      await expect(AcademicianLayout({ children: <p>x</p> })).rejects.toThrow(
        NotFound,
      );
    },
  );

  it("open the student workspace in its frame once the flag is on", async () => {
    process.env.ODTU_WORKSPACES_ENABLED = "true";
    render(await StudentLayout({ children: await StudentHomePage() }));
    expect(screen.getByTestId("student-frame")).toHaveTextContent(
      "Öğrenci çalışma alanı hazırlanıyor",
    );
  });

  it("open the academician workspace in its frame once the flag is on", async () => {
    process.env.ODTU_WORKSPACES_ENABLED = "true";
    render(await AcademicianLayout({ children: await AcademicianHomePage() }));
    expect(screen.getByTestId("academician-frame")).toHaveTextContent(
      "Akademisyen çalışma alanı hazırlanıyor",
    );
  });
});
