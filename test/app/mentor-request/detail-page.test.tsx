import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import MenteeRequestDetailPage from "@/app/mentor-request/detail/page";
import { useMentorshipRequest } from "@/hooks/use-mentorship-requests";
import {
  MentorshipRequestStatus,
  type MentorshipRequest,
} from "@/interfaces/mentorship-request";
import { idleQuery, successQuery } from "@test/mocks/query-results";
import { renderWithQueryClient } from "@test/test-utils";

const { searchParams } = vi.hoisted(() => ({
  searchParams: { current: new URLSearchParams() },
}));

const mockIndividualProgram = vi.fn();

vi.mock("@/hooks/use-individual-program", () => ({
  useIndividualProgram: () => mockIndividualProgram(),
}));

beforeEach(() =>
  mockIndividualProgram.mockReturnValue({
    individual: false,
    isLoading: false,
  }),
);

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParams.current,
}));

vi.mock("@/components/hoc/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/hooks/use-mentorship-requests", () => ({
  useMentorshipRequest: vi.fn(),
}));

const baseRequest: MentorshipRequest = {
  id: "request-1",
  requesterId: "requester-1",
  requesterName: "Sude Yılmaz",
  organizationId: "org-1",
  organizationName: "GreenLoop",
  mentorId: "mentor-1",
  mentorName: "Leyla Aksoy",
  supportArea: "Database Management",
  summary: "Veri modelinde takıldık",
  requesterMessage: "Şema taslağıyla ayrılmak istiyoruz",
  status: MentorshipRequestStatus.Declined,
  mentorMessage: null,
  rejectionReason: "Bu ay doluyum",
  createdAt: "2026-09-28T09:00:00.000Z",
  messages: [],
  recommendationSnapshot: null,
  plannedSessionCount: 3,
};

/** The request loaded, or, with none, the disabled query a missing id leaves. */
function mockRequest(request: MentorshipRequest | undefined) {
  vi.mocked(useMentorshipRequest).mockReturnValue(
    request ? successQuery(request) : idleQuery(),
  );
}

describe("MenteeRequestDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParams.current = new URLSearchParams("id=request-1");
  });

  it("shows what was entered in the request and the other request facts", () => {
    mockRequest(baseRequest);

    renderWithQueryClient(<MenteeRequestDetailPage />);

    expect(useMentorshipRequest).toHaveBeenCalledWith("request-1");
    expect(screen.getByText("Leyla Aksoy")).toBeInTheDocument();
    expect(screen.getByText("Veri modelinde takıldık")).toBeInTheDocument();
    expect(
      screen.getByText("Şema taslağıyla ayrılmak istiyoruz"),
    ).toBeInTheDocument();
    expect(screen.getByText("Mentör uygun değil")).toBeInTheDocument();
    expect(screen.getByText("Sude Yılmaz")).toBeInTheDocument();
    expect(screen.getByText("GreenLoop")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("Bu ay doluyum")).toBeInTheDocument();
    expect(screen.queryByText("Kabul Edildi")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Süreci aç" }),
    ).not.toBeInTheDocument();
  });

  it("leaves out a student's team of one, already named as the requester", () => {
    mockIndividualProgram.mockReturnValue({
      individual: true,
      isLoading: false,
    });
    mockRequest(baseRequest);

    renderWithQueryClient(<MenteeRequestDetailPage />);

    expect(screen.getByText("Sude Yılmaz")).toBeInTheDocument();
    expect(screen.queryByText("GreenLoop")).not.toBeInTheDocument();
    expect(screen.queryByText("Startup")).not.toBeInTheDocument();
  });

  it("asks to pick a request when no id is given", () => {
    searchParams.current = new URLSearchParams();
    mockRequest(undefined);

    renderWithQueryClient(<MenteeRequestDetailPage />);

    expect(
      screen.getByText("Görüntülenecek bir talep seçilmedi."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Taleplerime Git" }),
    ).toHaveAttribute("href", "/mentorships?tab=requests");
  });
});
