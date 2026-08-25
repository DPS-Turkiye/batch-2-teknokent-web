import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MentorDecisionModal } from "@/components/mentor-dashboard/decision-modal";
import {
  MentorDecisionMode,
  MentorshipRequestMessageType,
  MentorshipRequestStatus,
  type MentorshipRequest,
} from "@/interfaces/mentorship-request";

function request(
  overrides: Partial<MentorshipRequest> = {},
): MentorshipRequest {
  return {
    id: "40000000-0000-0000-0000-000000000012",
    requesterId: "requester-1",
    organizationId: "org-1",
    organizationName: "GreenLoop",
    mentorId: "mentor-1",
    mentorName: "Leyla Aksoy",
    supportArea: "İş modeli ve strateji",
    status: MentorshipRequestStatus.Pending,
    mentorMessage: null,
    rejectionReason: null,
    createdAt: "2026-08-17T09:49:54.374504Z",
    messages: [],
    recommendationSnapshot: null,
    ...overrides,
  };
}

function baseProps() {
  return {
    request: request(),
    mode: null as MentorDecisionMode | null,
    message: "",
    selectedSlots: [] as string[],
    isLoadingSlots: false,
    showAvailability: false,
    isPending: false,
    error: "",
    onModeChange: vi.fn(),
    onMessageChange: vi.fn(),
    onClose: vi.fn(),
    onSubmit: vi.fn(),
  };
}

describe("MentorDecisionModal", () => {
  it("shows the request status label and support area", () => {
    render(<MentorDecisionModal {...baseProps()} />);

    expect(screen.getByText("Yanıt Bekliyor")).toBeInTheDocument();
    expect(screen.getByText("İş modeli ve strateji")).toBeInTheDocument();
  });

  it("distinguishes mentor questions from mentee replies in message history", () => {
    render(
      <MentorDecisionModal
        {...baseProps()}
        request={request({
          messages: [
            {
              messageType: MentorshipRequestMessageType.MentorQuestion,
              body: "Bütçeniz nedir?",
            },
            {
              messageType: MentorshipRequestMessageType.MenteeReply,
              body: "50.000 TL",
            },
          ],
        })}
      />,
    );

    expect(screen.getByText("Mentor Sorusu:")).toBeInTheDocument();
    expect(screen.getByText("Bütçeniz nedir?")).toBeInTheDocument();
    expect(screen.getByText("Girişimci Yanıtı:")).toBeInTheDocument();
    expect(screen.getByText("50.000 TL")).toBeInTheDocument();
  });

  it("calls onModeChange when a decision option is clicked", async () => {
    const user = userEvent.setup();
    const onModeChange = vi.fn();

    render(
      <MentorDecisionModal {...baseProps()} onModeChange={onModeChange} />,
    );

    await user.click(screen.getByText("✅ Kabul Et"));

    expect(onModeChange).toHaveBeenCalledWith(MentorDecisionMode.Accept);
  });

  it("disables submit until a mode is selected", () => {
    render(<MentorDecisionModal {...baseProps()} />);

    expect(screen.getByText("Kararı Kaydet & Devam Et →")).toBeDisabled();
  });

  it("shows a message textarea once a mode is chosen", () => {
    render(
      <MentorDecisionModal
        {...baseProps()}
        mode={MentorDecisionMode.Decline}
      />,
    );

    expect(
      screen.getByPlaceholderText("Mesajınızı buraya yazın..."),
    ).toBeInTheDocument();
    expect(screen.getByText("Red Gerekçesi / Açıklama:")).toBeInTheDocument();
  });

  it("renders pre-formatted availability slots in the availability step", () => {
    render(
      <MentorDecisionModal
        {...baseProps()}
        showAvailability
        selectedSlots={["26 Ağustos 2026 08:00 (60 dk)"]}
      />,
    );

    expect(screen.getByText(/60 dk/)).toBeInTheDocument();
  });

  it("shows a loading message while availability is being fetched", () => {
    render(
      <MentorDecisionModal {...baseProps()} showAvailability isLoadingSlots />,
    );

    expect(
      screen.getByText("Müsaitlik bilgileri yükleniyor..."),
    ).toBeInTheDocument();
  });

  it("shows the startup profile section when a recommendation snapshot exists", () => {
    render(
      <MentorDecisionModal
        {...baseProps()}
        request={request({
          recommendationSnapshot: {
            matchingMethod: "semantic",
            matchingModel: "gpt-4o-mini",
            generatedAt: "2026-08-17T09:00:00Z",
            startupName: "GreenLoop",
            startupSector: "ClimateTech",
            startupStage: "Pilot",
            startupSummary: "Atık akışı ve döngüsellik analiz platformu.",
            startupTechnologies: ["IoT", "Python"],
          },
        })}
      />,
    );

    expect(screen.getByText("Girişim Profili")).toBeInTheDocument();
    expect(screen.getByText("ClimateTech")).toBeInTheDocument();
    expect(screen.getByText("Pilot")).toBeInTheDocument();
    expect(
      screen.getByText("Atık akışı ve döngüsellik analiz platformu."),
    ).toBeInTheDocument();
    expect(screen.getByText("IoT")).toBeInTheDocument();
    expect(screen.getByText("Python")).toBeInTheDocument();
  });

  it("does not show the startup profile section when there is no recommendation snapshot", () => {
    render(<MentorDecisionModal {...baseProps()} />);

    expect(screen.queryByText("Girişim Profili")).not.toBeInTheDocument();
  });

  it("shows a fallback message when no availability slots exist", () => {
    render(
      <MentorDecisionModal
        {...baseProps()}
        showAvailability
        selectedSlots={[]}
      />,
    );

    expect(
      screen.getByText(
        "Takviminizde önümüzdeki günler için tanımlı bir müsaitlik bulunamadı.",
      ),
    ).toBeInTheDocument();
  });
});
