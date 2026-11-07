import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { StartupPageFrame } from "@/components/startup/startup-page-frame";
import { useStartupHeader } from "@/hooks/use-startup-header";
import { StartupFundingStage } from "@/interfaces/organization";

const mockIndividualProgram = vi.fn();

vi.mock("@/hooks/use-individual-program", () => ({
  useIndividualProgram: () => mockIndividualProgram(),
}));

beforeEach(() =>
  mockIndividualProgram.mockReturnValue({
    individual: false,
    isLoading: false,
  }),
);

vi.mock("next/navigation", () => ({
  usePathname: () => "/startup/files",
}));

vi.mock("@/hooks/use-startup-header", () => ({
  useStartupHeader: vi.fn(),
}));

type Header = ReturnType<typeof useStartupHeader>;

function header(overrides: Partial<Header> = {}): Header {
  return {
    fundingStage: StartupFundingStage.PreSeed,
    initials: "D",
    isLoading: false,
    logoUrl: null,
    name: "Döngü",
    programName: "METU Stars 2026",
    stageName: "MVP",
    ...overrides,
  };
}

describe("StartupPageFrame", () => {
  beforeEach(() => {
    vi.mocked(useStartupHeader).mockReturnValue(header());
  });

  it("names the startup with its program, stage and funding, above the tabs", () => {
    render(
      <StartupPageFrame action={<button type="button">Dosya yükle</button>}>
        <p>İçerik</p>
      </StartupPageFrame>,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Döngü" }),
    ).toBeInTheDocument();
    expect(screen.getByText("METU Stars 2026")).toBeInTheDocument();
    expect(screen.getByText("MVP aşaması")).toBeInTheDocument();
    expect(screen.getByText("Pre-seed")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Dosya yükle" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dosyalar" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByText("İçerik")).toBeInTheDocument();
  });

  it("calls a student's page Projem, under their program, with no startup chips", () => {
    mockIndividualProgram.mockReturnValue({
      individual: true,
      isLoading: false,
    });
    vi.mocked(useStartupHeader).mockReturnValue(header({ name: "Elif Kaya" }));

    render(
      <StartupPageFrame>
        <p>İçerik</p>
      </StartupPageFrame>,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Projem" }),
    ).toBeInTheDocument();
    expect(screen.getByText("METU Stars 2026")).toBeInTheDocument();
    expect(screen.queryByText("MVP aşaması")).not.toBeInTheDocument();
    expect(screen.queryByText("Pre-seed")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Profil" }),
    ).not.toBeInTheDocument();
  });

  it("shows the signed logo when there is one", () => {
    vi.mocked(useStartupHeader).mockReturnValue(
      header({ logoUrl: "https://bucket.s3/logo.png?sig" }),
    );

    render(
      <StartupPageFrame>
        <p>İçerik</p>
      </StartupPageFrame>,
    );

    expect(screen.getByRole("img", { name: "Döngü logosu" })).toHaveStyle({
      backgroundImage: 'url("https://bucket.s3/logo.png?sig")',
    });
  });

  it("leaves out the chips it has nothing for", () => {
    vi.mocked(useStartupHeader).mockReturnValue(
      header({ fundingStage: null, programName: null, stageName: null }),
    );

    render(
      <StartupPageFrame>
        <p>İçerik</p>
      </StartupPageFrame>,
    );

    expect(screen.queryByText(/aşaması$/)).not.toBeInTheDocument();
    expect(screen.queryByText("Pre-seed")).not.toBeInTheDocument();
  });
});
