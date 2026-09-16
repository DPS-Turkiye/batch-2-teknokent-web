import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ToastProvider } from "@/components/providers/toast-provider";
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
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
}

const baseForm = {
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
  menteeCapacity: null,
  experiences: [],
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
    const role = { title: "", organization: "Looply", period: "", summary: "" };
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

    expect(vi.mocked(updateMentorProfile).mock.calls[0][0]).toMatchObject({
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
      { title: "Mentor", organization: "", period: "", summary: "" },
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
    expect(vi.mocked(updateMentorProfile).mock.calls[0][0]).toMatchObject({
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
