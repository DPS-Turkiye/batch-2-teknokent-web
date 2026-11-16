import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useFounderApplication } from "@/hooks/use-founder-application";
import { useSignupWizard } from "@/hooks/use-signup-wizard";
import { DocumentKind } from "@/interfaces/startup-document";
import { registerFounder } from "@/lib/client/auth";
import { uploadDocument } from "@/lib/client/documents";
import {
  clearOnboardingDraft,
  fetchOnboardingDraft,
  saveOnboardingDraft,
} from "@/lib/client/onboarding-draft";
import { backendUser } from "@test/fixtures/session";

vi.mock("@/lib/firebase/auth", () => ({
  currentIdToken: vi.fn().mockResolvedValue("id-token"),
}));
vi.mock("@/lib/client/onboarding-draft", () => ({
  fetchOnboardingDraft: vi.fn(),
  saveOnboardingDraft: vi.fn(),
  clearOnboardingDraft: vi.fn(),
}));
vi.mock("@/lib/client/auth", () => ({ registerFounder: vi.fn() }));
vi.mock("@/lib/client/documents", () => ({ uploadDocument: vi.fn() }));

const account = {
  email: "gulse@dongu.co",
  fullName: "Gülse Buran",
  phone: "",
};

function useApplication() {
  const application = useFounderApplication(account);
  return useSignupWizard({ onSubmit: application.submitApplication });
}

async function renderApplication() {
  const rendered = renderHook(() => useApplication());
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
  act(() => {
    rendered.result.current.updatePersonal("firstName", "Gülse");
    rendered.result.current.updatePersonal("lastName", "Buran");
    rendered.result.current.updatePersonal("cv", {
      name: "cv.pdf",
      size: 10,
      file: new File(["cv"], "cv.pdf", { type: "application/pdf" }),
    });
    rendered.result.current.updateStartup("programId", "program-1");
    rendered.result.current.updateStartup("name", "Döngü");
  });
  return rendered;
}

describe("useFounderApplication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchOnboardingDraft).mockResolvedValue(null);
    vi.mocked(saveOnboardingDraft).mockResolvedValue({
      kind: "signup-wizard",
      step: "1",
      payload: {},
    });
    vi.mocked(clearOnboardingDraft).mockResolvedValue(undefined);
    vi.mocked(registerFounder).mockResolvedValue(backendUser());
  });

  it("drops the saved draft as soon as the account exists, even when a file then fails to upload", async () => {
    vi.mocked(uploadDocument).mockRejectedValue(new Error("Dosya yüklenemedi"));
    const { result } = await renderApplication();

    await act(() => result.current.submit());

    expect(registerFounder).toHaveBeenCalledTimes(1);
    // Left in place, this draft sent the pending founder's next sign-in back into the wizard: the login loop.
    expect(clearOnboardingDraft).toHaveBeenCalledWith("id-token");
    expect(result.current.submitted).toBe(false);
    expect(result.current.submitError).toBe("Dosya yüklenemedi");
  });

  it("retries only the uploads, never a second registration", async () => {
    vi.mocked(uploadDocument)
      .mockRejectedValueOnce(new Error("Dosya yüklenemedi"))
      .mockResolvedValue({
        id: "doc-1",
        kind: DocumentKind.Cv,
        originalFilename: "cv.pdf",
        sizeBytes: 10,
      });
    const { result } = await renderApplication();

    await act(() => result.current.submit());
    await act(() => result.current.submit());

    expect(registerFounder).toHaveBeenCalledTimes(1);
    expect(uploadDocument).toHaveBeenCalledTimes(2);
    expect(result.current.submitted).toBe(true);
    expect(result.current.submitError).toBe("");
  });
});
