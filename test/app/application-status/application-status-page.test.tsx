import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ApplicationStatusPage from "@/app/application-status/page";
import { buildApplicationTimeline } from "@/components/auth/application-status-timeline";
import { useAccountStatus } from "@/hooks/use-account-status";
import { UserAccountStatus, UserRole } from "@/interfaces/session";

vi.mock("@/hooks/use-account-status", () => ({
  useAccountStatus: vi.fn(),
}));

const account = {
  id: "u1",
  email: "gulse@dongu.co",
  fullName: "Gülse Demir",
  role: UserRole.Mentee,
  status: UserAccountStatus.Pending,
  organizationName: "Döngü",
};

function mockStatus(overrides: Partial<ReturnType<typeof useAccountStatus>>) {
  vi.mocked(useAccountStatus).mockReturnValue({
    account: null,
    isLoading: false,
    isSignedOut: false,
    error: null,
    ...overrides,
  } as ReturnType<typeof useAccountStatus>);
}

beforeEach(() => vi.clearAllMocks());

describe("buildApplicationTimeline", () => {
  it("marks review as the current step while pending", () => {
    const entries = buildApplicationTimeline(UserAccountStatus.Pending);
    expect(entries.find((e) => e.state === "current")?.title).toBe(
      "İnceleniyor",
    );
  });

  it("has no pending steps left once approved", () => {
    const entries = buildApplicationTimeline(UserAccountStatus.Approved);
    expect(entries.some((e) => e.state === "pending")).toBe(false);
  });

  it("surfaces the rejection as the current step", () => {
    const entries = buildApplicationTimeline(UserAccountStatus.Rejected);
    expect(entries.find((e) => e.state === "current")?.title).toBe(
      "Başvuru onaylanmadı",
    );
  });
});

describe("ApplicationStatusPage", () => {
  it("asks the visitor to sign in when Firebase has no user", () => {
    mockStatus({ isSignedOut: true });
    render(<ApplicationStatusPage />);
    expect(
      screen.getByRole("heading", {
        name: "Başvuru durumunu görmek için giriş yap",
      }),
    ).toBeInTheDocument();
  });

  it("shows the organization and the pending badge", () => {
    mockStatus({ account });
    render(<ApplicationStatusPage />);
    expect(screen.getByRole("heading", { name: "Döngü" })).toBeInTheDocument();
    expect(screen.getByText("Koordinatör incelemesinde")).toBeInTheDocument();
    expect(screen.getByText("İnceleniyor")).toBeInTheDocument();
  });

  it("offers a sign-in link once the account is approved", () => {
    mockStatus({
      account: { ...account, status: UserAccountStatus.Approved },
    });
    render(<ApplicationStatusPage />);
    expect(screen.getByRole("link", { name: "Giriş yap" })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("explains a rejected application", () => {
    mockStatus({
      account: { ...account, status: UserAccountStatus.Rejected },
    });
    render(<ApplicationStatusPage />);
    expect(screen.getByText("Onaylanmadı")).toBeInTheDocument();
    expect(screen.getByText("Başvuru onaylanmadı")).toBeInTheDocument();
  });

  it("falls back to the full name when there is no organization", () => {
    mockStatus({ account: { ...account, organizationName: null } });
    render(<ApplicationStatusPage />);
    expect(
      screen.getByRole("heading", { name: "Gülse Demir" }),
    ).toBeInTheDocument();
  });
});
