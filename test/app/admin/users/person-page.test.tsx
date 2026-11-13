import { describe, expect, it, vi } from "vitest";

import AdminPersonProfilePage from "@/app/admin/users/[id]/page";
import { DeleteUserSection } from "@/components/admin/delete-user-section";
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
  const [summary, deletion] = page.props.children;
  return { summary, deletion };
}

describe("admin person page", () => {
  it("offers deleting the user in the Teknokent edition", async () => {
    edition.current = Edition.Teknokent;

    const { summary, deletion } = await renderPage();

    expect(summary.type).toBe(PersonSummaryView);
    expect(deletion.type).toBe(DeleteUserSection);
    expect(deletion.props).toEqual({ userId: "user-1" });
  });

  it("shows no deletion in the ODTÜ edition", async () => {
    edition.current = Edition.Odtu;

    const { summary, deletion } = await renderPage();

    expect(summary.type).toBe(PersonSummaryView);
    expect(deletion).toBeNull();
  });
});
