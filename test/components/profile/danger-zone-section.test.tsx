import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DangerZoneSection } from "@/components/profile/danger-zone-section";
import {
  AccountDeletionBlock,
  type SelfDeletionOptions,
} from "@/interfaces/self-deletion";
import { UserRole } from "@/interfaces/session";
import { replaceLocation } from "@/lib/assign-location";
import { ClientApiError } from "@/lib/client/api";
import {
  deleteOwnAccount,
  deleteOwnStartup,
  getSelfDeletionOptions,
} from "@/lib/client/self-deletion";
import { currentIdToken, currentSignInTime } from "@/lib/firebase/auth";
import { accountDeletedHref } from "@/lib/self-deletion";
import { renderWithQueryClient } from "@test/test-utils";

const navigation = vi.hoisted(() => ({ replace: vi.fn() }));
const auth = vi.hoisted(
  (): {
    logout: ReturnType<typeof vi.fn>;
    refresh: ReturnType<typeof vi.fn>;
    session: { userId: string; role: UserRole } | null;
  } => ({ logout: vi.fn(), refresh: vi.fn(), session: null }),
);

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: navigation.replace }),
}));
vi.mock("@/components/providers/session-provider", () => ({
  useSession: () => auth,
}));
vi.mock("@/lib/client/self-deletion", () => ({
  deleteOwnAccount: vi.fn(),
  deleteOwnStartup: vi.fn(),
  getSelfDeletionOptions: vi.fn(),
}));
vi.mock("@/lib/firebase/auth", () => ({
  currentIdToken: vi.fn(),
  currentSignInTime: vi.fn(),
}));
vi.mock("@/lib/assign-location", () => ({ replaceLocation: vi.fn() }));

const member: SelfDeletionOptions = {
  account: { allowed: true, blockedReason: null },
  startup: null,
};
const founder: SelfDeletionOptions = {
  account: { allowed: false, blockedReason: AccountDeletionBlock.Founder },
  startup: { id: "org-1", name: "Döngü Labs" },
};

function show(options: SelfDeletionOptions) {
  vi.mocked(getSelfDeletionOptions).mockResolvedValue(options);
  return renderWithQueryClient(<DangerZoneSection />);
}

async function throughTheExplanation(button: string) {
  await userEvent.click(await screen.findByRole("button", { name: button }));
  const dialog = screen.getByRole("dialog");
  await userEvent.click(
    within(dialog).getByRole("button", { name: "Devam et" }),
  );
  return dialog;
}

describe("DangerZoneSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.session = { userId: "user-1", role: UserRole.Mentee };
    auth.logout.mockResolvedValue(undefined);
    auth.refresh.mockResolvedValue(null);
    vi.mocked(currentIdToken).mockResolvedValue("id-token");
    vi.mocked(currentSignInTime).mockResolvedValue(new Date());
  });

  it("offers nothing to a coordinator, and does not even ask", async () => {
    auth.session = { userId: "user-1", role: UserRole.Coordinator };
    renderWithQueryClient(<DangerZoneSection />);

    await Promise.resolve();
    expect(screen.queryByText("Tehlikeli bölge")).not.toBeInTheDocument();
    expect(getSelfDeletionOptions).not.toHaveBeenCalled();
  });

  it("offers nothing when the backend says the person is staff", async () => {
    show({
      account: { allowed: false, blockedReason: AccountDeletionBlock.Staff },
      startup: null,
    });

    await vi.waitFor(() => expect(getSelfDeletionOptions).toHaveBeenCalled());
    expect(screen.queryByText("Tehlikeli bölge")).not.toBeInTheDocument();
  });

  it("explains first, then deletes the account only once SİL is typed, and leaves for the landing page", async () => {
    vi.mocked(deleteOwnAccount).mockResolvedValue({
      deletedUserId: "user-1",
      cleanupPending: false,
    });
    show(member);

    await userEvent.click(
      await screen.findByRole("button", { name: "Hesabımı sil" }),
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("Silinecekler");
    expect(dialog).toHaveTextContent("Kalacaklar");
    expect(dialog).toHaveTextContent("Silinmiş kullanıcı");
    expect(deleteOwnAccount).not.toHaveBeenCalled();

    await userEvent.click(
      within(dialog).getByRole("button", { name: "Devam et" }),
    );
    const confirm = within(dialog).getByRole("button", {
      name: "Hesabımı kalıcı olarak sil",
    });
    expect(confirm).toBeDisabled();
    const input = within(dialog).getByRole("textbox");
    await userEvent.type(input, "SİLL");
    expect(confirm).toBeDisabled();
    await userEvent.clear(input);
    await userEvent.type(input, "sil");
    expect(confirm).toBeEnabled();

    await userEvent.click(confirm);

    await vi.waitFor(() =>
      expect(replaceLocation).toHaveBeenCalledWith(accountDeletedHref()),
    );
    expect(deleteOwnAccount).toHaveBeenCalledWith("sil", "id-token");
    expect(auth.logout).toHaveBeenCalled();
  });

  it("keeps a founder's account button off until the startup is deleted", async () => {
    show(founder);

    const account = await screen.findByRole("button", { name: "Hesabımı sil" });
    expect(account).toBeDisabled();
    expect(
      screen.getByText(/Hesabını silmeden önce startup'ı silmelisin/),
    ).toBeInTheDocument();
  });

  it("deletes the startup only with its exact name, then returns to the profile", async () => {
    vi.mocked(deleteOwnStartup).mockResolvedValue({
      deletedOrganizationId: "org-1",
      cleanupPending: false,
    });
    show(founder);

    const dialog = await throughTheExplanation("Startup'ı sil");
    const confirm = within(dialog).getByRole("button", {
      name: "Startup'ı kalıcı olarak sil",
    });
    const input = within(dialog).getByRole("textbox");
    await userEvent.type(input, "döngü labs");
    expect(confirm).toBeDisabled();
    await userEvent.clear(input);
    await userEvent.type(input, "Döngü Labs");

    await userEvent.click(confirm);

    expect(await screen.findByText("Startup silindi.")).toBeInTheDocument();
    expect(deleteOwnStartup).toHaveBeenCalledWith("Döngü Labs", "id-token");
    await vi.waitFor(() =>
      expect(navigation.replace).toHaveBeenCalledWith("/profile/personal"),
    );
    expect(auth.refresh).toHaveBeenCalled();
    expect(replaceLocation).not.toHaveBeenCalled();
  });

  it("asks for a fresh sign-in when the last one is too old", async () => {
    vi.mocked(currentSignInTime).mockResolvedValue(
      new Date(Date.now() - 60 * 60 * 1000),
    );
    show(member);

    const dialog = await throughTheExplanation("Hesabımı sil");
    expect(within(dialog).queryByRole("textbox")).not.toBeInTheDocument();
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Yeniden giriş yap" }),
    );

    await vi.waitFor(() =>
      expect(replaceLocation).toHaveBeenCalledWith(
        "/login?next=%2Fprofile%2Fpersonal",
      ),
    );
    expect(auth.logout).toHaveBeenCalled();
    expect(deleteOwnAccount).not.toHaveBeenCalled();
  });

  it("switches to the fresh sign-in when the backend finds the sign-in too old", async () => {
    vi.mocked(deleteOwnAccount).mockRejectedValue(
      new ClientApiError("Sign in again", 409, "REAUTH_REQUIRED"),
    );
    show(member);

    const dialog = await throughTheExplanation("Hesabımı sil");
    await userEvent.type(within(dialog).getByRole("textbox"), "SİL");
    await userEvent.click(
      within(dialog).getByRole("button", {
        name: "Hesabımı kalıcı olarak sil",
      }),
    );

    expect(
      await within(dialog).findByRole("button", { name: "Yeniden giriş yap" }),
    ).toBeInTheDocument();
    expect(replaceLocation).not.toHaveBeenCalled();
  });

  it("says so and stays when the deletion fails", async () => {
    vi.mocked(deleteOwnAccount).mockRejectedValue(
      new ClientApiError("Hesap silinemedi.", 502),
    );
    show(member);

    const dialog = await throughTheExplanation("Hesabımı sil");
    await userEvent.type(within(dialog).getByRole("textbox"), "SİL");
    await userEvent.click(
      within(dialog).getByRole("button", {
        name: "Hesabımı kalıcı olarak sil",
      }),
    );

    expect(await screen.findByText("Hesap silinemedi.")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(auth.logout).not.toHaveBeenCalled();
  });

  it("closes on Vazgeç without deleting anything", async () => {
    show(member);

    await userEvent.click(
      await screen.findByRole("button", { name: "Hesabımı sil" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Vazgeç" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(deleteOwnAccount).not.toHaveBeenCalled();
  });
});
