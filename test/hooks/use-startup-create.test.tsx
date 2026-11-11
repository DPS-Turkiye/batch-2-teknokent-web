import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SESSION_QUERY_KEY } from "@/components/providers/session-provider";
import { useStartupAccess } from "@/hooks/use-startup-access";
import {
  StartupCreateStep,
  useStartupCreate,
} from "@/hooks/use-startup-create";
import { UserRole, type AppSession } from "@/interfaces/session";
import { MAX_SUPPORT_AREAS, StartupDocumentKind } from "@/interfaces/signup";
import { DocumentKind } from "@/interfaces/startup-document";
import { uploadDocument } from "@/lib/client/documents";
import { createStartup } from "@/lib/client/organization";
import { StartupAccess } from "@/lib/startup-access";
import { queryWrapper } from "@test/fixtures/query-wrapper";

const navigation = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
const viewer = vi.hoisted(() => ({
  session: null as AppSession | null,
}));

vi.mock("next/navigation", () => ({ useRouter: () => navigation }));
vi.mock("@/components/providers/session-provider", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("@/components/providers/session-provider")
  >()),
  useSession: () => ({ session: viewer.session }),
}));
vi.mock("@/hooks/use-startup-access", () => ({ useStartupAccess: vi.fn() }));
vi.mock("@/lib/client/organization", () => ({ createStartup: vi.fn() }));
vi.mock("@/lib/client/documents", () => ({ uploadDocument: vi.fn() }));

const founder: AppSession = {
  userId: "user-1",
  email: "ada@acme.test",
  fullName: "Ada Kaya",
  jobTitle: "CEO",
  role: UserRole.Mentee,
};
const withStartup: AppSession = {
  ...founder,
  organizationId: "org-1",
  organizationName: "Acme",
};

function pdf(name: string) {
  return new File(["%PDF"], name, { type: "application/pdf" });
}

function accessIs(access: StartupAccess) {
  vi.mocked(useStartupAccess).mockReturnValue({ access, isLoading: false });
}

function renderCreate() {
  const wrapped = queryWrapper();
  const view = renderHook(() => useStartupCreate(), {
    wrapper: wrapped.wrapper,
  });
  return { ...view, queryClient: wrapped.queryClient };
}

describe("useStartupCreate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    viewer.session = founder;
    accessIs(StartupAccess.None);
    vi.mocked(createStartup).mockResolvedValue(withStartup);
    vi.mocked(uploadDocument).mockImplementation(async (file, kind) => ({
      id: `doc-${file.name}`,
      kind,
      originalFilename: file.name,
      sizeBytes: file.size,
    }));
  });

  it("starts on the profile step with the founder's name and title filled in", () => {
    const { result } = renderCreate();

    expect(result.current.step).toBe(StartupCreateStep.Profile);
    expect(result.current.draft.personal.firstName).toBe("Ada Kaya");
    expect(result.current.draft.personal.role).toBe("CEO");
    expect(result.current.error).toBeNull();
  });

  it("starts with an empty founder when there is no session", () => {
    viewer.session = null;

    const { result } = renderCreate();

    expect(result.current.draft.personal.firstName).toBe("");
    expect(result.current.draft.personal.role).toBe("");
  });

  it("can continue only once the name and tagline are both filled", () => {
    const { result } = renderCreate();
    expect(result.current.canContinue).toBe(false);

    act(() => result.current.updateStartup("name", "Acme"));
    expect(result.current.canContinue).toBe(false);

    act(() => result.current.updateStartup("tagline", "   "));
    expect(result.current.canContinue).toBe(false);

    act(() => result.current.updateStartup("tagline", "Atığı azaltır"));
    expect(result.current.canContinue).toBe(true);
  });

  it("reports the support-area limit once it is reached", () => {
    const { result } = renderCreate();

    act(() => {
      for (let area = 0; area < MAX_SUPPORT_AREAS; area += 1) {
        result.current.toggleSupportArea(`area-${String(area)}`);
      }
    });

    expect(result.current.supportAreaLimitReached).toBe(true);
  });

  it("moves between the profile and documents steps", () => {
    const { result } = renderCreate();

    act(() => result.current.goToDocuments());
    expect(result.current.step).toBe(StartupCreateStep.Documents);

    act(() => result.current.goToProfile());
    expect(result.current.step).toBe(StartupCreateStep.Profile);
  });

  it("creates the startup, uploads the logo and documents, adopts the session and opens the startup", async () => {
    const logo = pdf("logo.png");
    const deck = pdf("deck.pdf");
    const { result, queryClient } = renderCreate();
    act(() => {
      result.current.updateStartup("name", "  Acme ");
      result.current.updateStartup("tagline", "Atığı azaltır");
      result.current.updateStartup("logo", {
        name: "logo.png",
        size: 4,
        file: logo,
      });
      result.current.setDocument(StartupDocumentKind.PitchDeck, {
        name: "deck.pdf",
        size: 4,
        file: deck,
      });
      result.current.setDocument(StartupDocumentKind.Canvas, {
        name: "canvas.pdf",
        size: 4,
      });
    });

    act(() => result.current.submit());

    await waitFor(() =>
      expect(navigation.push).toHaveBeenCalledWith("/startup"),
    );
    expect(createStartup).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Acme", description: "Atığı azaltır" }),
    );
    // The canvas entry has no file of its own (restored from a saved draft), so nothing is sent for it.
    expect(vi.mocked(uploadDocument).mock.calls).toEqual([
      [logo, DocumentKind.Logo],
      [deck, DocumentKind.PitchDeck],
    ]);
    expect(queryClient.getQueryData(SESSION_QUERY_KEY)).toEqual(withStartup);
  });

  it("still opens the new startup, on its files tab, when an upload fails", async () => {
    vi.mocked(uploadDocument).mockRejectedValue(new Error("413"));
    const { result, queryClient } = renderCreate();
    act(() => {
      result.current.updateStartup("name", "Acme");
      result.current.setDocument(StartupDocumentKind.Mvp, {
        name: "mvp.pdf",
        size: 4,
        file: pdf("mvp.pdf"),
      });
    });

    act(() => result.current.submit());

    await waitFor(() =>
      expect(navigation.push).toHaveBeenCalledWith("/startup/files"),
    );
    expect(queryClient.getQueryData(SESSION_QUERY_KEY)).toEqual(withStartup);
    expect(result.current.error).toBeNull();
  });

  it("shows the server's reason and stays put when the startup cannot be created", async () => {
    vi.mocked(createStartup).mockRejectedValue(
      new Error("Bu isimde bir startup var."),
    );
    const { result } = renderCreate();

    act(() => result.current.submit());

    await waitFor(() =>
      expect(result.current.error).toBe("Bu isimde bir startup var."),
    );
    expect(uploadDocument).not.toHaveBeenCalled();
    expect(navigation.push).not.toHaveBeenCalled();
    expect(result.current.submitting).toBe(false);
  });

  it("falls back to its own wording when the failure is not an Error", async () => {
    vi.mocked(createStartup).mockRejectedValue("offline");
    const { result } = renderCreate();

    act(() => result.current.submit());

    await waitFor(() =>
      expect(result.current.error).toBe("Startup oluşturulamadı."),
    );
  });

  it.each([StartupAccess.Pending, StartupAccess.Rejected, StartupAccess.Ready])(
    "sends someone whose startup is %s back to it, since there is nothing to create",
    (access) => {
      accessIs(access);

      renderCreate();

      expect(navigation.replace).toHaveBeenCalledWith("/startup");
    },
  );

  it("does not send the founder away while they have no startup", () => {
    renderCreate();

    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it("leaves the redirect to the success path once the startup is created", async () => {
    const { result, rerender } = renderCreate();
    act(() => result.current.submit());
    await waitFor(() => expect(navigation.push).toHaveBeenCalled());

    accessIs(StartupAccess.Ready);
    rerender();

    expect(navigation.replace).not.toHaveBeenCalled();
  });
});
