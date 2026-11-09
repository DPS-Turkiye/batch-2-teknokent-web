import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OfficeHoursRequestCard } from "@/components/office-hours/office-hours-request-card";
import {
  OfficeHoursMessageType,
  OfficeHoursRequestStatus,
  OfficeHoursRole,
  type OfficeHoursRequest,
} from "@/interfaces/office-hours";
import {
  actOnOfficeHoursRequest,
  getInstructorSlots,
} from "@/lib/client/office-hours-booking";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/office-hours-booking", () => ({
  actOnOfficeHoursRequest: vi.fn(),
  getInstructorSlots: vi.fn(),
}));

function request(
  overrides: Partial<OfficeHoursRequest> = {},
): OfficeHoursRequest {
  return {
    id: "req-1",
    courseId: "course-1",
    status: OfficeHoursRequestStatus.Pending,
    student: { id: "student-1", fullName: "Ayşe Yılmaz" },
    instructor: { id: "academic-1", fullName: "Ali Kaya" },
    topic: "2. ödevin 3. sorusu",
    expectedOutcome: null,
    preferredSlots: ["2026-11-12T09:00", "2026-11-12T10:30"],
    proposedSlots: [],
    instructorMessage: null,
    rejectionReason: null,
    messages: [],
    meeting: null,
    createdAt: "2026-11-07T10:00:00Z",
    ...overrides,
  };
}

describe("OfficeHoursRequestCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(actOnOfficeHoursRequest).mockResolvedValue(request());
    vi.mocked(getInstructorSlots).mockResolvedValue([]);
  });

  it("lets the academic accept one of the student's times", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <OfficeHoursRequestCard
        request={request()}
        viewer={OfficeHoursRole.Instructor}
      />,
    );

    expect(screen.getByText("Ayşe Yılmaz ile")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Kabul et" }));
    await user.click(
      screen.getByRole("radio", { name: "12 Kasım Perşembe · 10:30" }),
    );
    await user.click(screen.getByRole("button", { name: "Gönder" }));

    expect(actOnOfficeHoursRequest).toHaveBeenCalledWith("course-1", "req-1", {
      kind: "decision",
      payload: {
        status: "ACCEPTED",
        slot: "2026-11-12T10:30",
        message: undefined,
      },
    });
  });

  it("lets the academic ask a question only with the question written", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <OfficeHoursRequestCard
        request={request()}
        viewer={OfficeHoursRole.Instructor}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Soru sor" }));
    const send = screen.getByRole("button", { name: "Gönder" });
    expect(send).toBeDisabled();
    await user.type(
      screen.getByRole("textbox", { name: "Öğrenciye sorun" }),
      "Hangi soru?",
    );
    await user.click(send);

    expect(actOnOfficeHoursRequest).toHaveBeenCalledWith("course-1", "req-1", {
      kind: "decision",
      payload: { status: "MORE_INFO_REQUESTED", message: "Hangi soru?" },
    });
  });

  it("lets the student take one of the offered times", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <OfficeHoursRequestCard
        request={request({
          status: OfficeHoursRequestStatus.CounterProposed,
          proposedSlots: ["2026-11-19T09:00"],
          instructorMessage: "Bu saat uygun",
        })}
        viewer={OfficeHoursRole.Student}
      />,
    );

    expect(screen.getByText("Ali Kaya ile")).toBeInTheDocument();
    expect(screen.getByText("Not: Bu saat uygun")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", {
        name: "Bu saati seç: 19 Kasım Perşembe · 09:00",
      }),
    );

    expect(actOnOfficeHoursRequest).toHaveBeenCalledWith("course-1", "req-1", {
      kind: "accept-proposed",
      payload: { slot: "2026-11-19T09:00" },
    });
  });

  it("lets the student answer the academic's question", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <OfficeHoursRequestCard
        request={request({
          status: OfficeHoursRequestStatus.MoreInfoRequested,
          messages: [
            {
              id: "m1",
              authorId: "academic-1",
              type: OfficeHoursMessageType.InstructorQuestion,
              body: "Hangi soru?",
              createdAt: "2026-11-07T11:00:00Z",
            },
          ],
        })}
        viewer={OfficeHoursRole.Student}
      />,
    );

    expect(screen.getByText("Hangi soru?")).toBeInTheDocument();
    await user.type(
      screen.getByRole("textbox", { name: "Cevabını yaz" }),
      "3. soru",
    );
    await user.click(screen.getByRole("button", { name: "Cevabı gönder" }));

    expect(actOnOfficeHoursRequest).toHaveBeenCalledWith("course-1", "req-1", {
      kind: "reply",
      payload: { message: "3. soru" },
    });
  });

  it("shows an accepted request's meeting and no more actions", () => {
    renderWithQueryClient(
      <OfficeHoursRequestCard
        request={request({
          status: OfficeHoursRequestStatus.Accepted,
          meeting: { startsAt: "2026-11-12T07:30:00Z", durationMinutes: 45 },
        })}
        viewer={OfficeHoursRole.Student}
      />,
    );

    expect(screen.getByText("Kabul edildi")).toBeInTheDocument();
    expect(screen.getByText(/Görüşme: 12 Kasım Perşembe/)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Talebi geri çek" }),
    ).not.toBeInTheDocument();
  });

  it("lets the student withdraw an open request", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <OfficeHoursRequestCard
        request={request()}
        viewer={OfficeHoursRole.Student}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Talebi geri çek" }));

    expect(actOnOfficeHoursRequest).toHaveBeenCalledWith("course-1", "req-1", {
      kind: "withdraw",
    });
  });
});
