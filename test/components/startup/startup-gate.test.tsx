import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { StartupEmptyState } from "@/components/startup/startup-gate";
import { StartupAccess } from "@/lib/startup-access";

const mockIndividualProgram = vi.fn();

vi.mock("@/hooks/use-individual-program", () => ({
  useIndividualProgram: () => mockIndividualProgram(),
}));

describe("StartupEmptyState", () => {
  beforeEach(() =>
    mockIndividualProgram.mockReturnValue({
      individual: false,
      isLoading: false,
    }),
  );

  it("sends a waiting startup to Startup'ım", () => {
    render(<StartupEmptyState access={StartupAccess.Pending} />);

    expect(
      screen.getByRole("heading", {
        name: "Startup'ınız koordinatör onayı bekliyor.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Startup'ım sayfasına git" }),
    ).toHaveAttribute("href", "/startup");
  });

  it("tells a waiting student about their application and opens Dosyalar", () => {
    mockIndividualProgram.mockReturnValue({
      individual: true,
      isLoading: false,
    });
    render(<StartupEmptyState access={StartupAccess.Pending} />);

    expect(
      screen.getByRole("heading", {
        name: "Başvurunuz koordinatör onayı bekliyor.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Projem sayfasına git" }),
    ).toHaveAttribute("href", "/startup/files");
    expect(screen.queryByText(/startup/i)).not.toBeInTheDocument();
  });

  it("points a rejected student to Projem to send it again", () => {
    mockIndividualProgram.mockReturnValue({
      individual: true,
      isLoading: false,
    });
    render(<StartupEmptyState access={StartupAccess.Rejected} />);

    expect(
      screen.getByRole("heading", { name: "Başvurunuz onaylanmadı" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Projem sayfasından başvurunuzu tekrar onaya gönderebilirsiniz.",
      ),
    ).toBeInTheDocument();
  });
});
