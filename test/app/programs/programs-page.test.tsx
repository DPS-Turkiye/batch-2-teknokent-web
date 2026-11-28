import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ProgramsPage from "@/app/programs/page";
import { UserRole, type AppSession } from "@/interfaces/session";
import { appSession } from "@test/fixtures/session";

const state = vi.hoisted(() => ({
  session: null as AppSession | null,
  isLoading: false,
  replace: vi.fn(),
}));
vi.mock("@/components/providers/session-provider", () => ({
  useSession: () => ({ session: state.session, isLoading: state.isLoading }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: state.replace }),
  useParams: () => ({}),
}));

beforeEach(() => {
  state.replace.mockClear();
  state.isLoading = false;
});

describe("old /programs page", () => {
  it.each([
    [UserRole.Coordinator, "/coordinator/programs"],
    [UserRole.Admin, "/admin/programs"],
    [UserRole.Mentor, "/mentor-dashboard"],
    [UserRole.Mentee, "/dashboard"],
  ])("sends %s to its current program screen or home", async (role, path) => {
    state.session = appSession({ role });
    render(<ProgramsPage />);
    await waitFor(() => expect(state.replace).toHaveBeenCalledWith(path));
  });

  // The session provider sends a signed-out visitor to log in; the page itself goes nowhere.
  it("waits while the session is unknown or missing", () => {
    state.session = null;
    state.isLoading = true;
    render(<ProgramsPage />);
    expect(state.replace).not.toHaveBeenCalled();
  });
});
