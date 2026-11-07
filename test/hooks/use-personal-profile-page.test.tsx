import { act, renderHook, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAppSession } from "@/components/providers/session-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
import { useOpenActionCounts } from "@/hooks/use-open-action-counts";
import { useOrganizationMembers } from "@/hooks/use-organization-members";
import { usePersonalProfile } from "@/hooks/use-personal-profile";
import { usePersonalProfilePage } from "@/hooks/use-personal-profile-page";
import { useProfilePhoto } from "@/hooks/use-profile-photo";
import { useStartupHeader } from "@/hooks/use-startup-header";
import { useStartupOverview } from "@/hooks/use-startup-overview";
import { UserRole, type AppSession } from "@/interfaces/session";
import { requestPasswordReset } from "@/lib/firebase/auth";

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

vi.mock("@/components/providers/session-provider", () => ({
  useAppSession: vi.fn(),
}));
vi.mock("@/hooks/use-open-action-counts", () => ({
  useOpenActionCounts: vi.fn(),
}));
vi.mock("@/hooks/use-organization-members", () => ({
  useOrganizationMembers: vi.fn(),
}));
vi.mock("@/hooks/use-personal-profile", () => ({
  usePersonalProfile: vi.fn(),
}));
vi.mock("@/hooks/use-profile-photo", () => ({ useProfilePhoto: vi.fn() }));
vi.mock("@/hooks/use-startup-header", () => ({ useStartupHeader: vi.fn() }));
vi.mock("@/hooks/use-startup-overview", () => ({
  useStartupOverview: vi.fn(),
}));
vi.mock("@/lib/firebase/auth", () => ({ requestPasswordReset: vi.fn() }));

function Wrapper({ children }: { children: ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}

const discard = vi.fn();
let saved = false;

function session(overrides: Partial<AppSession> = {}): AppSession {
  return {
    userId: "user-1",
    email: "gulse@dongu.app",
    fullName: "Gülse Buran",
    jobTitle: "Product Designer",
    role: UserRole.Mentee,
    organizationId: "org-1",
    organizationName: "Döngü",
    ...overrides,
  };
}

function mockAll({
  founder = true,
  withSession = session(),
}: { founder?: boolean; withSession?: AppSession } = {}) {
  vi.mocked(useAppSession).mockReturnValue(withSession);
  vi.mocked(usePersonalProfile).mockImplementation(
    () =>
      ({
        draft: {
          fullName: "Gülse Buran",
          jobTitle: "Product Designer",
          phone: null,
          bio: "Kurucu ortağım.",
          linkedinUrl: null,
          expertise: [],
        },
        setField: vi.fn(),
        save: vi.fn(),
        discard,
        saved,
        isDirty: false,
        isLoading: false,
        isSaving: false,
        loadError: null,
        saveError: null,
        fieldErrors: {},
        canSave: true,
      }) as unknown as ReturnType<typeof usePersonalProfile>,
  );
  vi.mocked(useProfilePhoto).mockReturnValue({
    photoUrl: null,
    isUploading: false,
    upload: vi.fn(),
  });
  vi.mocked(useStartupHeader).mockReturnValue({
    fundingStage: "Pre-seed",
    initials: "DÖ",
    isLoading: false,
    logoUrl: null,
    name: "Döngü",
    programName: "METU Stars 2026",
    stageName: null,
  } as unknown as ReturnType<typeof useStartupHeader>);
  vi.mocked(useStartupOverview).mockReturnValue({
    mentorships: [
      {
        id: "r1",
        mentorName: "Nihan Öztürk",
        supportArea: "Ürün konumlandırma",
        heldSessions: 3,
        plannedSessions: 6,
        nextMeetingAt: null,
      },
    ],
    mentorshipsLoading: false,
    profile: { maturity: "MVP yayında" },
    teamSize: 4,
  } as unknown as ReturnType<typeof useStartupOverview>);
  vi.mocked(useOrganizationMembers).mockReturnValue({
    data: [{ id: "user-1", founder }],
  } as unknown as ReturnType<typeof useOrganizationMembers>);
  vi.mocked(useOpenActionCounts).mockReturnValue({ r1: 1 });
}

describe("usePersonalProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    saved = false;
  });

  it("describes the founder, their startup and their mentorships", () => {
    mockAll();
    const { result } = renderHook(() => usePersonalProfilePage(), {
      wrapper: Wrapper,
    });

    expect(result.current.subtitle).toBe("Product Designer · Kurucu · Döngü");
    expect(result.current.chips.map((chip) => chip.label)).toEqual([
      "METU Stars 2026",
      "Mentorluk alıyor",
      "Pre-seed",
    ]);
    expect(result.current.startup?.summary).toBe(
      "Pre-seed · 4 kişilik ekip · MVP yayında",
    );
    expect(result.current.mentorships).toEqual([
      {
        id: "r1",
        mentorName: "Nihan Öztürk",
        initials: "NÖ",
        detail: "Ürün konumlandırma · 3/6 seans",
        status: "1 açık aksiyon",
        href: "/mentor-request/status?id=r1",
      },
    ]);
  });

  it("drops Kurucu for other members and the startup card without a startup", () => {
    mockAll({
      founder: false,
      withSession: session({
        organizationId: undefined,
        organizationName: undefined,
      }),
    });
    const { result } = renderHook(() => usePersonalProfilePage(), {
      wrapper: Wrapper,
    });

    expect(result.current.role).toBe("Product Designer");
    expect(result.current.startup).toBeNull();
  });

  it("shows a student of an individual program no startup, founder or funding", () => {
    mockAll();
    mockIndividualProgram.mockReturnValue({
      individual: true,
      isLoading: false,
    });
    const { result } = renderHook(() => usePersonalProfilePage(), {
      wrapper: Wrapper,
    });

    expect(result.current.subtitle).toBe("Product Designer");
    expect(result.current.chips.map((chip) => chip.label)).toEqual([
      "METU Stars 2026",
      "Mentorluk alıyor",
    ]);
    expect(result.current.startup).toBeNull();
    expect(result.current.cvWhoSees).toBe("Sadece sen görürsün.");
  });

  it("enters edit mode from a clean draft and leaves it once saved", () => {
    mockAll();
    const { result, rerender } = renderHook(() => usePersonalProfilePage(), {
      wrapper: Wrapper,
    });

    act(() => result.current.startEditing());
    expect(discard).toHaveBeenCalledTimes(1);
    expect(result.current.isEditing).toBe(true);

    saved = true;
    rerender();
    expect(result.current.isEditing).toBe(false);
  });

  it("cancels an edit by discarding it", () => {
    mockAll();
    const { result } = renderHook(() => usePersonalProfilePage(), {
      wrapper: Wrapper,
    });

    act(() => result.current.startEditing());
    act(() => result.current.cancelEditing());

    expect(discard).toHaveBeenCalledTimes(2);
    expect(result.current.isEditing).toBe(false);
  });

  it("sends a password reset e-mail and reports the outcome", async () => {
    mockAll();
    vi.mocked(requestPasswordReset)
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("network"));
    const { result } = renderHook(() => usePersonalProfilePage(), {
      wrapper: Wrapper,
    });

    await act(() => result.current.sendPasswordReset());
    expect(requestPasswordReset).toHaveBeenCalledWith("gulse@dongu.app");
    expect(
      await screen.findByText(
        "Şifre sıfırlama bağlantısı e-postana gönderildi.",
      ),
    ).toBeInTheDocument();

    await act(() => result.current.sendPasswordReset());
    expect(
      await screen.findByText("Şifre sıfırlama e-postası gönderilemedi."),
    ).toBeInTheDocument();
  });

  it("says an account page is coming soon", async () => {
    mockAll();
    const { result } = renderHook(() => usePersonalProfilePage(), {
      wrapper: Wrapper,
    });

    act(() => result.current.showComingSoon());

    expect(
      await screen.findByText("Bu bölüm yakında eklenecek."),
    ).toBeInTheDocument();
  });
});
