import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import {
  MeetingProposalPanel,
  ProposeMeetingDialog,
} from "@/components/coordinator/meeting-proposal-panel";
import { MeetingProposalStatus } from "@/interfaces/meeting-proposal";
import {
  meetingProposal,
  mentorshipProposalsStub,
} from "@test/fixtures/meeting-proposals";

describe("MeetingProposalPanel", () => {
  it("offers Görüşme planla when nothing is open", async () => {
    const user = userEvent.setup();
    const proposals = mentorshipProposalsStub();
    render(<MeetingProposalPanel proposals={proposals} />);

    expect(
      screen.getByText("Açık bir görüşme önerisi yok."),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Görüşme planla" }));
    expect(proposals.openComposer).toHaveBeenCalled();
  });

  it("tracks each side's answer on the open proposal, with remind and withdraw", async () => {
    const user = userEvent.setup();
    const proposals = mentorshipProposalsStub({
      open: meetingProposal({ mentorAcceptedAt: "2026-09-27T10:00:00Z" }),
    });
    render(<MeetingProposalPanel proposals={proposals} />);

    expect(screen.getByText("Onayladı")).toBeInTheDocument();
    expect(screen.getByText("Yanıt bekleniyor")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Hatırlat" }));
    await user.click(screen.getByRole("button", { name: "Öneriyi geri çek" }));
    expect(proposals.remind).toHaveBeenCalled();
    expect(proposals.withdraw).toHaveBeenCalled();
  });

  it("shows who declined the last proposal and why", () => {
    render(
      <MeetingProposalPanel
        proposals={mentorshipProposalsStub({
          declined: meetingProposal({
            status: MeetingProposalStatus.Declined,
            declinedByName: "Ayşe Demir",
            declineReason: "Seyahatteyim",
          }),
        })}
      />,
    );

    expect(screen.getByText(/Ayşe Demir,/)).toHaveTextContent("“Seyahatteyim”");
  });
});

describe("ProposeMeetingDialog", () => {
  it("stays closed until the coordinator opens it", () => {
    const { container } = render(
      <ProposeMeetingDialog
        proposals={mentorshipProposalsStub()}
        pairLabel="Ayşe Demir ↔ Lumen"
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("proposes to both sides and shows a failure", async () => {
    const user = userEvent.setup();
    const proposals = mentorshipProposalsStub({
      composing: true,
      proposeError: new Error("Görüşme zamanı gelecekte olmalı."),
    });
    render(
      <ProposeMeetingDialog
        proposals={proposals}
        pairLabel="Ayşe Demir ↔ Lumen"
      />,
    );

    expect(screen.getByLabelText("Tarih ve saat")).toHaveValue(
      "2026-10-01T10:30",
    );
    expect(
      screen.getByText("Görüşme zamanı gelecekte olmalı."),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "İki tarafa öner" }));
    expect(proposals.propose).toHaveBeenCalled();
  });
});
