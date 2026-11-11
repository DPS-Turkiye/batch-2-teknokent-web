import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProgramDetailView } from "@/components/programs/program-detail-view";
import {
  type ProgramDetail,
  ProgramMentorInvitedBy,
  ProgramMentorStatus,
} from "@/interfaces/program";
import { type AppSession, UserRole } from "@/interfaces/session";
import { getProgramDetail } from "@/lib/client/programs";
import { InLocale, renderWithQueryClient } from "@test/test-utils";

const mockIndividualProgram = vi.fn();

vi.mock("@/hooks/use-individual-program", () => ({
  useIndividualProgram: () => mockIndividualProgram(),
}));

beforeEach(() => {
  mockIndividualProgram.mockReturnValue({
    individual: false,
    isLoading: false,
  });
  mockSession.mockReturnValue(mentee);
});

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "program-1" }),
}));

vi.mock("@/components/hoc/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

const mentee: AppSession = {
  userId: "user-1",
  email: "kisi@example.test",
  fullName: "Örnek Kişi",
  jobTitle: "Kurucu",
  role: UserRole.Mentee,
  organizationId: "org-1",
};
const mockSession = vi.fn<() => AppSession>();

vi.mock("@/components/providers/session-provider", () => ({
  useAppSession: () => mockSession(),
}));

vi.mock("@/lib/client/programs", () => ({
  getProgramDetail: vi.fn(),
}));

const detail: ProgramDetail = {
  id: "program-1",
  name: "METU Stars 2026",
  coordinatorId: "coordinator-1",
  coordinatorName: "Elif Demir",
  createdAt: "2026-09-01T09:00:00Z",
  mentors: [
    {
      mentorId: "mentor-1",
      fullName: "Nihan Öztürk",
      email: "nihan@ozturk.design",
      status: ProgramMentorStatus.Accepted,
      invitedBy: ProgramMentorInvitedBy.Coordinator,
      createdAt: "2026-09-02T09:00:00Z",
    },
  ],
  startups: [
    {
      id: "org-1",
      name: "Atlas AI",
      members: [
        {
          id: "member-1",
          fullName: "Gamze Kozak",
          jobTitle: null,
          founder: true,
        },
      ],
    },
  ],
};

describe("ProgramDetailView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getProgramDetail).mockResolvedValue(detail);
  });

  it("lists the program's coordinator, mentors and startups", async () => {
    renderWithQueryClient(<ProgramDetailView />);

    expect(
      await screen.findByRole("heading", { name: "METU Stars 2026" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Koordinatör")).toBeInTheDocument();
    expect(screen.getByText("1 kişi")).toBeInTheDocument();
    expect(screen.getByText("Kurucu")).toBeInTheDocument();
  });

  it("calls the program's teams participants for a student", async () => {
    mockIndividualProgram.mockReturnValue({
      individual: true,
      isLoading: false,
      programId: "program-1",
    });
    renderWithQueryClient(<ProgramDetailView />);

    expect(
      await screen.findByRole("heading", { name: "Katılımcılar" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Startuplar" }),
    ).not.toBeInTheDocument();
  });

  it("keeps Startuplar on another program than the student's own", async () => {
    mockIndividualProgram.mockReturnValue({
      individual: true,
      isLoading: false,
      programId: "program-2",
    });
    renderWithQueryClient(<ProgramDetailView />);

    expect(
      await screen.findByRole("heading", { name: "Startuplar" }),
    ).toBeInTheDocument();
  });

  it("links a mentee's teammates and the coordinator, not other teams' members", async () => {
    vi.mocked(getProgramDetail).mockResolvedValue({
      ...detail,
      startups: [
        ...detail.startups,
        {
          id: "org-2",
          name: "Başka Girişim",
          members: [
            {
              id: "member-2",
              fullName: "Deniz Yıldız",
              jobTitle: null,
              founder: false,
            },
          ],
        },
      ],
    });
    renderWithQueryClient(<ProgramDetailView />);

    expect(
      await screen.findByRole("link", { name: /Gamze Kozak/ }),
    ).toHaveAttribute("href", "/people/member-1");
    expect(screen.getByRole("link", { name: /Elif Demir/ })).toHaveAttribute(
      "href",
      "/people/coordinator-1",
    );
    expect(screen.getByText("Deniz Yıldız")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Deniz Yıldız/ }),
    ).not.toBeInTheDocument();
  });

  it("reads in English", async () => {
    renderWithQueryClient(
      <InLocale locale="en">
        <ProgramDetailView />
      </InLocale>,
    );

    expect(await screen.findByText("Coordinator")).toBeInTheDocument();
    expect(screen.getByText("My programs")).toBeInTheDocument();
    expect(screen.getByText("1 person")).toBeInTheDocument();
    expect(screen.getByText("Founder")).toBeInTheDocument();
  });
});
