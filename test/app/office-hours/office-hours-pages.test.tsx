import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import OfficeHoursCoursePage from "@/app/office-hours/courses/[courseId]/page";
import OfficeHoursLaunchErrorPage from "@/app/office-hours/launch-error/page";
import { OfficeHoursRole } from "@/interfaces/office-hours";
import { fetchOfficeHoursCourse } from "@/lib/api/lti";
import { getOfficeHoursUser } from "@/lib/server/office-hours-session";

vi.mock("@/lib/api/lti", () => ({ fetchOfficeHoursCourse: vi.fn() }));
vi.mock("@/lib/server/office-hours-session", () => ({
  getOfficeHoursUser: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error("REDIRECT:" + path);
  },
}));

const params = { params: Promise.resolve({ courseId: "course-1" }) };

function course(role: OfficeHoursRole) {
  return {
    status: 200,
    headers: {},
    data: {
      courseId: "course-1",
      title: "Introduction to Computing",
      shortName: "CENG 101",
      role,
      userFullName: "Ali Kaya",
    },
  };
}

describe("office-hours course page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getOfficeHoursUser).mockResolvedValue({
      userId: "user-1",
      fullName: "Ali Kaya",
    });
  });

  it("shows an instructor their course and their office hours", async () => {
    vi.mocked(fetchOfficeHoursCourse).mockResolvedValue(
      course(OfficeHoursRole.Instructor),
    );

    render(await OfficeHoursCoursePage(params));

    expect(fetchOfficeHoursCourse).toHaveBeenCalledWith("user-1", "course-1");
    expect(
      screen.getByRole("heading", { name: "Introduction to Computing" }),
    ).toBeInTheDocument();
    expect(screen.getByText("CENG 101")).toBeInTheDocument();
    expect(screen.getByText("Akademisyen")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Müsaitliği yönet" }),
    ).toHaveAttribute("href", "/office-hours/profile");
    expect(screen.getByRole("link", { name: "Profilim" })).toHaveAttribute(
      "href",
      "/office-hours/profile",
    );
    expect(screen.getByText("Ali Kaya")).toBeInTheDocument();
  });

  it("shows a student where they will book", async () => {
    vi.mocked(fetchOfficeHoursCourse).mockResolvedValue(
      course(OfficeHoursRole.Student),
    );

    render(await OfficeHoursCoursePage(params));

    expect(screen.getByText("Öğrenci")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Profilim" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Ofis saati al" }),
    ).toBeInTheDocument();
  });

  it("sends someone without an office-hours session to the explanation", async () => {
    vi.mocked(getOfficeHoursUser).mockResolvedValue(null);

    await expect(OfficeHoursCoursePage(params)).rejects.toThrow(
      "REDIRECT:/office-hours/launch-error?reason=expired",
    );
    expect(fetchOfficeHoursCourse).not.toHaveBeenCalled();
  });

  it("does not show a course the person never launched from", async () => {
    vi.mocked(fetchOfficeHoursCourse).mockResolvedValue({
      status: 404,
      headers: {},
      data: undefined as never,
    });

    await expect(OfficeHoursCoursePage(params)).rejects.toThrow(
      "REDIRECT:/office-hours/launch-error?reason=expired",
    );
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
