import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MeetingProposalCards } from "@/components/meeting-proposal-cards";
import { useMeetingProposals } from "@/hooks/use-meeting-proposals";
import { meetingProposal } from "@test/fixtures/meeting-proposals";
import { InLocale } from "@test/test-utils";

vi.mock("@/hooks/use-meeting-proposals", () => ({
  useMeetingProposals: vi.fn(),
}));

const accept = vi.fn();
const startDecline = vi.fn();
const confirmDecline = vi.fn();

function mockProposals(overrides: Record<string, unknown> = {}) {
  vi.mocked(useMeetingProposals).mockReturnValue({
    proposals: [meetingProposal()],
    isLoading: false,
    accept,
    accepting: null,
    decliningId: null,
    startDecline,
    cancelDecline: vi.fn(),
    reason: "",
    setReason: vi.fn(),
    confirmDecline,
    declining: false,
    error: null,
    ...overrides,
  } as ReturnType<typeof useMeetingProposals>);
}

describe("MeetingProposalCards", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders nothing when no proposal is waiting", () => {
    mockProposals({ proposals: [] });
    const { container } = render(<MeetingProposalCards />);
    expect(container).toBeEmptyDOMElement();
  });

  it("reads in English", () => {
    mockProposals({
      proposals: [
        meetingProposal({ mentorAcceptedAt: "2026-09-27T10:00:00Z" }),
      ],
    });
    render(
      <InLocale locale="en">
        <MeetingProposalCards />
      </InLocale>,
    );

    expect(
      screen.getByRole("region", { name: "Meeting proposals" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Proposed by: Elif Demir/)).toBeInTheDocument();
    expect(
      screen.getByText("Mentor: Accepted · Team: Awaiting reply"),
    ).toBeInTheDocument();
    expect(screen.getByText(/Thursday, October 1/)).toBeInTheDocument();
  });

  it("shows the pair, time, who proposed it and each side's answer", async () => {
    const user = userEvent.setup();
    mockProposals({
      proposals: [
        meetingProposal({ mentorAcceptedAt: "2026-09-27T10:00:00Z" }),
      ],
    });
    render(<MeetingProposalCards />);

    expect(screen.getByText("Ayşe Demir ↔ Lumen")).toBeInTheDocument();
    expect(
      screen.getByText("1 Ekim Perşembe 10:30 · 45 dk"),
    ).toBeInTheDocument();
    expect(screen.getByText(/Öneren: Elif Demir/)).toBeInTheDocument();
    expect(
      screen.getByText("Mentor: Onayladı · Takım: Yanıt bekleniyor"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Onayla" }));
    expect(accept).toHaveBeenCalledWith("proposal-1");
    await user.click(screen.getByRole("button", { name: "Uygun değilim" }));
    expect(startDecline).toHaveBeenCalledWith("proposal-1");
  });

  it("asks for an optional reason before declining", async () => {
    const user = userEvent.setup();
    mockProposals({ decliningId: "proposal-1" });
    render(<MeetingProposalCards />);

    expect(
      screen.queryByRole("button", { name: "Onayla" }),
    ).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Koordinatöre bildir" }),
    );
    expect(confirmDecline).toHaveBeenCalled();
  });

  it("offers no buttons to someone who cannot answer", () => {
    mockProposals({ proposals: [meetingProposal({ canRespond: false })] });
    render(<MeetingProposalCards />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
