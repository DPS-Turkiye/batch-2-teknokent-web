import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ReviewStep } from "@/components/signup/steps/review-step";
import { signupDraft, signupWizardStub } from "@test/fixtures/signup-wizard";

vi.mock("@/hooks/use-programs", () => ({
  useProgramNames: () => ({
    data: [
      {
        id: "individual-1",
        name: "ODTÜ Ofis Saatleri",
        individualMentees: true,
      },
      {
        id: "startups-1",
        name: "Growth Circuit 2026",
        individualMentees: false,
      },
    ],
  }),
}));
vi.mock("@/hooks/use-stored-documents", () => ({
  useStoredDocuments: () => ({ byKind: () => undefined }),
}));

function wizard(programId: string) {
  return signupWizardStub({
    draft: signupDraft({
      personal: { firstName: "Ayşe", lastName: "Yılmaz", role: "Öğrenci" },
      startup: { programId, name: "GreenLoop", tagline: "Atığı azaltır" },
    }),
  });
}

describe("ReviewStep", () => {
  it("shows no startup for someone joining an individual program", () => {
    render(<ReviewStep wizard={wizard("individual-1")} />);

    expect(screen.getByText("ODTÜ Ofis Saatleri")).toBeInTheDocument();
    expect(screen.queryByText("GreenLoop")).not.toBeInTheDocument();
  });

  it("shows the founder's startup in a startup program", () => {
    render(<ReviewStep wizard={wizard("startups-1")} />);

    expect(screen.getByText("GreenLoop")).toBeInTheDocument();
    expect(screen.getByText("Atığı azaltır")).toBeInTheDocument();
    expect(
      screen.getByText("Growth Circuit 2026", { exact: false }),
    ).toBeInTheDocument();
  });
});
