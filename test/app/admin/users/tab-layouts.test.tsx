import { describe, expect, it, vi } from "vitest";

import AdminAcademicsLayout from "@/app/admin/users/academics/layout";
import AdminMentorsLayout from "@/app/admin/users/mentors/layout";
import AdminStudentsLayout from "@/app/admin/users/students/layout";
import AdminTeamsLayout from "@/app/admin/users/teams/layout";
import { requireAdminUserTab } from "@/lib/server/admin-user-tabs";
import { UserTab } from "@/types/admin-users";

vi.mock("@/lib/server/admin-user-tabs", () => ({
  requireAdminUserTab: vi.fn(async () => {}),
}));

describe("admin Kullanıcılar tab layouts", () => {
  it.each([
    [AdminStudentsLayout, UserTab.Students],
    [AdminAcademicsLayout, UserTab.Academics],
    [AdminMentorsLayout, UserTab.Mentors],
    [AdminTeamsLayout, UserTab.Teams],
  ])(
    "guard their tab on the server before rendering it",
    async (Layout, tab) => {
      const content = <p>tab</p>;

      await expect(Layout({ children: content })).resolves.toBe(content);
      expect(requireAdminUserTab).toHaveBeenLastCalledWith(tab);
    },
  );
});
