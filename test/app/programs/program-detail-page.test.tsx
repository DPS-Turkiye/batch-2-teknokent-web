import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ProgramDetailPage from "@/app/programs/[id]/page";
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
  useParams: () => ({ id: "p/1" }),
}));
vi.mock("@/components/programs/program-detail-view", () => ({
  ProgramDetailView: () => <p>program detail</p>,
}));

beforeEach(() => {
  state.replace.mockClear();
  state.isLoading = false;
});

describe("legacy program detail entry", () => {
  it("sends admins to their managed program detail, without showing this one", async () => {
    state.session = appSession({ role: UserRole.Admin });
    render(<ProgramDetailPage />);
    await waitFor(() =>
      expect(state.replace).toHaveBeenCalledWith("/admin/programs/p%2F1"),
    );
    expect(screen.queryByText("program detail")).not.toBeInTheDocument();
  });

  it("keeps mentees and mentors on the program page", () => {
    for (const role of [UserRole.Mentee, UserRole.Mentor]) {
      state.session = appSession({ role });
      const { unmount } = render(<ProgramDetailPage />);
      expect(screen.getByText("program detail")).toBeInTheDocument();
      unmount();
    }
    expect(state.replace).not.toHaveBeenCalled();
  });

  it("shows nothing until the session is known", () => {
    state.session = null;
    state.isLoading = true;
    render(<ProgramDetailPage />);
    expect(screen.queryByText("program detail")).not.toBeInTheDocument();
  });
});
