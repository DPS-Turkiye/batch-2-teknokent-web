import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Toaster } from "@/components/common/toaster";
import {
  mentorProfileFormError,
  useMentorProfileForm,
} from "@/hooks/use-mentor-profile";
import {
  MeetingFrequency,
  MentorLanguage,
  PrepFileRequirement,
} from "@/interfaces/mentor";
import { ProgramStatus } from "@/interfaces/program";
import { updateMentorProfile } from "@/lib/client/mentor-profile";
import { withKey } from "@/lib/keyed-list";
import { toMentorCvResult } from "@/lib/mentor-cv";
import { mentorProfile } from "@test/fixtures/mentors";
import { createTestQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/mentor-profile", () => ({
  createAvailabilitySlot: vi.fn(),
  deleteAvailabilitySlot: vi.fn(),
  getMentorAvailability: vi.fn(),
  getMentorProfile: vi.fn(),
  updateMentorProfile: vi.fn(),
}));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      <>
        {children}
        <Toaster />
      </>
    </QueryClientProvider>
  );
}

const baseForm: Parameters<typeof mentorProfileFormError>[0] = {
  professionalTitle: "Mentor",
  company: "Looply",
  availabilityLabel: "",
  responseTimeLabel: "",
  meetingMode: "",
  communicationPreference: "",
  mentoringStyle: "",
  fitLabel: "",
  experienceLevel: "",
  sectorExperience: "",
  startupStages: "",
  specialties: [],
  offerings: [],
  menteeCapacity: null,
  experiences: [],
  educations: [],
  about: "",
  meetingFrequency: null,
  prepFileRequirement: null,
  languages: [],
  programRoles: [],
};

describe("mentorProfileFormError", () => {
  it("accepts no capacity and rejects one outside 1–50", () => {
    expect(mentorProfileFormError(baseForm)).toBe("");
    expect(mentorProfileFormError({ ...baseForm, menteeCapacity: 0 })).toBe(
      "Mentee kapasitesi 1 ile 50 arasında olmalı.",
    );
  });

  it("needs a title on every past role that has anything filled in", () => {
    const role = withKey({
      title: "",
      organization: "Looply",
      period: "",
      summary: "",
    });
    expect(mentorProfileFormError({ ...baseForm, experiences: [role] })).toBe(
      "Her deneyim için bir ünvan gir.",
    );
    expect(
      mentorProfileFormError({
        ...baseForm,
        experiences: [{ ...role, organization: "" }],
      }),
    ).toBe("");
  });

  it("refuses a program role longer than 80 characters", () => {
    expect(
      mentorProfileFormError({
        ...baseForm,
        programRoles: [{ programId: "p1", role: "x".repeat(81) }],
      }),
    ).toBe("Program rolü en fazla 80 karakter olabilir.");
  });
});

describe("useMentorProfileForm meeting preferences, languages and program roles", () => {
  beforeEach(() => vi.clearAllMocks());

  const joined = {
    ...mentorProfile,
    meetingFrequency: MeetingFrequency.Monthly,
    languages: [MentorLanguage.English],
    programs: [
      {
        id: "p1",
        name: "METU Stars 2026",
        status: ProgramStatus.Active,
        role: null,
      },
    ],
  };

  it("starts from the saved choices and one role per joined program", () => {
    const { result } = renderHook(() => useMentorProfileForm(joined), {
      wrapper,
    });

    expect(result.current.form.meetingFrequency).toBe(MeetingFrequency.Monthly);
    expect(result.current.form.prepFileRequirement).toBeNull();
    expect(result.current.form.languages).toEqual([MentorLanguage.English]);
    expect(result.current.form.programRoles).toEqual([
      { programId: "p1", role: "" },
    ]);
    expect(result.current.programRole("p1")).toBe("");
    expect(result.current.programRole("unknown")).toBe("");
  });

  it("keeps languages in list order and sends every choice on save", async () => {
    vi.mocked(updateMentorProfile).mockResolvedValue(mentorProfile);
    const { result } = renderHook(() => useMentorProfileForm(joined), {
      wrapper,
    });

    act(() => {
      result.current.toggleLanguage(MentorLanguage.German);
      result.current.toggleLanguage(MentorLanguage.Turkish);
      result.current.toggleLanguage(MentorLanguage.German);
      result.current.setMeetingFrequency(MeetingFrequency.Biweekly);
      result.current.setPrepFileRequirement(PrepFileRequirement.Required);
      result.current.updateProgramRole("p1", "Design mentor");
    });
    expect(result.current.programRole("p1")).toBe("Design mentor");
    await act(() => result.current.handleSave());

    expect(vi.mocked(updateMentorProfile).mock.calls[0]?.[0]).toMatchObject({
      languages: [MentorLanguage.Turkish, MentorLanguage.English],
      meetingFrequency: MeetingFrequency.Biweekly,
      prepFileRequirement: PrepFileRequirement.Required,
      programRoles: [{ programId: "p1", role: "Design mentor" }],
    });
  });
});

describe("useMentorProfileForm capacity and past roles", () => {
  beforeEach(() => vi.clearAllMocks());

  it("starts from the saved capacity and roles", () => {
    const { result } = renderHook(
      () =>
        useMentorProfileForm({
          ...mentorProfile,
          menteeCapacity: 6,
          experiences: [
            {
              title: "Mentor",
              organization: null,
              period: null,
              summary: null,
            },
          ],
        }),
      { wrapper },
    );

    expect(result.current.form.menteeCapacity).toBe(6);
    expect(result.current.form.experiences).toEqual([
      {
        key: expect.any(String),
        title: "Mentor",
        organization: "",
        period: "",
        summary: "",
      },
    ]);
  });

  it("saves the capacity and drops empty role rows", async () => {
    vi.mocked(updateMentorProfile).mockResolvedValue(mentorProfile);
    const { result } = renderHook(() => useMentorProfileForm(mentorProfile), {
      wrapper,
    });

    act(() => {
      result.current.updateCapacity("5");
      result.current.addExperience();
      result.current.addExperience();
    });
    act(() => result.current.updateExperience(0, "title", "Head of Product"));
    await act(() => result.current.handleSave());

    await waitFor(() => expect(updateMentorProfile).toHaveBeenCalled());
    expect(vi.mocked(updateMentorProfile).mock.calls[0]?.[0]).toMatchObject({
      menteeCapacity: 5,
      experiences: [
        { title: "Head of Product", organization: "", period: "", summary: "" },
      ],
    });
  });

  it("does not save while a role has no title", async () => {
    const { result } = renderHook(() => useMentorProfileForm(mentorProfile), {
      wrapper,
    });

    act(() => result.current.addExperience());
    act(() => result.current.updateExperience(0, "organization", "Looply"));
    await act(() => result.current.handleSave());

    expect(updateMentorProfile).not.toHaveBeenCalled();
    expect(result.current.saveError).toBe("Her deneyim için bir ünvan gir.");
  });

  it("removes a role and clears the capacity", () => {
    const { result } = renderHook(() => useMentorProfileForm(mentorProfile), {
      wrapper,
    });

    act(() => {
      result.current.addExperience();
      result.current.updateCapacity("");
    });
    act(() => result.current.removeExperience(0));

    expect(result.current.form.experiences).toEqual([]);
    expect(result.current.form.menteeCapacity).toBeNull();
  });
});

describe("useMentorProfileForm schools", () => {
  beforeEach(() => vi.mocked(updateMentorProfile).mockReset());

  it("starts from the saved schools and saves edits, dropping empty rows", async () => {
    vi.mocked(updateMentorProfile).mockResolvedValue(mentorProfile);
    const { result } = renderHook(
      () =>
        useMentorProfileForm({
          ...mentorProfile,
          educations: [{ school: "ODTÜ", degree: null, period: "2022 – 2026" }],
        }),
      { wrapper },
    );

    expect(result.current.form.educations).toEqual([
      {
        key: expect.any(String),
        school: "ODTÜ",
        degree: "",
        period: "2022 – 2026",
      },
    ]);
    act(() => {
      result.current.updateEducation(0, "degree", "Lisans, Fizik");
      result.current.addEducation();
    });
    await act(() => result.current.handleSave());

    // toEqual, not toMatchObject: the rows' React keys must not reach the backend.
    expect(
      vi.mocked(updateMentorProfile).mock.calls[0]?.[0].educations,
    ).toEqual([
      { school: "ODTÜ", degree: "Lisans, Fizik", period: "2022 – 2026" },
    ]);
  });

  it("does not save a school row without the school's name", async () => {
    const { result } = renderHook(() => useMentorProfileForm(mentorProfile), {
      wrapper,
    });

    act(() => result.current.addEducation());
    act(() => result.current.updateEducation(0, "degree", "Lisans"));
    await act(() => result.current.handleSave());

    expect(updateMentorProfile).not.toHaveBeenCalled();
    expect(result.current.saveError).toBe("Her okul için bir ad gir.");
    act(() => result.current.removeEducation(0));
    expect(result.current.form.educations).toEqual([]);
  });
});

describe("useMentorProfileForm student studies", () => {
  const studentMentor = {
    ...mentorProfile,
    studentProfile: {
      department: "Bilgisayar Mühendisliği",
      studyYear: "3. sınıf",
      strongCourses: ["CENG 140", "MATH 119"],
      projects: ["Kampüs uygulaması"],
      erasmus: null,
    },
  };

  beforeEach(() => vi.mocked(updateMentorProfile).mockReset());

  it("starts from the saved studies and saves the edits as lists", async () => {
    vi.mocked(updateMentorProfile).mockResolvedValue(studentMentor);
    const { result } = renderHook(() => useMentorProfileForm(studentMentor), {
      wrapper,
    });

    expect(result.current.student).toEqual({
      department: "Bilgisayar Mühendisliği",
      studyYear: "3. sınıf",
      courses: "CENG 140, MATH 119",
      projects: "Kampüs uygulaması",
      erasmus: "",
    });
    act(() => {
      result.current.updateStudent("studyYear", "4. sınıf");
      result.current.updateStudent("erasmus", "TU Delft, 2025 güz");
    });
    await act(() => result.current.handleSave());

    expect(vi.mocked(updateMentorProfile).mock.calls[0]?.[0]).toMatchObject({
      studentProfile: {
        department: "Bilgisayar Mühendisliği",
        studyYear: "4. sınıf",
        strongCourses: ["CENG 140", "MATH 119"],
        projects: ["Kampüs uygulaması"],
        erasmus: "TU Delft, 2025 güz",
      },
    });
  });

  it("never sends studies for a mentor who is not a student", async () => {
    vi.mocked(updateMentorProfile).mockResolvedValue(mentorProfile);
    const { result } = renderHook(() => useMentorProfileForm(mentorProfile), {
      wrapper,
    });

    expect(result.current.student).toBeNull();
    await act(() => result.current.handleSave());

    expect(updateMentorProfile).toHaveBeenCalledOnce();
    expect(
      vi.mocked(updateMentorProfile).mock.calls[0]?.[0],
    ).not.toHaveProperty("studentProfile");
  });

  it("fills the studies from the CV the mentor asked for", () => {
    const { result } = renderHook(() => useMentorProfileForm(studentMentor), {
      wrapper,
    });

    act(() =>
      result.current.applyCv({
        ...toMentorCvResult({}),
        studies: {
          department: "",
          studyYear: "4. sınıf",
          courses: "CENG 213",
          projects: "",
          erasmus: "TU Delft, 2025 güz",
        },
      }),
    );

    expect(result.current.student).toEqual({
      department: "Bilgisayar Mühendisliği",
      studyYear: "4. sınıf",
      courses: "CENG 213",
      projects: "Kampüs uygulaması",
      erasmus: "TU Delft, 2025 güz",
    });
  });

  it("does not save a student mentor without a department", async () => {
    const { result } = renderHook(() => useMentorProfileForm(studentMentor), {
      wrapper,
    });

    act(() => result.current.updateStudent("department", "  "));
    await act(() => result.current.handleSave());

    expect(updateMentorProfile).not.toHaveBeenCalled();
    expect(result.current.saveError).toBe("Bölümünü ve sınıfını gir.");
  });
});
