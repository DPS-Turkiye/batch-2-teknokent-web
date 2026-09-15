import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import MentorProfilePage from "@/app/mentor-profile/page";
import { useMeetings } from "@/hooks/use-meetings";
import {
  useMentorAvailabilitySettings,
  useMentorProfile,
  useMentorProfileForm,
  useUpdateMentorAvailabilitySettings,
} from "@/hooks/use-mentor-profile";
import { useMentorshipRequests } from "@/hooks/use-mentorship-requests";
import { usePrograms } from "@/hooks/use-programs";
import type {
  MentorAvailabilitySettings,
  MentorProfile,
} from "@/interfaces/mentor";
import { Weekday } from "@/interfaces/mentor";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import { ProgramMentorStatus } from "@/interfaces/program";

const MENTOR_ID = "mentor-1";

vi.mock("@/components/hoc/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/components/providers/session-provider", () => ({
  useAppSession: () => ({ userId: MENTOR_ID }),
}));

vi.mock("@/hooks/use-mentor-profile", () => ({
  useMentorProfile: vi.fn(),
  useMentorProfileForm: vi.fn(),
  useMentorAvailabilitySettings: vi.fn(),
  useUpdateMentorAvailabilitySettings: vi.fn(),
}));

vi.mock("@/hooks/use-mentorship-requests", () => ({
  useMentorshipRequests: vi.fn(),
}));

vi.mock("@/hooks/use-meetings", () => ({ useMeetings: vi.fn() }));
vi.mock("@/hooks/use-programs", () => ({ usePrograms: vi.fn() }));

function profile(overrides: Partial<MentorProfile> = {}): MentorProfile {
  return {
    id: MENTOR_ID,
    fullName: "Nihan Öztürk",
    email: "nihan@teknokent.demo",
    initials: "NÖ",
    professionalTitle: "Design / UX Mentor",
    company: "Döngü Labs",
    availabilityLabel: "Mentorluğa açık",
    responseTimeLabel: "~48 saat",
    meetingMode: "Online",
    communicationPreference: "Mesajlaşma açık",
    mentoringStyle: "İşbirlikçi",
    fitLabel: "Yüksek",
    experienceLevel: "12 yıl",
    sectorExperience: "B2C SaaS",
    startupStages: "MVP & Büyüme",
    specialties: ["UX Stratejisi"],
    recommendationReasons: [],
    recommendationEvidence: [],
    ...overrides,
  };
}

function acceptedRequest(id: string, organizationName: string) {
  return {
    id,
    organizationName,
    requesterName: "Gülse Buran",
    supportArea: "Product & UX Design",
    status: MentorshipRequestStatus.Accepted,
    createdAt: "2026-09-01T09:00:00.000Z",
  };
}

const handleSave = vi.fn();
const updateField = vi.fn();
const addSpecialty = vi.fn();
const removeSpecialty = vi.fn();
const setSpecialtyInput = vi.fn();
const updateCapacity = vi.fn();
const addExperience = vi.fn();
const updateExperience = vi.fn();
const removeExperience = vi.fn();
const updateAvailabilitySettings = vi.fn();

function mockAll(overrides: Record<string, unknown> = {}) {
  const o = {
    profileQuery: { data: profile(), isLoading: false, error: null },
    availability: {
      rules: [
        {
          id: "rule-1",
          dayOfWeek: Weekday.Tuesday,
          startTime: "10:00",
          endTime: "13:00",
          slotMinutes: 45,
        },
      ],
      exceptions: [],
      menteeCapacity: 6,
      defaultMeetingDurationMinutes: 45,
      meetingBufferMinutes: 15,
    } satisfies MentorAvailabilitySettings,
    requests: [acceptedRequest("r1", "Döngü")],
    meetings: [{ id: "m1" }, { id: "m2" }],
    programs: [
      {
        id: "p1",
        name: "METU Stars 2026",
        coordinatorName: "Türkan Yalçın",
        mentors: [
          { mentorId: MENTOR_ID, status: ProgramMentorStatus.Accepted },
        ],
      },
    ],
    form: {},
    ...overrides,
  };

  vi.mocked(useMentorProfile).mockReturnValue(
    o.profileQuery as unknown as ReturnType<typeof useMentorProfile>,
  );
  vi.mocked(useMentorProfileForm).mockReturnValue({
    form: {
      ...profile(),
      menteeCapacity: 6,
      experiences: [
        {
          title: "METU Stars Mentoru",
          organization: "",
          period: "",
          summary: "",
        },
      ],
    },
    specialtyInput: "",
    setSpecialtyInput,
    saveError: "",
    saveSuccess: false,
    isSaving: false,
    updateField,
    addSpecialty,
    removeSpecialty,
    handleSave,
    updateCapacity,
    addExperience,
    updateExperience,
    removeExperience,
    canAddExperience: true,
    ...(o.form as object),
  } as unknown as ReturnType<typeof useMentorProfileForm>);
  vi.mocked(useMentorAvailabilitySettings).mockReturnValue({
    data: o.availability,
    isLoading: false,
  } as unknown as ReturnType<typeof useMentorAvailabilitySettings>);
  vi.mocked(useUpdateMentorAvailabilitySettings).mockReturnValue({
    mutateAsync: updateAvailabilitySettings,
    isPending: false,
  } as unknown as ReturnType<typeof useUpdateMentorAvailabilitySettings>);
  vi.mocked(useMentorshipRequests).mockReturnValue({
    data: o.requests,
    isLoading: false,
  } as unknown as ReturnType<typeof useMentorshipRequests>);
  vi.mocked(useMeetings).mockReturnValue({
    data: o.meetings,
    isLoading: false,
  } as unknown as ReturnType<typeof useMeetings>);
  vi.mocked(usePrograms).mockReturnValue({
    data: o.programs,
    isLoading: false,
  } as unknown as ReturnType<typeof usePrograms>);
  return o;
}

async function openEditor(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Müsaitliği düzenle" }));
  return screen.getByRole("dialog", { name: "Müsaitliği düzenle" });
}

describe("MentorProfilePage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("reports while the profile loads", () => {
    mockAll({
      profileQuery: { data: undefined, isLoading: true, error: null },
    });
    render(<MentorProfilePage />);

    expect(screen.getByText("Yükleniyor...")).toBeInTheDocument();
  });

  it("reports when the profile cannot be loaded", () => {
    mockAll({
      profileQuery: {
        data: undefined,
        isLoading: false,
        error: new Error("x"),
      },
    });
    render(<MentorProfilePage />);

    expect(screen.getByText("Mentor profili yüklenemedi.")).toBeInTheDocument();
  });

  it("renders the mentor's own identity", () => {
    mockAll();
    render(<MentorProfilePage />);

    expect(
      screen.getByRole("heading", { name: "Nihan Öztürk" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Design / UX Mentor · Döngü Labs"),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Mentorluğa açık").length).toBeGreaterThan(0);
  });

  it("counts mentorships, meetings and open slots from real data", () => {
    mockAll();
    render(<MentorProfilePage />);

    expect(screen.getByText("Aktif mentorluk")).toBeInTheDocument();
    expect(screen.getByText("Toplam görüşme")).toBeInTheDocument();
    expect(screen.getByText("Açık saat")).toBeInTheDocument();
  });

  it("edits the profile fields through the form hook", async () => {
    const user = userEvent.setup();
    mockAll();
    render(<MentorProfilePage />);

    await user.click(screen.getByRole("button", { name: "Profili düzenle" }));
    await user.type(screen.getByDisplayValue("Döngü Labs"), "!");
    expect(updateField).toHaveBeenCalled();
  });

  it("saves the profile", async () => {
    const user = userEvent.setup();
    mockAll();
    render(<MentorProfilePage />);

    await user.click(screen.getByRole("button", { name: "Profili düzenle" }));
    await user.click(screen.getByRole("button", { name: "Kaydet" }));
    expect(handleSave).toHaveBeenCalled();
  });

  it("adds and removes a mentoring topic", async () => {
    const user = userEvent.setup();
    mockAll();
    render(<MentorProfilePage />);

    await user.click(screen.getByRole("button", { name: "Profili düzenle" }));
    expect(screen.getByText("UX Stratejisi")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "UX Stratejisi konusunu kaldır" }),
    );
    expect(removeSpecialty).toHaveBeenCalledWith("UX Stratejisi");

    await user.click(screen.getByRole("button", { name: "Ekle" }));
    expect(addSpecialty).toHaveBeenCalled();
  });

  it("lists accepted mentorships as history", () => {
    mockAll();
    render(<MentorProfilePage />);

    expect(screen.getByText("Döngü")).toBeInTheDocument();
    expect(screen.getByText("Product & UX Design")).toBeInTheDocument();
  });

  it("notes an empty mentorship history", () => {
    mockAll({ requests: [] });
    render(<MentorProfilePage />);

    expect(
      screen.getByText("Henüz kabul edilmiş bir mentorluk yok."),
    ).toBeInTheDocument();
  });

  it("shows the mentor's real availability slots", () => {
    mockAll();
    render(<MentorProfilePage />);

    expect(screen.getByText("Salı")).toBeInTheDocument();
  });

  it("notes when no availability is defined", () => {
    mockAll({
      availability: {
        rules: [],
        exceptions: [],
        menteeCapacity: 6,
        defaultMeetingDurationMinutes: 45,
        meetingBufferMinutes: 15,
      },
    });
    render(<MentorProfilePage />);

    expect(screen.getByText("Tanımlı açık saat yok.")).toBeInTheDocument();
  });

  it("lists only the programmes the mentor joined", () => {
    mockAll();
    render(<MentorProfilePage />);

    expect(screen.getAllByText("METU Stars 2026").length).toBeGreaterThan(0);
    expect(screen.getByText("Türkan Yalçın")).toBeInTheDocument();
  });

  it("notes when the mentor joined no programme", () => {
    mockAll({ programs: [] });
    render(<MentorProfilePage />);

    expect(
      screen.getByText("Katıldığınız bir program yok."),
    ).toBeInTheDocument();
  });

  it("saves weekly availability settings from the modal", async () => {
    const user = userEvent.setup();
    mockAll();
    render(<MentorProfilePage />);

    const dialog = await openEditor(user);
    await user.click(within(dialog).getByRole("button", { name: "Kaydet" }));
    expect(updateAvailabilitySettings).toHaveBeenCalled();
  });

  it("closes the availability editor", async () => {
    const user = userEvent.setup();
    mockAll();
    render(<MentorProfilePage />);

    await openEditor(user);
    await user.click(screen.getByRole("button", { name: "Vazgeç" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("edits capacity and past roles through the form hook", async () => {
    const user = userEvent.setup();
    mockAll();
    render(<MentorProfilePage />);

    await user.click(screen.getByRole("button", { name: "Profili düzenle" }));

    const capacity = screen.getByLabelText("Aynı anda en fazla kaç mentee");
    expect(capacity).toHaveValue(6);
    expect(screen.getByDisplayValue("METU Stars Mentoru")).toBeInTheDocument();

    await user.type(capacity, "0");
    expect(updateCapacity).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Deneyim ekle" }));
    expect(addExperience).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Deneyimi kaldır" }));
    expect(removeExperience).toHaveBeenCalledWith(0);
  });
});
