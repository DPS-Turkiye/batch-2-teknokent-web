import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useSubmittedProfile } from "@/hooks/use-submitted-profile";
import { DocumentKind } from "@/interfaces/startup-document";
import type { UserProfile } from "@/interfaces/user-profile";
import { listDocuments, type StoredDocument } from "@/lib/client/documents";
import { getUserProfile } from "@/lib/client/user-profile";
import { currentIdToken } from "@/lib/firebase/auth";
import { queryWrapper } from "@test/fixtures/query-wrapper";

vi.mock("@/lib/firebase/auth", () => ({ currentIdToken: vi.fn() }));
vi.mock("@/lib/client/user-profile", () => ({ getUserProfile: vi.fn() }));
vi.mock("@/lib/client/documents", () => ({ listDocuments: vi.fn() }));

const profile: UserProfile = {
  id: "user-1",
  fullName: "Ada Kaya",
  email: "ada@acme.test",
  jobTitle: "CEO",
  phone: null,
  bio: null,
  linkedinUrl: null,
  expertise: [],
};
const cv: StoredDocument = {
  id: "doc-1",
  kind: DocumentKind.Cv,
  originalFilename: "cv.pdf",
  sizeBytes: 1200,
};

async function renderLoaded() {
  const view = renderHook(() => useSubmittedProfile(), queryWrapper());
  await waitFor(() => expect(view.result.current.isLoading).toBe(false));
  return view;
}

describe("useSubmittedProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(currentIdToken).mockResolvedValue("id-token");
    vi.mocked(getUserProfile).mockResolvedValue(profile);
    vi.mocked(listDocuments).mockResolvedValue([cv]);
  });

  it("reads back the profile and documents with the Firebase token", async () => {
    const { result } = await renderLoaded();

    expect(getUserProfile).toHaveBeenCalledWith("id-token");
    expect(listDocuments).toHaveBeenCalledWith("id-token");
    expect(result.current.profile).toEqual(profile);
    expect(result.current.documents).toEqual([cv]);
    expect(result.current.isError).toBe(false);
  });

  it("shows nothing and asks nothing when nobody is signed in", async () => {
    vi.mocked(currentIdToken).mockResolvedValue(null);

    const { result } = await renderLoaded();

    expect(getUserProfile).not.toHaveBeenCalled();
    expect(result.current.profile).toBeNull();
    expect(result.current.documents).toEqual([]);
    expect(result.current.isError).toBe(false);
  });

  it("reports an error, without retrying, when either read fails", async () => {
    vi.mocked(listDocuments).mockRejectedValue(new Error("offline"));

    const { result } = await renderLoaded();

    expect(result.current.isError).toBe(true);
    expect(result.current.profile).toBeNull();
    expect(listDocuments).toHaveBeenCalledTimes(1);
  });
});
