import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OtgStartView } from "@/components/login/otg-start-view";
import { InstitutionProvider } from "@/interfaces/institution-login";
import { assignLocation } from "@/lib/assign-location";
import { startInstitutionLogin } from "@/lib/client/institution-login";

const replace = vi.fn();
let searchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => searchParams,
}));
vi.mock("@/lib/client/institution-login", () => ({
  startInstitutionLogin: vi.fn(),
}));
vi.mock("@/lib/assign-location", () => ({ assignLocation: vi.fn() }));

beforeEach(() => {
  vi.clearAllMocks();
  searchParams = new URLSearchParams();
});

describe("OtgStartView", () => {
  it("starts the login from the browser and goes to OTG, keeping an in-app next", async () => {
    searchParams = new URLSearchParams({ next: "/mentors" });
    vi.mocked(startInstitutionLogin).mockResolvedValue({
      redirectUrl: "https://otg.example/auth?state=s",
      state: "s",
    });

    render(<OtgStartView />);

    await waitFor(() =>
      expect(assignLocation).toHaveBeenCalledWith(
        "https://otg.example/auth?state=s",
      ),
    );
    expect(startInstitutionLogin).toHaveBeenCalledWith(
      InstitutionProvider.Otg,
      "/mentors",
    );
  });

  it("goes back to the login page when OTG cannot be reached", async () => {
    searchParams = new URLSearchParams({ next: "/mentors" });
    vi.mocked(startInstitutionLogin).mockRejectedValue(new Error("down"));

    render(<OtgStartView />);

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith("/login?otg=hata&next=%2Fmentors"),
    );
    expect(assignLocation).not.toHaveBeenCalled();
  });

  it("refuses to leave for anything but an https address", async () => {
    vi.mocked(startInstitutionLogin).mockResolvedValue({
      redirectUrl: "/login/odtu/dev?state=s",
      state: "s",
    });

    render(<OtgStartView />);

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith("/login?otg=hata"),
    );
  });
});
