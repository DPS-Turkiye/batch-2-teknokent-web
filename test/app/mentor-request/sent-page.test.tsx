import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import RequestSentPage from "@/app/mentor-request/sent/page";
import { useMentorshipRequest } from "@/hooks/use-mentorship-requests";

let search = new URLSearchParams();
const redirect = vi.fn();

vi.mock("next/navigation", () => ({
  useSearchParams: () => search,
  redirect: (url: string) => redirect(url),
}));

vi.mock("@/components/hoc/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/hooks/use-mentorship-requests", () => ({
  useMentorshipRequest: vi.fn(),
}));

function mockQuery(value: Record<string, unknown>) {
  vi.mocked(useMentorshipRequest).mockReturnValue({
    data: undefined,
    error: null,
    isLoading: false,
    ...value,
  } as unknown as ReturnType<typeof useMentorshipRequest>);
}

describe("RequestSentPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    search = new URLSearchParams();
  });

  // The page only confirms a request that was just sent.
  it("sends a visit without a request to the sent requests tab", () => {
    mockQuery({});
    render(<RequestSentPage />);

    expect(redirect).toHaveBeenCalledWith("/mentorships?tab=requests");
  });

  it("stays on the page when a request is given", () => {
    search = new URLSearchParams("request=req-1");
    mockQuery({ isLoading: true });
    render(<RequestSentPage />);

    expect(redirect).not.toHaveBeenCalled();
  });

  it("explains a request that could not be found", () => {
    search = new URLSearchParams("request=missing");
    mockQuery({});
    render(<RequestSentPage />);

    expect(screen.queryByText("Talep yükleniyor…")).not.toBeInTheDocument();
    expect(screen.getByText(/Talep bilgisi bulunamadı/)).toBeInTheDocument();
  });

  it("shows the loading state only while the request is being fetched", () => {
    search = new URLSearchParams("request=req-1");
    mockQuery({ isLoading: true });
    render(<RequestSentPage />);

    expect(screen.getByText("Talep yükleniyor…")).toBeInTheDocument();
  });

  it("links withdrawing to the request's status page", () => {
    search = new URLSearchParams("request=req-1");
    mockQuery({ isLoading: true });
    render(<RequestSentPage />);

    expect(
      screen.getByRole("link", { name: "Talebi geri çek" }),
    ).toHaveAttribute("href", "/mentor-request/status?request=req-1");
  });
});
