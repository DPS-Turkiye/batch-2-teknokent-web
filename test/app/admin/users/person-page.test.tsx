import { describe, expect, it, vi } from "vitest";

import AdminPersonProfilePage from "@/app/admin/users/[id]/page";
import { ChangeFounderSection } from "@/components/admin/change-founder-section";
import { DeleteUserSection } from "@/components/admin/delete-user-section";
import { MoveMemberSection } from "@/components/admin/move-member-section";
import { PersonSummaryView } from "@/components/people/person-summary-view";
import { Edition } from "@/interfaces/edition";

// Set by each test; the hoisted mock runs before the Edition import exists.
const edition = vi.hoisted((): { current: Edition | null } => ({
  current: null,
}));

vi.mock("next/server", () => ({ connection: () => Promise.resolve() }));
vi.mock("@/lib/server/edition", () => ({
  appEdition: () => edition.current,
}));

async function renderPage() {
  const page = await AdminPersonProfilePage({
    params: Promise.resolve({ id: "user-1" }),
  });
  const [summary, move, founder, deletion] = page.props.children;
  return { summary, move, founder, deletion };
}

describe("admin person page", () => {
  it("offers moving, changing the founder and deleting the user in the Teknokent edition", async () => {
    edition.current = Edition.Teknokent;

    const { summary, move, founder, deletion } = await renderPage();

    expect(summary.type).toBe(PersonSummaryView);
    expect(move.type).toBe(MoveMemberSection);
    expect(move.props).toEqual({ userId: "user-1" });
    expect(founder.type).toBe(ChangeFounderSection);
    expect(founder.props).toEqual({ userId: "user-1" });
    expect(deletion.type).toBe(DeleteUserSection);
    expect(deletion.props).toEqual({ userId: "user-1" });
  });

  it("shows no move, founder change or deletion in the ODTÜ edition", async () => {
    edition.current = Edition.Odtu;

    const { summary, move, founder, deletion } = await renderPage();

    expect(summary.type).toBe(PersonSummaryView);
    expect(move).toBeNull();
    expect(founder).toBeNull();
    expect(deletion).toBeNull();
  });
});
