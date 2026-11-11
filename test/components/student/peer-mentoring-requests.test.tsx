import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PeerMentoringRequests } from "@/components/student/peer-mentoring-requests";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import {
  PeerTopicCategory,
  type PeerMentoringRequest,
} from "@/interfaces/peer-mentoring";
import { ClientApiError } from "@/lib/client/api";
import {
  getMentorAvailability,
  scheduleMeeting,
} from "@/lib/client/mentor-requests";
import { getPeerMentoringRequests } from "@/lib/client/peer-mentoring";
import { getStudentAppointments } from "@/lib/client/student-appointments";
import { itemAt } from "@test/fixtures/list-assertions";
import { peerAppointment } from "@test/fixtures/student-appointments";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/peer-mentoring", () => ({
  getPeerMentoringRequests: vi.fn(),
}));
vi.mock("@/lib/client/student-appointments", () => ({
  getStudentAppointments: vi.fn(),
}));
vi.mock("@/lib/client/mentor-requests", () => ({
  getMentorAvailability: vi.fn(),
  scheduleMeeting: vi.fn(),
}));

function request(
  id: string,
  mentorName: string,
  status: MentorshipRequestStatus,
): PeerMentoringRequest {
  return {
    id,
    mentor: { userId: `${id}-mentor`, fullName: mentorName, department: null },
    mentee: { userId: "student-1", fullName: "Ayşe Yılmaz", department: null },
    category: PeerTopicCategory.CareerInternship,
    message: "Staj başvurusu için CV'me bakar mısın?",
    status,
    createdAt: "2026-11-05T10:00:00.000Z",
  };
}

const SLOT = {
  id: "slot-1",
  startsAt: "2026-11-12T08:00:00.000Z",
  durationMinutes: 30,
  booked: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getPeerMentoringRequests).mockResolvedValue([
    request("request-1", "Zeynep Demir", MentorshipRequestStatus.Accepted),
    request("request-2", "Mehmet Kaya", MentorshipRequestStatus.Accepted),
    request("request-3", "Deniz Ak", MentorshipRequestStatus.Pending),
    request("request-4", "Selin Uçar", MentorshipRequestStatus.Declined),
  ]);
  vi.mocked(getStudentAppointments).mockResolvedValue([
    peerAppointment({ requestId: "request-2" }),
  ]);
  vi.mocked(getMentorAvailability).mockResolvedValue([SLOT]);
  vi.mocked(scheduleMeeting).mockResolvedValue({
    id: "meeting-9",
    mentorshipRequestId: "request-1",
    scheduledAt: SLOT.startsAt,
    durationMinutes: 30,
    meetLink: null,
    status: "SCHEDULED",
  });
});

const onFindAnother = vi.fn();

function renderMine() {
  return renderWithQueryClient(
    <PeerMentoringRequests onFindAnother={onFindAnother} />,
  );
}

async function activeMentorship(name: string) {
  const active = await screen.findByRole("region", { name: /Aktif mentorluk/ });
  return within(active).getByRole("article", { name });
}

describe("Mentorluk Al › Mentorluklarım", () => {
  it("shows accepted requests as active mentorships, with the next meeting or a way to plan one", async () => {
    renderMine();

    const unbooked = await activeMentorship("Zeynep Demir");
    expect(
      await within(unbooked).findByRole("button", { name: "Görüşme Planla" }),
    ).toBeVisible();
    expect(
      within(unbooked).getByRole("link", { name: "Profili Gör" }),
    ).toHaveAttribute(
      "href",
      "/student/peer-mentoring/mentors/request-1-mentor",
    );

    const booked = await activeMentorship("Mehmet Kaya");
    expect(within(booked).getByText(/^Sıradaki görüşme: /)).toBeVisible();
    expect(
      within(booked).getByRole("link", { name: "Randevuya git" }),
    ).toHaveAttribute("href", "/student/appointments");
    expect(within(booked).queryByRole("button")).toBeNull();
  });

  it("lists the other requests with their status, and offers another mentor after a decline", async () => {
    const user = userEvent.setup();
    renderMine();

    const others = await screen.findByRole("region", { name: /Taleplerim/ });
    const items = within(others).getAllByRole("listitem");
    const pending = itemAt(items, 0);
    const declined = itemAt(items, 1);
    expect(pending).toHaveTextContent("Deniz Ak");
    expect(pending).toHaveTextContent("Onay Bekliyor");
    expect(within(pending).queryByRole("button")).toBeNull();
    expect(declined).toHaveTextContent("Reddedildi");
    await user.click(
      within(declined).getByRole("button", { name: "Başka Mentor Bul" }),
    );
    expect(onFindAnother).toHaveBeenCalledTimes(1);
  });

  it("says so when the student has no request yet", async () => {
    vi.mocked(getPeerMentoringRequests).mockResolvedValueOnce([]);
    renderMine();
    expect(
      await screen.findByText(/Henüz bir mentorluk talebin yok/),
    ).toBeVisible();
  });

  it("books one of the mentor's open times, then refreshes the appointments and closes", async () => {
    const user = userEvent.setup();
    renderMine();
    await user.click(
      await within(await activeMentorship("Zeynep Demir")).findByRole(
        "button",
        { name: "Görüşme Planla" },
      ),
    );

    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByRole("heading", {
        name: "Zeynep Demir ile randevu al",
      }),
    ).toBeVisible();
    expect(getMentorAvailability).toHaveBeenCalledWith("request-1");
    await user.click(
      await within(dialog).findByRole("button", { name: /30 dk/ }),
    );

    expect(scheduleMeeting).toHaveBeenCalledWith({
      id: "request-1",
      slotId: "slot-1",
    });
    expect(await screen.findByText("Randevun oluşturuldu.")).toBeVisible();
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(getStudentAppointments).toHaveBeenCalledTimes(2);
  });

  it("says so when the mentor has no open time, and shows a refused booking", async () => {
    vi.mocked(getMentorAvailability).mockResolvedValueOnce([]);
    const user = userEvent.setup();
    const { unmount } = renderMine();
    await user.click(
      await within(await activeMentorship("Zeynep Demir")).findByRole(
        "button",
        { name: "Görüşme Planla" },
      ),
    );
    expect(
      await screen.findByText(/Mentorunun şu an açık saati yok/),
    ).toBeVisible();
    unmount();

    vi.mocked(scheduleMeeting).mockRejectedValueOnce(
      new ClientApiError(
        "Bu saat az önce doldu. Lütfen başka bir saat seç.",
        400,
      ),
    );
    renderMine();
    await user.click(
      await within(await activeMentorship("Zeynep Demir")).findByRole(
        "button",
        { name: "Görüşme Planla" },
      ),
    );
    const dialog = await screen.findByRole("dialog");
    await user.click(
      await within(dialog).findByRole("button", { name: /30 dk/ }),
    );
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "Bu saat az önce doldu",
    );
    expect(screen.getByRole("dialog")).toBeVisible();
  });
});
