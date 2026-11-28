import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import OfficeHoursLaunchErrorPage from "@/app/office-hours/launch-error/page";
import { OfficeHoursCourseScreen } from "@/components/office-hours/office-hours-course-screen";
import { OfficeHoursRole } from "@/interfaces/office-hours";
import { ClientApiError } from "@/lib/client/api";
import { getOfficeHoursCourse } from "@/lib/client/office-hours";
import { InLocale, renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/office-hours", () => ({ getOfficeHoursCourse: vi.fn() }));
vi.mock("@/components/office-hours/course-office-hours", () => ({
  CourseOfficeHours: ({
    courseId,
    viewer,
  }: {
    courseId: string;
    viewer: string;
  }) => (
    <p>
      booking for {courseId} as {viewer}
    </p>
  ),
}));
const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

function course(role: OfficeHoursRole) {
  return {
    courseId: "course-1",
    title: "Introduction to Computing",
    shortName: "CENG 101",
    role,
    userFullName: "Ali Kaya",
  };
}

function renderCourse() {
  return renderWithQueryClient(
    <InLocale locale="tr">
      <OfficeHoursCourseScreen courseId="course-1" />
    </InLocale>,
  );
}

describe("office-hours course page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows an instructor their course and their office hours", async () => {
    vi.mocked(getOfficeHoursCourse).mockResolvedValue(
      course(OfficeHoursRole.Instructor),
    );

    renderCourse();

    expect(
      await screen.findByRole("heading", { name: "Introduction to Computing" }),
    ).toBeInTheDocument();
    expect(getOfficeHoursCourse).toHaveBeenCalledWith("course-1");
    expect(screen.getByText("CENG 101")).toBeInTheDocument();
    expect(screen.getByText("Akademisyen")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Müsaitliği yönet" }),
    ).toHaveAttribute("href", "/office-hours/profile");
    expect(screen.getByRole("link", { name: "Profilim" })).toHaveAttribute(
      "href",
      "/office-hours/profile",
    );
    expect(
      screen.getByText("booking for course-1 as INSTRUCTOR"),
    ).toBeInTheDocument();
  });

  it("shows a student where they will book, with no profile link", async () => {
    vi.mocked(getOfficeHoursCourse).mockResolvedValue(
      course(OfficeHoursRole.Student),
    );

    renderCourse();

    expect(
      await screen.findByText("booking for course-1 as STUDENT"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Profilim" })).toBeNull();
  });

  // No office-hours session, or a course the person never launched from: Moodle has to launch again.
  it("sends someone it cannot show the course to the explanation", async () => {
    vi.mocked(getOfficeHoursCourse).mockRejectedValue(
      new ClientApiError("gone", 401),
    );

    renderCourse();

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith(
        "/office-hours/launch-error?reason=expired",
      ),
    );
    expect(screen.queryByRole("heading")).toBeNull();
  });
});

describe("office-hours launch error page", () => {
  it("explains a missing course role and how to try again", async () => {
    render(
      await OfficeHoursLaunchErrorPage({
        searchParams: Promise.resolve({ reason: "no-role" }),
      }),
    );

    expect(
      screen.getByRole("heading", {
        name: "Bu derste ofis saatlerine erişimin yok",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/bağlantısını yeniden aç/)).toBeInTheDocument();
  });

  it("falls back to the general explanation for an unknown reason", async () => {
    render(
      await OfficeHoursLaunchErrorPage({
        searchParams: Promise.resolve({ reason: "<script>" }),
      }),
    );

    expect(
      screen.getByRole("heading", { name: "Ofis saatleri şu an açılamadı" }),
    ).toBeInTheDocument();
  });
});
