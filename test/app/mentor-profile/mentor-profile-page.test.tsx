import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import MentorProfilePage from "@/app/mentor-profile/page";
import { useMeetings } from "@/hooks/use-meetings";
import {
  useAvailabilitySettingsForm,
  useMentorAvailabilitySettings,
  useMentorProfile,
  useMentorProfileForm,
} from "@/hooks/use-mentor-profile";
import { useMentorshipRequests } from "@/hooks/use-mentorship-requests";
import { usePrograms } from "@/hooks/use-programs";
import type {
  MentorAvailabilitySettings,
  MentorProfile,
} from "@/interfaces/mentor";
import { WEEKDAY_LABELS, WEEKDAY_ORDER, Weekday } from "@/interfaces/mentor";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import { ProgramMentorStatus } from "@/interfaces/program";
import type { AvailabilityDraft } from "@/lib/mentor-availability";

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
  useAvailabilitySettingsForm: vi.fn(),
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
const saveAndFinish = vi.fn();
const startEditing = vi.fn();
const updateField = vi.fn();
const addSpecialty = vi.fn();
const removeSpecialty = vi.fn();
const setSpecialtyInput = vi.fn();
const updateCapacity = vi.fn();
const addExperience = vi.fn();
const updateExperience = vi.fn();
const removeExperience = vi.fn();

const availabilityActions = {
  addException: vi.fn(),
  addRange: vi.fn(),
  removeException: vi.fn(),
  removeRange: vi.fn(),
  save: vi.fn(),
  setExceptionField: vi.fn(),
  setNumber: vi.fn(),
  toggleDay: vi.fn(),
  updateRange: vi.fn(),
};

const draft: AvailabilityDraft = {
  ranges: [
    {
      key: "rule-1",
      dayOfWeek: Weekday.Tuesday,
      startTime: "10:00",
      endTime: "13:00",
      slotMinutes: 45,
    },
    {
      key: "rule-2",
      dayOfWeek: Weekday.Tuesday,
      startTime: "14:00",
      endTime: "16:00",
      slotMinutes: 45,
    },
  ],
  exceptions: [
    { startsOn: "2026-10-01", endsOn: "2026-10-03", reason: "İzin" },
  ],
  menteeCapacity: "6",
  defaultMeetingDurationMinutes: "45",
  meetingBufferMinutes: "15",
};

function mockAll(overrides: Record<string, unknown> = {}) {
  const o = {
    profileQuery: { data: profile(), isLoading: false, error: null },
    availability: {
      rules: [
        {
          id: "rule-1",
          dayOfWeek: Weekday.Tuesday,
          startTime: "10:00:00",
          endTime: "13:00:00",
          slotMinutes: 45,
        },
      ],
      exceptions: [],
      menteeCapacity: 6,
      defaultMeetingDurationMinutes: 45,
      meetingBufferMinutes: 15,
    } satisfies MentorAvailabilitySettings,
    availabilityForm: {},
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
      about: "",
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
    isEditing: false,
    startEditing,
    saveAndFinish,
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
  vi.mocked(useAvailabilitySettingsForm).mockReturnValue({
    ...availabilityActions,
    days: WEEKDAY_ORDER.map((day) => ({
      day,
      label: WEEKDAY_LABELS[day],
      ranges: draft.ranges.filter((range) => range.dayOfWeek === day),
    })),
    draft,
    error: null,
    exception: { startsOn: "", endsOn: "", reason: "" },
    isSaving: false,
    loadError: null,
    ...(o.availabilityForm as object),
  } as unknown as ReturnType<typeof useAvailabilitySettingsForm>);
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

  it("counts mentorships, meetings and weekly ranges from real data", () => {
    mockAll();
    render(<MentorProfilePage />);

    expect(screen.getByText("Aktif mentorluk")).toBeInTheDocument();
    expect(screen.getByText("Toplam görüşme")).toBeInTheDocument();
    expect(screen.getByText("Haftalık aralık")).toBeInTheDocument();
  });

  it("starts editing without saving", async () => {
    const user = userEvent.setup();
    mockAll();
    render(<MentorProfilePage />);

    expect(screen.getByDisplayValue("Döngü Labs")).toHaveAttribute("readonly");
    await user.click(screen.getByRole("button", { name: "Profili düzenle" }));

    expect(startEditing).toHaveBeenCalled();
    expect(saveAndFinish).not.toHaveBeenCalled();
  });

  it("edits the profile fields through the form hook", async () => {
    const user = userEvent.setup();
    mockAll({ form: { isEditing: true } });
    render(<MentorProfilePage />);

    await user.type(screen.getByDisplayValue("Döngü Labs"), "!");
    expect(updateField).toHaveBeenCalled();
  });

  it("saves the profile and shows why a save was refused", async () => {
    const user = userEvent.setup();
    mockAll({
      form: {
        isEditing: true,
        saveError: "Her deneyim için bir ünvan gir.",
      },
    });
    render(<MentorProfilePage />);

    await user.click(screen.getByRole("button", { name: "Kaydet" }));

    expect(saveAndFinish).toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Her deneyim için bir ünvan gir.",
    );
  });

  it("adds and removes a mentoring topic", async () => {
    const user = userEvent.setup();
    mockAll({ form: { isEditing: true } });
    render(<MentorProfilePage />);

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

  it("shows the weekly availability without seconds", () => {
    mockAll();
    render(<MentorProfilePage />);

    expect(screen.getByText("Salı")).toBeInTheDocument();
    expect(screen.getByText("10:00–13:00")).toBeInTheDocument();
  });

  it("notes when no weekly availability is defined", () => {
    mockAll({
      availability: {
        rules: [],
        exceptions: [],
        menteeCapacity: null,
        defaultMeetingDurationMinutes: 45,
        meetingBufferMinutes: 15,
      },
    });
    render(<MentorProfilePage />);

    expect(screen.getByText("Tanımlı haftalık saat yok.")).toBeInTheDocument();
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

  it("edits several time ranges on one day", async () => {
    const user = userEvent.setup();
    mockAll();
    render(<MentorProfilePage />);

    const dialog = await openEditor(user);
    expect(
      within(dialog).getByLabelText("Salı 2. aralık başlangıç"),
    ).toHaveValue("14:00");

    await user.click(
      within(dialog).getByRole("button", {
        name: "Salı için saat aralığı ekle",
      }),
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Salı 1. aralık kaldır" }),
    );
    await user.click(within(dialog).getByLabelText("Pazartesi uygun"));

    expect(availabilityActions.addRange).toHaveBeenCalledWith(Weekday.Tuesday);
    expect(availabilityActions.removeRange).toHaveBeenCalledWith("rule-1");
    expect(availabilityActions.toggleDay).toHaveBeenCalledWith(Weekday.Monday);
  });

  it("adds and removes unavailable dates", async () => {
    const user = userEvent.setup();
    mockAll();
    render(<MentorProfilePage />);

    const dialog = await openEditor(user);
    await user.click(
      within(dialog).getByRole("button", {
        name: "2026-10-01 – 2026-10-03 · İzin tarihini kaldır",
      }),
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Tarih ekle" }),
    );

    expect(availabilityActions.removeException).toHaveBeenCalledWith(0);
    expect(availabilityActions.addException).toHaveBeenCalled();
  });

  it("saves the settings and shows why they were refused", async () => {
    const user = userEvent.setup();
    mockAll({
      availabilityForm: { error: "Salı: saat aralıkları çakışıyor." },
    });
    render(<MentorProfilePage />);

    const dialog = await openEditor(user);
    await user.click(within(dialog).getByRole("button", { name: "Kaydet" }));

    expect(availabilityActions.save).toHaveBeenCalled();
    expect(within(dialog).getByRole("alert")).toHaveTextContent(
      "Salı: saat aralıkları çakışıyor.",
    );
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
    mockAll({ form: { isEditing: true } });
    render(<MentorProfilePage />);

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
