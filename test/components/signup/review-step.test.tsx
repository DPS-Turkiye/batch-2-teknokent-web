import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ReviewStep } from "@/components/signup/steps/review-step";
import type { SignupWizard } from "@/hooks/use-signup-wizard";

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
  return {
    draft: {
      personal: {
        firstName: "Ayşe",
        lastName: "Yılmaz",
        role: "Öğrenci",
        bio: "",
        contactPreferences: [],
      },
      startup: {
        startupLater: true,
        programId,
        name: "",
        tagline: "",
        maturity: "",
        teamMembers: [],
        supportAreas: [],
      },
      documents: {},
      mvpUrl: "",
      consent: false,
    },
    goToStep: vi.fn(),
    setConsent: vi.fn(),
  } as unknown as SignupWizard;
}

describe("ReviewStep", () => {
  it("shows no startup for someone joining an individual program", () => {
    render(<ReviewStep wizard={wizard("individual-1")} />);

    expect(screen.getByText("ODTÜ Ofis Saatleri")).toBeInTheDocument();
    expect(
      screen.queryByText("Daha sonra oluşturulacak"),
    ).not.toBeInTheDocument();
  });

  it("still says the startup comes later in a startup program", () => {
    render(<ReviewStep wizard={wizard("startups-1")} />);

    expect(screen.getByText("Growth Circuit 2026")).toBeInTheDocument();
    expect(screen.getByText("Daha sonra oluşturulacak")).toBeInTheDocument();
  });
});
