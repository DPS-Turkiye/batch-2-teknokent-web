import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useMeetings } from "@/hooks/use-meetings";
import { useMentorAvailabilitySettings } from "@/hooks/use-mentor-profile";
import { useMentorProfileOverview } from "@/hooks/use-mentor-profile-overview";
import { useMentorRating } from "@/hooks/use-mentor-rating";
import { useMentorshipRequests } from "@/hooks/use-mentorship-requests";
import { MeetingStatus } from "@/interfaces/meeting";
import { MentorLanguage, type MentorProfile } from "@/interfaces/mentor";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import { ProgramStatus } from "@/interfaces/program";

vi.mock("@/hooks/use-meetings", () => ({ useMeetings: vi.fn() }));
vi.mock("@/hooks/use-mentor-rating", () => ({ useMentorRating: vi.fn() }));
vi.mock("@/hooks/use-mentor-profile", () => ({
  useMentorAvailabilitySettings: vi.fn(),
}));
vi.mock("@/hooks/use-mentorship-requests", () => ({
  useMentorshipRequests: vi.fn(),
}));

function profile(overrides: Partial<MentorProfile> = {}): MentorProfile {
  return {
    id: "mentor-1",
    fullName: "Nihan Öztürk",
    email: "nihan@teknokent.demo",
    initials: "NÖ",
    professionalTitle: "Design / UX Mentor",
    company: "",
    availabilityLabel: "",
    responseTimeLabel: "~48 saat",
    meetingMode: "Online",
    communicationPreference: "",
    mentoringStyle: "",
    fitLabel: "",
    experienceLevel: "",
    sectorExperience: "",
    startupStages: "",
    specialties: [],
    recommendationReasons: [],
    recommendationEvidence: [],
    ...overrides,
  };
}

function mockQueries({ loading = false } = {}) {
  vi.mocked(useMeetings).mockReturnValue({
    data: loading
      ? undefined
      : [
          {
            id: "m1",
            organizationId: "org-1",
            mentorshipRequestId: "r1",
            scheduledAt: "2026-06-01T10:00:00Z",
            durationMinutes: 45,
            status: MeetingStatus.Completed,
          },
        ],
    isLoading: loading,
  } as unknown as ReturnType<typeof useMeetings>);
  vi.mocked(useMentorshipRequests).mockReturnValue({
    data: loading
      ? undefined
      : ["r1", "r2", "r3"].map((id) => ({
          id,
          organizationId: "org-1",
          organizationName: "NovaTech",
          mentorId: "mentor-1",
          supportArea: "Product Design",
          status: MentorshipRequestStatus.Accepted,
          createdAt: "2026-03-10T09:00:00Z",
        })),
    isLoading: loading,
  } as unknown as ReturnType<typeof useMentorshipRequests>);
  vi.mocked(useMentorAvailabilitySettings).mockReturnValue({
    data: {
      rules: [],
      exceptions: [],
      menteeCapacity: 5,
      defaultMeetingDurationMinutes: 45,
      meetingBufferMinutes: 15,
    },
    isLoading: false,
  } as unknown as ReturnType<typeof useMentorAvailabilitySettings>);
  vi.mocked(useMentorRating).mockReturnValue({
    data: loading
      ? undefined
      : {
          average: 4.75,
          feedbackCount: 2,
          mentorships: [
            { mentorshipRequestId: "r1", average: 4.5, feedbackCount: 1 },
          ],
        },
    isLoading: loading,
  } as unknown as ReturnType<typeof useMentorRating>);
}

function statValue(stats: { label: string; value: string }[], label: string) {
  return stats.find((stat) => stat.label === label)?.value;
}

describe("useMentorProfileOverview", () => {
  beforeEach(() => vi.clearAllMocks());

  it("counts active and completed mentorships from the profile, not every accepted request", () => {
    mockQueries();
    const { result } = renderHook(() =>
      useMentorProfileOverview(
        profile({ activeMenteeCount: 1, completedMentorshipCount: 2 }),
      ),
    );

    expect(statValue(result.current.stats, "Aktif mentorluk")).toBe("1");
    expect(statValue(result.current.stats, "Tamamlanan")).toBe("2");
    expect(statValue(result.current.stats, "Toplam seans")).toBe("1");
    expect(result.current.capacityLabel).toBe("1 / 5");
    expect(result.current.history).toHaveLength(3);
  });

  it("shows a dash for missing counts and an ellipsis while activity loads", () => {
    mockQueries({ loading: true });
    const { result } = renderHook(() => useMentorProfileOverview(profile()));

    expect(statValue(result.current.stats, "Aktif mentorluk")).toBe("—");
    expect(statValue(result.current.stats, "Tamamlanan")).toBe("—");
    expect(statValue(result.current.stats, "Toplam seans")).toBe("…");
    expect(statValue(result.current.stats, "Mentorluk süresi")).toBe("…");
    expect(result.current.capacityLabel).toBeNull();
    expect(result.current.isHistoryLoading).toBe(true);
  });

  it("describes each joined program and keeps only active ones for the header", () => {
    mockQueries();
    const { result } = renderHook(() =>
      useMentorProfileOverview(
        profile({
          languages: [MentorLanguage.Turkish, MentorLanguage.English],
          programs: [
            {
              id: "p2",
              name: "Kuluçka İzmir 2025",
              status: ProgramStatus.Completed,
              role: null,
            },
            {
              id: "p1",
              name: "METU Stars 2026",
              status: ProgramStatus.Active,
              role: "Design mentor",
            },
          ],
        }),
      ),
    );

    expect(result.current.programs.map((program) => program.detail)).toEqual([
      "Aktif · Design mentor",
      "Tamamlandı",
    ]);
    expect(
      result.current.activePrograms.map((program) => program.name),
    ).toEqual(["METU Stars 2026"]);
    expect(result.current.languages).toBe("Türkçe · İngilizce");
  });

  it("has no programs or languages when the profile has none", () => {
    mockQueries();
    const { result } = renderHook(() => useMentorProfileOverview(profile()));

    expect(result.current.programs).toEqual([]);
    expect(result.current.activePrograms).toEqual([]);
    expect(result.current.languages).toBe("");
  });

  it("shows the mentees' average rating and each mentorship's stars", () => {
    mockQueries();
    const { result } = renderHook(() => useMentorProfileOverview(profile()));

    expect(statValue(result.current.stats, "Ortalama değerlendirme")).toBe(
      "4,8",
    );
    expect(result.current.history.map((row) => row.rating)).toEqual([
      "4,5",
      null,
      null,
    ]);
  });
});
