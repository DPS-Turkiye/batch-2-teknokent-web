import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAppSession } from "@/components/providers/session-provider";
import { useStartupProfileImport } from "@/hooks/use-startup-profile-import";
import {
  ProfileAnalysisType,
  ProfileOcrMode,
} from "@/interfaces/profile-analysis";
import { UserRole, type AppSession } from "@/interfaces/session";
import { ClientApiError } from "@/lib/client/api";
import { uploadProfileAnalysis } from "@/lib/client/profile-analysis";
import { getProfileAnalysisRecord } from "@/lib/client/profile-analysis-records";
import { analysis, profileToolsWrapper } from "@test/fixtures/profile-tools";

vi.mock("@/components/providers/session-provider", () => ({
  useAppSession: vi.fn(),
}));
vi.mock("@/lib/client/profile-analysis-records", () => ({
  getProfileAnalysisRecord: vi.fn(),
}));
vi.mock("@/lib/client/profile-analysis", () => ({
  uploadProfileAnalysis: vi.fn(),
}));
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useAppSession).mockReturnValue({
    role: UserRole.Mentee,
    userId: "me",
    organizationId: "team",
  } as AppSession);
  vi.mocked(getProfileAnalysisRecord).mockRejectedValue(
    new ClientApiError("Missing", 404),
  );
});
describe("startup import guards", () => {
  it("prevents two submissions before React has rendered the pending state", async () => {
    let resolve!: (value: ReturnType<typeof analysis>) => void;
    vi.mocked(uploadProfileAnalysis).mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    const { Wrapper } = profileToolsWrapper();
    const { result } = renderHook(() => useStartupProfileImport(), {
      wrapper: Wrapper,
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => {
      result.current.chooseFile(new File(["pdf"], "pitch.pdf"));
      result.current.setConsent(true);
    });
    let first!: Promise<void>;
    act(() => {
      first = result.current.extract();
      void result.current.extract();
    });
    await waitFor(() => expect(uploadProfileAnalysis).toHaveBeenCalledTimes(1));
    expect(uploadProfileAnalysis).toHaveBeenCalledWith({
      file: expect.any(File),
      profileType: ProfileAnalysisType.Startup,
      ocrMode: ProfileOcrMode.Auto,
      consentAccepted: true,
    });
    await act(async () => {
      resolve(analysis());
      await first;
    });
    expect(result.current.file).toBeNull();
    expect(result.current.consent).toBe(false);
  });
  it("rejects an empty, non-PDF or oversized file before any upload", async () => {
    const { Wrapper } = profileToolsWrapper();
    const { result } = renderHook(() => useStartupProfileImport(), {
      wrapper: Wrapper,
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const large = new File(["pdf"], "large.pdf");
    Object.defineProperty(large, "size", { value: 50 * 1024 * 1024 + 1 });
    for (const file of [
      new File([], "empty.pdf"),
      new File(["text"], "file.txt"),
      large,
    ]) {
      act(() => result.current.chooseFile(file));
      expect(result.current.error).toBe("Choose a PDF up to 50 MB.");
      expect(result.current.file).toBeNull();
    }
    expect(uploadProfileAnalysis).not.toHaveBeenCalled();
  });
});
