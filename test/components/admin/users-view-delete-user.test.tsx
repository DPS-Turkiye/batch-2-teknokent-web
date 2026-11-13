import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { UsersView } from "@/components/admin/users-view";
import type { AdminOverview, AdminUser } from "@/interfaces/admin-overview";
import { Edition } from "@/interfaces/edition";
import { UserAccountStatus, UserRole } from "@/interfaces/session";
import { deleteUserAccount } from "@/lib/client/admin-users";
import { currentIdToken } from "@/lib/firebase/auth";
import { UserTab } from "@/types/admin-users";
import { renderWithQueryClient } from "@test/test-utils";

type Viewer = { userId: string; role: UserRole; edition: Edition };

// Set by each test; the hoisted mocks run before the imports exist.
const state = vi.hoisted(
  (): { viewer: Viewer | null; edition: Edition | null } => ({
    viewer: null,
    edition: null,
  }),
);

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/admin/users",
}));
vi.mock("@/components/providers/session-provider", () => ({
  useAppSession: () => state.viewer,
}));
vi.mock("@/hooks/use-edition", () => ({ useEdition: () => state.edition }));
vi.mock("@/lib/client/admin-users", () => ({ deleteUserAccount: vi.fn() }));
vi.mock("@/lib/firebase/auth", () => ({ currentIdToken: vi.fn() }));

const person = (overrides: Partial<AdminUser>): AdminUser => ({
  id: "u",
  email: "kisi@example.test",
  fullName: "Kişi",
  role: UserRole.Mentor,
  status: UserAccountStatus.Approved,
  organizationId: null,
  organizationName: null,
  jobTitle: null,
  ...overrides,
});

const overview: AdminOverview = {
  programs: [],
  users: [
    person({ id: "mentor-1", fullName: "Deniz Yıldız", email: "deniz@x.test" }),
    person({
      id: "coord-1",
      fullName: "Okan Yurt",
      email: "okan@x.test",
      role: UserRole.Coordinator,
    }),
  ],
  mentorships: [],
  requests: [],
  bottlenecks: [],
  meetingsLast8Weeks: 0,
};

vi.mock("@/hooks/use-admin-overview", async () => {
  const actual = await vi.importActual<
    typeof import("@/hooks/use-admin-overview")
  >("@/hooks/use-admin-overview");
  return {
    ...actual,
    useAdminOverview: () => ({ data: overview, isLoading: false, error: null }),
  };
});

function signIn(viewer: Partial<Viewer> = {}) {
  state.viewer = {
    userId: "admin-1",
    role: UserRole.Admin,
    edition: Edition.Teknokent,
    ...viewer,
  };
  state.edition = state.viewer.edition;
}

async function openDrawer(tab: UserTab, name: string) {
  const user = userEvent.setup();
  const rendered = renderWithQueryClient(<UsersView tab={tab} />);
  const row = screen.getByText(name).closest('div[class*="border-[#f0f2f4]"]');
  if (!(row instanceof HTMLElement)) throw new Error(`No row for ${name}`);
  await user.click(within(row).getByRole("button", { name: "Detay" }));
  return { user, ...rendered };
}

const deleteAction = () =>
  screen.queryByRole("button", { name: "Kullanıcıyı sil" });

describe("UsersView drawer › Kullanıcıyı sil", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(currentIdToken).mockResolvedValue("id-token");
  });

  it.each([
    ["a mentor", UserTab.Mentors, "Deniz Yıldız"],
    ["a coordinator", UserTab.Coordinators, "Okan Yurt"],
  ])(
    "offers it next to Tüm oturumlarını kapat in %s's drawer",
    async (_who, tab, name) => {
      signIn();
      await openDrawer(tab, name);

      expect(
        screen.getByRole("button", { name: "Tüm oturumlarını kapat" }),
      ).toBeInTheDocument();
      expect(deleteAction()).toBeInTheDocument();
    },
  );

  it.each([
    ["to a coordinator", { role: UserRole.Coordinator }],
    ["on the ODTÜ edition", { edition: Edition.Odtu }],
    ["for the admin's own account", { userId: "coord-1" }],
  ])("is not offered %s", async (_case, viewer) => {
    signIn(viewer);
    await openDrawer(UserTab.Coordinators, "Okan Yurt");

    expect(
      screen.getByRole("button", { name: "Tüm oturumlarını kapat" }),
    ).toBeInTheDocument();
    expect(deleteAction()).not.toBeInTheDocument();
  });

  it("opens the profile page's confirmation, then closes the drawer and refreshes the lists", async () => {
    signIn();
    vi.mocked(deleteUserAccount).mockResolvedValue({
      deletedUserId: "mentor-1",
      cleanupPending: false,
    });
    const { user, queryClient } = await openDrawer(
      UserTab.Mentors,
      "Deniz Yıldız",
    );
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    await user.click(screen.getByRole("button", { name: "Kullanıcıyı sil" }));
    const dialog = screen.getByRole("dialog", {
      name: "Kullanıcı kalıcı olarak silinsin mi?",
    });
    expect(within(dialog).getByText("Silinecekler")).toBeInTheDocument();
    expect(within(dialog).getByText("Kalacaklar")).toBeInTheDocument();
    const confirm = within(dialog).getByRole("button", {
      name: "Kalıcı olarak sil",
    });
    expect(confirm).toBeDisabled();

    await user.type(
      within(dialog).getByLabelText(
        "Onaylamak için kullanıcının e-postasını yaz",
      ),
      "deniz@x.test",
    );
    await user.click(confirm);

    expect(deleteUserAccount).toHaveBeenCalledWith(
      "mentor-1",
      "deniz@x.test",
      "id-token",
    );
    expect(await screen.findByText("Kullanıcı silindi.")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Tüm oturumlarını kapat" }),
    ).not.toBeInTheDocument();
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["admin-overview"] });
  });
});
