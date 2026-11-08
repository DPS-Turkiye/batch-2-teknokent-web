import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CourseOfficeHours } from "@/components/office-hours/course-office-hours";
import { OfficeHoursRole } from "@/interfaces/office-hours";
import {
  createOfficeHoursRequest,
  getCourseInstructors,
  getInstructorSlots,
  getOfficeHoursMeetings,
  getOfficeHoursRequests,
} from "@/lib/client/office-hours-booking";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/office-hours-booking", () => ({
  getCourseInstructors: vi.fn(),
  getInstructorSlots: vi.fn(),
  getOfficeHoursMeetings: vi.fn(),
  getOfficeHoursRequests: vi.fn(),
  createOfficeHoursRequest: vi.fn(),
  actOnOfficeHoursRequest: vi.fn(),
}));

describe("CourseOfficeHours", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCourseInstructors).mockResolvedValue([
      { id: "academic-1", fullName: "Ali Kaya" },
    ]);
    vi.mocked(getInstructorSlots).mockResolvedValue([]);
    vi.mocked(getOfficeHoursMeetings).mockResolvedValue([]);
    vi.mocked(getOfficeHoursRequests).mockResolvedValue([]);
  });

  it("shows a student the course's academics and sends a request with a typed time", async () => {
    const user = userEvent.setup();
    vi.mocked(createOfficeHoursRequest).mockResolvedValue({} as never);
    renderWithQueryClient(
      <CourseOfficeHours
        courseId="course-1"
        viewer={OfficeHoursRole.Student}
      />,
    );

    await user.click(
      await screen.findByRole("button", { name: "Ofis saati talep et" }),
    );
    expect(
      await screen.findByRole("heading", {
        name: "Ali Kaya ile ofis saati planla",
      }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Talep gönder" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Görüşmek istediğin konuyu yaz.",
    );

    await user.type(
      screen.getByPlaceholderText("Örn. 2. ödevdeki 3. soruda takıldım."),
      "Ödev 2",
    );
    const day = screen.getByRole("combobox", { name: "1. tercih günü" });
    const lastDay = [...day.querySelectorAll("option")].at(-1)!.value;
    await user.selectOptions(day, lastDay);
    await user.type(screen.getByLabelText("1. tercih saati"), "14:00");
    await user.click(screen.getByRole("button", { name: "Talep gönder" }));

    expect(createOfficeHoursRequest).toHaveBeenCalledWith("course-1", {
      instructorId: "academic-1",
      topic: "Ödev 2",
      expectedOutcome: undefined,
      preferredSlots: [`${lastDay}T14:00`],
    });
  });

  it("shows an academic the requests sent to them, without the academics list", async () => {
    renderWithQueryClient(
      <CourseOfficeHours
        courseId="course-1"
        viewer={OfficeHoursRole.Instructor}
      />,
    );

    expect(
      await screen.findByRole("heading", { name: "Gelen talepler" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Dersin akademisyenleri" }),
    ).not.toBeInTheDocument();
    expect(await screen.findByText("Henüz talep yok.")).toBeInTheDocument();
  });

  it("says each list it could not load on its own, and an empty one as empty", async () => {
    vi.mocked(getCourseInstructors).mockRejectedValue(new Error("down"));
    renderWithQueryClient(
      <CourseOfficeHours
        courseId="course-1"
        viewer={OfficeHoursRole.Student}
      />,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Yüklenemedi. Sayfayı yenilemeyi dene.",
    );
    expect(
      await screen.findByText("Yaklaşan görüşme yok."),
    ).toBeInTheDocument();
    expect(screen.getByText("Henüz talep yok.")).toBeInTheDocument();
  });
});
