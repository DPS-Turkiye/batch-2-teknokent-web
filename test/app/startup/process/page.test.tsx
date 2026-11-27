import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import StartupProcessPage from "@/app/startup/process/page";

vi.mock("@/components/startup/startup-process-view", () => ({
  StartupProcessView: ({
    focusAssignmentId,
  }: {
    focusAssignmentId: string | null;
  }) => <p>{focusAssignmentId ?? "no focus"}</p>,
}));

async function renderPage(assignment?: string | string[]) {
  render(
    await StartupProcessPage({
      searchParams: Promise.resolve(
        assignment === undefined ? {} : { assignment },
      ),
    }),
  );
}

describe("Süreç route", () => {
  it("opens on the Ödev a link names", async () => {
    await renderPage("as-1");
    expect(screen.getByText("as-1")).toBeInTheDocument();
  });

  it("opens without a focus when the link names none", async () => {
    await renderPage();
    expect(screen.getByText("no focus")).toBeInTheDocument();
  });

  it("ignores a repeated assignment parameter", async () => {
    await renderPage(["as-1", "as-2"]);
    expect(screen.getByText("no focus")).toBeInTheDocument();
  });
});
