import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DeleteUserSection } from "@/components/admin/delete-user-section";
import type { PersonSummary } from "@/interfaces/person-summary";
import { UserAccountStatus, UserRole } from "@/interfaces/session";
import { deleteUserAccount } from "@/lib/client/admin-users";
import { ClientApiError } from "@/lib/client/api";
import { getPersonSummary } from "@/lib/client/person-summary";
import { currentIdToken } from "@/lib/firebase/auth";
import { menteeSummary } from "@test/fixtures/person-summary";
import { renderWithQueryClient } from "@test/test-utils";

const navigation = vi.hoisted(() => ({ replace: vi.fn() }));
const viewer = vi.hoisted(
  (): { session: { userId: string; role: UserRole } | null } => ({
    session: null,
  }),
);

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: navigation.replace }),
}));
vi.mock("@/components/providers/session-provider", () => ({
  useAppSession: () => viewer.session,
}));
vi.mock("@/lib/client/admin-users", () => ({ deleteUserAccount: vi.fn() }));
vi.mock("@/lib/client/person-summary", () => ({ getPersonSummary: vi.fn() }));
vi.mock("@/lib/firebase/auth", () => ({ currentIdToken: vi.fn() }));

function showPerson(overrides: Partial<PersonSummary> = {}) {
  const person = menteeSummary({ id: "user-1", ...overrides });
  vi.mocked(getPersonSummary).mockResolvedValue(person);
  renderWithQueryClient(<DeleteUserSection userId="user-1" />);
  return person;
}

async function openDialog() {
  await userEvent.click(
    await screen.findByRole("button", { name: "Kullanıcıyı sil" }),
  );
  return screen.getByRole("button", { name: "Kalıcı olarak sil" });
}

describe("DeleteUserSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    viewer.session = { userId: "admin-1", role: UserRole.Admin };
    vi.mocked(currentIdToken).mockResolvedValue("id-token");
  });

  it.each([
    ["an admin", { role: UserRole.Admin }],
    [
      "an account that is already deleted",
      { status: UserAccountStatus.Deleted },
    ],
    ["the viewer's own account", { id: "admin-1" }],
  ])("offers nothing for %s", async (_case, overrides) => {
    vi.mocked(getPersonSummary).mockResolvedValue(
      menteeSummary({ id: "user-1", ...overrides }),
    );
    renderWithQueryClient(<DeleteUserSection userId="user-1" />);

    await vi.waitFor(() => expect(getPersonSummary).toHaveBeenCalled());
    expect(
      screen.queryByRole("button", { name: "Kullanıcıyı sil" }),
    ).not.toBeInTheDocument();
  });

  it("deletes only once the typed address matches, then leaves for the user list", async () => {
    const person = showPerson();
    vi.mocked(deleteUserAccount).mockResolvedValue({
      deletedUserId: "user-1",
      cleanupPending: false,
    });

    const confirm = await openDialog();
    expect(screen.getByText(person.email)).toBeInTheDocument();
    expect(confirm).toBeDisabled();

    const input = screen.getByLabelText(
      "Onaylamak için kullanıcının e-postasını yaz",
    );
    await userEvent.type(input, "someone@else.test");
    expect(confirm).toBeDisabled();

    await userEvent.clear(input);
    await userEvent.type(input, ` ${person.email.toUpperCase()} `);
    await userEvent.click(confirm);

    expect(deleteUserAccount).toHaveBeenCalledWith(
      "user-1",
      person.email.toUpperCase(),
      "id-token",
    );
    expect(await screen.findByText("Kullanıcı silindi.")).toBeInTheDocument();
    expect(navigation.replace).toHaveBeenCalledWith("/admin/users");
  });

  it("says when the login and files are still being removed", async () => {
    const person = showPerson();
    vi.mocked(deleteUserAccount).mockResolvedValue({
      deletedUserId: "user-1",
      cleanupPending: true,
    });

    await openDialog();
    await userEvent.type(
      screen.getByLabelText("Onaylamak için kullanıcının e-postasını yaz"),
      person.email,
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Kalıcı olarak sil" }),
    );

    expect(
      await screen.findByText(/arka planda tamamlanacak/),
    ).toBeInTheDocument();
  });

  it("shows the backend's reason and stays on the page when it fails", async () => {
    const person = showPerson();
    vi.mocked(deleteUserAccount).mockRejectedValue(
      new ClientApiError("Yöneticiler silinemez.", 403),
    );

    await openDialog();
    await userEvent.type(
      screen.getByLabelText("Onaylamak için kullanıcının e-postasını yaz"),
      person.email,
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Kalıcı olarak sil" }),
    );

    expect(
      await screen.findByText("Yöneticiler silinemez."),
    ).toBeInTheDocument();
    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it("asks for a fresh sign-in when no Firebase token is available", async () => {
    const person = showPerson();
    vi.mocked(currentIdToken).mockResolvedValue(null);

    await openDialog();
    await userEvent.type(
      screen.getByLabelText("Onaylamak için kullanıcının e-postasını yaz"),
      person.email,
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Kalıcı olarak sil" }),
    );

    expect(
      await screen.findByText("Bu işlem için yeniden giriş yapman gerekiyor."),
    ).toBeInTheDocument();
    expect(deleteUserAccount).not.toHaveBeenCalled();
  });

  it("clears the typed address when cancelled", async () => {
    const person = showPerson();

    await openDialog();
    await userEvent.type(
      screen.getByLabelText("Onaylamak için kullanıcının e-postasını yaz"),
      person.email,
    );
    await userEvent.click(screen.getByRole("button", { name: "Vazgeç" }));
    await openDialog();

    expect(
      screen.getByLabelText("Onaylamak için kullanıcının e-postasını yaz"),
    ).toHaveValue("");
    expect(deleteUserAccount).not.toHaveBeenCalled();
  });

  it("keeps the dialog open on Escape while the deletion is on its way", async () => {
    const person = showPerson();
    let finish: (value: {
      deletedUserId: string;
      cleanupPending: boolean;
    }) => void = () => undefined;
    vi.mocked(deleteUserAccount).mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );

    await openDialog();
    await userEvent.type(
      screen.getByLabelText("Onaylamak için kullanıcının e-postasını yaz"),
      person.email,
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Kalıcı olarak sil" }),
    );
    await screen.findByRole("button", { name: "Siliniyor…" });
    await userEvent.keyboard("{Escape}");

    expect(
      screen.getByRole("dialog", {
        name: "Kullanıcı kalıcı olarak silinsin mi?",
      }),
    ).toBeInTheDocument();
    finish({ deletedUserId: "user-1", cleanupPending: false });
    expect(await screen.findByText("Kullanıcı silindi.")).toBeInTheDocument();
  });

  it("closes on Escape when nothing is running", async () => {
    showPerson();

    await openDialog();
    await userEvent.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("drops the deleted person out of the admin lists", async () => {
    const person = menteeSummary({ id: "user-1" });
    vi.mocked(getPersonSummary).mockResolvedValue(person);
    vi.mocked(deleteUserAccount).mockResolvedValue({
      deletedUserId: "user-1",
      cleanupPending: false,
    });
    const { queryClient } = renderWithQueryClient(
      <DeleteUserSection userId="user-1" />,
    );
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    await openDialog();
    await userEvent.type(
      screen.getByLabelText("Onaylamak için kullanıcının e-postasını yaz"),
      person.email,
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Kalıcı olarak sil" }),
    );

    await screen.findByText("Kullanıcı silindi.");
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["admin-overview"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["admin"] });
  });
});
