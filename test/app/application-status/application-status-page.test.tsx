import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ApplicationStatusPage from "@/app/application-status/page";
import { buildApplicationTimeline } from "@/components/auth/application-status-timeline";
import { useAccountStatus } from "@/hooks/use-account-status";
import { useSubmittedProfile } from "@/hooks/use-submitted-profile";
import { UserAccountStatus, UserRole } from "@/interfaces/session";
import { ContactPreference } from "@/interfaces/signup";
import { DocumentKind } from "@/interfaces/startup-document";

vi.mock("@/hooks/use-account-status", () => ({
  useAccountStatus: vi.fn(),
}));

vi.mock("@/hooks/use-submitted-profile", () => ({
  useSubmittedProfile: vi.fn(),
}));

function mockSubmitted(
  overrides: Partial<ReturnType<typeof useSubmittedProfile>> = {},
) {
  vi.mocked(useSubmittedProfile).mockReturnValue({
    profile: null,
    documents: [],
    isLoading: false,
    isError: false,
    ...overrides,
  });
}

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
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSubmitted();
});

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

  it("waits for a student's account, not a startup", () => {
    const titles = (status: UserAccountStatus) =>
      buildApplicationTimeline(status, undefined, true).map((e) => e.title);

    expect(titles(UserAccountStatus.Pending)).toContain("Hesap aktif olacak");
    expect(titles(UserAccountStatus.Approved)).toContain("Hesap aktif");
    expect(
      [
        ...titles(UserAccountStatus.Pending),
        ...titles(UserAccountStatus.Approved),
        ...titles(UserAccountStatus.Rejected),
      ].some((title) => /startup/i.test(title)),
    ).toBe(false);
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

  it("tells a waiting student their account, not a startup, will open", () => {
    mockStatus({
      account: {
        ...account,
        organizationName: "Gülse Demir",
        individualMentee: true,
      },
    });
    render(<ApplicationStatusPage />);

    expect(screen.getByText("Hesap aktif olacak")).toBeInTheDocument();
    expect(screen.queryByText("Startup aktif olacak")).not.toBeInTheDocument();
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

  it("shows what was sent for review, with the uploaded files", () => {
    mockStatus({ account });
    mockSubmitted({
      profile: {
        id: "u1",
        fullName: "Gülse Demir",
        email: "gulse@dongu.co",
        jobTitle: "Kurucu ortak",
        phone: null,
        bio: "Döngüsel moda platformu kuruyoruz.",
        linkedinUrl: null,
        expertise: [],
        contactPreferences: [
          ContactPreference.Email,
          ContactPreference.VideoCall,
        ],
      },
      documents: [
        {
          id: "d1",
          kind: DocumentKind.PitchDeck,
          originalFilename: "deck.pdf",
          sizeBytes: 2048,
        },
      ],
    });
    render(<ApplicationStatusPage />);

    expect(
      screen.getByRole("heading", { name: "Gönderilen profil" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Kurucu ortak")).toBeInTheDocument();
    expect(
      screen.getByText("Döngüsel moda platformu kuruyoruz."),
    ).toBeInTheDocument();
    expect(screen.getByText(/Pitch Deck/)).toBeInTheDocument();
    expect(screen.getByText(/deck\.pdf/)).toBeInTheDocument();
  });

  it("says so when the submitted profile cannot be read", () => {
    mockStatus({ account });
    mockSubmitted({ isError: true });
    render(<ApplicationStatusPage />);
    expect(
      screen.getByText("Gönderilen profil şu an okunamadı."),
    ).toBeInTheDocument();
  });
});
