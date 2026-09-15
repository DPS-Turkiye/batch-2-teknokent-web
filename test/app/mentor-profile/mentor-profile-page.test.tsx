import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import MentorProfilePage from "@/app/mentor-profile/page";
import {
  useAvailabilitySettingsForm,
  useMentorProfile,
  useMentorProfileForm,
} from "@/hooks/use-mentor-profile";
import { useMentorProfileOverview } from "@/hooks/use-mentor-profile-overview";
import type { MentorProfile } from "@/interfaces/mentor";
import { WEEKDAY_LABELS, WEEKDAY_ORDER, Weekday } from "@/interfaces/mentor";
import type { AvailabilityDraft } from "@/lib/mentor-availability";

vi.mock("@/components/hoc/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/hooks/use-mentor-profile", () => ({
  useMentorProfile: vi.fn(),
  useMentorProfileForm: vi.fn(),
  useAvailabilitySettingsForm: vi.fn(),
}));

vi.mock("@/hooks/use-mentor-profile-overview", () => ({
  useMentorProfileOverview: vi.fn(),
}));

function profile(overrides: Partial<MentorProfile> = {}): MentorProfile {
  return {
    id: "mentor-1",
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

const formActions = {
  addExperience: vi.fn(),
  addSpecialty: vi.fn(),
  cancelEditing: vi.fn(),
  handleSave: vi.fn(),
  removeExperience: vi.fn(),
  removeSpecialty: vi.fn(),
  saveAndFinish: vi.fn(),
  setSpecialtyInput: vi.fn(),
  startEditing: vi.fn(),
  updateCapacity: vi.fn(),
  updateExperience: vi.fn(),
  updateField: vi.fn(),
};

const availabilityActions = {
  addException: vi.fn(),
  addRange: vi.fn(),
  closeExceptionForm: vi.fn(),
  openExceptionForm: vi.fn(),
  removeException: vi.fn(),
  removeRange: vi.fn(),
  save: vi.fn(),
  setExceptionField: vi.fn(),
  setNumber: vi.fn(),
  stepNumber: vi.fn(),
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
  menteeCapacity: "5",
  defaultMeetingDurationMinutes: "45",
  meetingBufferMinutes: "15",
};

const overview = {
  subtitle: "Design / UX Mentor · 12 yıl",
  programs: [
    {
      id: "p1",
      name: "METU Stars 2026",
      coordinatorName: "Türkan Yalçın",
      coordinatorId: "c1",
      createdAt: "2026-01-01T00:00:00Z",
      startups: [],
      mentors: [],
    },
  ],
  stats: [
    { label: "Aktif mentorluk", value: "4" },
    { label: "Tamamlanan", value: "7" },
    { label: "Toplam seans", value: "62" },
    { label: "Ortalama yanıt süresi", value: "~48 saat" },
    { label: "Mentorluk süresi", value: "2 yıl" },
  ],
  weeklyAvailability: [
    { label: "Salı", value: "10:00–13:00, 14:00–16:00" },
    { label: "Diğer günler", value: "Kapalı" },
  ],
  capacityLabel: "4 / 5",
  isAvailabilityLoading: false,
  preferences: [
    { label: "Varsayılan süre", value: "45 dk" },
    { label: "Format", value: "Online" },
  ],
  workingStyle: ["Her mentorluk 5 aşamada ilerler"],
  history: [
    {
      id: "r1",
      title: "NovaTech · Zeynep Er",
      detail: "Mar – Haz 2026 · 8 seans",
    },
  ],
};

function mockAll(
  overrides: {
    profileQuery?: object;
    form?: object;
    overview?: object;
    availabilityForm?: object;
  } = {},
) {
  vi.mocked(useMentorProfile).mockReturnValue({
    data: profile(),
    isLoading: false,
    error: null,
    ...overrides.profileQuery,
  } as unknown as ReturnType<typeof useMentorProfile>);
  vi.mocked(useMentorProfileForm).mockReturnValue({
    ...formActions,
    form: {
      ...profile(),
      about: "Erken aşama ürün ekipleriyle çalışıyorum.",
      menteeCapacity: 5,
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
    saveError: "",
    saveSuccess: false,
    isSaving: false,
    isEditing: false,
    canAddExperience: true,
    ...overrides.form,
  } as unknown as ReturnType<typeof useMentorProfileForm>);
  vi.mocked(useMentorProfileOverview).mockReturnValue({
    ...overview,
    ...overrides.overview,
  } as unknown as ReturnType<typeof useMentorProfileOverview>);
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
    isAddingException: false,
    isSaving: false,
    loadError: null,
    ...overrides.availabilityForm,
  } as unknown as ReturnType<typeof useAvailabilitySettingsForm>);
}

async function openEditor(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Müsaitliği düzenle" }));
  return screen.getByRole("dialog", { name: "Müsaitliği düzenle" });
}

describe("MentorProfilePage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("reports while the profile loads, and when it cannot be loaded", () => {
    mockAll({ profileQuery: { data: undefined, isLoading: true } });
    const { unmount } = render(<MentorProfilePage />);
    expect(screen.getByText("Yükleniyor...")).toBeInTheDocument();
    unmount();

    mockAll({ profileQuery: { data: undefined, error: new Error("x") } });
    render(<MentorProfilePage />);
    expect(screen.getByText("Mentor profili yüklenemedi.")).toBeInTheDocument();
  });

  it("introduces the mentor with their programs and availability", () => {
    mockAll();
    render(<MentorProfilePage />);

    expect(
      screen.getByRole("heading", { name: "Nihan Öztürk" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Design / UX Mentor · 12 yıl")).toBeInTheDocument();
    expect(screen.getAllByText("METU Stars 2026")).toHaveLength(2);
    expect(screen.getByText("Mentorluğa açık")).toBeInTheDocument();
  });

  it("shows the five summary figures", () => {
    mockAll();
    render(<MentorProfilePage />);

    const summary = within(
      screen.getByRole("region", { name: "Mentorluk özeti" }),
    );
    for (const stat of overview.stats) {
      expect(summary.getByText(stat.label)).toBeInTheDocument();
      expect(summary.getByText(stat.value)).toBeInTheDocument();
    }
  });

  it("reads the profile without any form fields", () => {
    mockAll();
    render(<MentorProfilePage />);

    expect(
      screen.getByText("Erken aşama ürün ekipleriyle çalışıyorum."),
    ).toBeInTheDocument();
    expect(screen.getByText("UX Stratejisi")).toBeInTheDocument();
    expect(
      screen.getByText("Her mentorluk 5 aşamada ilerler"),
    ).toBeInTheDocument();
    expect(screen.getByText("NovaTech · Zeynep Er")).toBeInTheDocument();
    expect(screen.getByText("Mar – Haz 2026 · 8 seans")).toBeInTheDocument();
    expect(screen.getByText("45 dk")).toBeInTheDocument();
    expect(screen.getByText("Koordinatör: Türkan Yalçın")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("lists the weekly availability and the mentee load", () => {
    mockAll();
    render(<MentorProfilePage />);

    expect(
      screen.getByText("Tekrarlayan haftalık uygunluk"),
    ).toBeInTheDocument();
    expect(screen.getByText("10:00–13:00, 14:00–16:00")).toBeInTheDocument();
    expect(screen.getByText("Diğer günler")).toBeInTheDocument();
    expect(screen.getByText("Eş zamanlı mentorluk")).toBeInTheDocument();
    expect(screen.getByText("4 / 5")).toBeInTheDocument();
  });

  it("notes what is still empty", () => {
    mockAll({
      overview: {
        weeklyAvailability: [],
        capacityLabel: null,
        history: [],
        programs: [],
        workingStyle: [],
        preferences: [],
      },
    });
    render(<MentorProfilePage />);

    expect(screen.getByText("Tanımlı haftalık saat yok.")).toBeInTheDocument();
    expect(
      screen.getByText("Henüz kabul edilmiş bir mentorluk yok."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Katıldığınız bir program yok."),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Henüz bilgi eklenmedi.")).toHaveLength(2);
  });

  it("starts editing from the header or from a section", async () => {
    const user = userEvent.setup();
    mockAll();
    render(<MentorProfilePage />);

    await user.click(screen.getByRole("button", { name: "Profili düzenle" }));
    await user.click(screen.getByRole("button", { name: "Hakkında düzenle" }));
    await user.click(
      screen.getByRole("button", { name: "Görüşme tercihleri düzenle" }),
    );

    expect(formActions.startEditing).toHaveBeenCalledTimes(3);
    expect(formActions.saveAndFinish).not.toHaveBeenCalled();
  });

  it("edits the text sections through the form hook", async () => {
    const user = userEvent.setup();
    mockAll({ form: { isEditing: true } });
    render(<MentorProfilePage />);

    expect(
      screen.queryByRole("button", { name: "Hakkında düzenle" }),
    ).not.toBeInTheDocument();
    await user.type(screen.getByLabelText("Şirket"), "!");
    await user.type(screen.getByLabelText("Format"), "!");
    await user.type(
      screen.getByLabelText("Çalışma şekli (her satır bir madde)"),
      "!",
    );

    expect(formActions.updateField).toHaveBeenCalledWith(
      "company",
      "Döngü Labs!",
    );
    expect(formActions.updateField).toHaveBeenCalledWith(
      "meetingMode",
      "Online!",
    );
    expect(formActions.updateField).toHaveBeenCalledWith(
      "mentoringStyle",
      "İşbirlikçi!",
    );
  });

  it("saves or discards the edit, and shows why a save was refused", async () => {
    const user = userEvent.setup();
    mockAll({
      form: { isEditing: true, saveError: "Her deneyim için bir ünvan gir." },
    });
    render(<MentorProfilePage />);

    await user.click(screen.getByRole("button", { name: "Kaydet" }));
    await user.click(screen.getByRole("button", { name: "Vazgeç" }));

    expect(formActions.saveAndFinish).toHaveBeenCalled();
    expect(formActions.cancelEditing).toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Her deneyim için bir ünvan gir.",
    );
  });

  it("adds and removes topics and past roles while editing", async () => {
    const user = userEvent.setup();
    mockAll({ form: { isEditing: true } });
    render(<MentorProfilePage />);

    await user.click(
      screen.getByRole("button", { name: "UX Stratejisi konusunu kaldır" }),
    );
    await user.click(screen.getByRole("button", { name: "Ekle" }));
    expect(screen.getByDisplayValue("METU Stars Mentoru")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Deneyim ekle" }));
    await user.click(screen.getByRole("button", { name: "Deneyimi kaldır" }));

    expect(formActions.removeSpecialty).toHaveBeenCalledWith("UX Stratejisi");
    expect(formActions.addSpecialty).toHaveBeenCalled();
    expect(formActions.addExperience).toHaveBeenCalled();
    expect(formActions.removeExperience).toHaveBeenCalledWith(0);
  });

  it("switches days and edits several ranges in the availability editor", async () => {
    const user = userEvent.setup();
    mockAll();
    render(<MentorProfilePage />);

    const dialog = within(await openEditor(user));
    expect(dialog.getByRole("switch", { name: "Salı uygun" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(dialog.getByLabelText("Salı 2. aralık başlangıç")).toHaveValue(
      "14:00",
    );

    await user.click(dialog.getByRole("switch", { name: "Pazartesi uygun" }));
    await user.click(
      dialog.getByRole("button", { name: "Salı için saat aralığı ekle" }),
    );
    await user.click(
      dialog.getByRole("button", { name: "Salı 2. aralık kaldır" }),
    );

    expect(availabilityActions.toggleDay).toHaveBeenCalledWith(Weekday.Monday);
    expect(availabilityActions.addRange).toHaveBeenCalledWith(Weekday.Tuesday);
    expect(availabilityActions.removeRange).toHaveBeenCalledWith("rule-2");
  });

  it("steps and types the capacity and defaults", async () => {
    const user = userEvent.setup();
    mockAll();
    render(<MentorProfilePage />);

    const dialog = within(await openEditor(user));
    await user.click(
      dialog.getByRole("button", { name: "Eş zamanlı mentorluk limiti artır" }),
    );
    await user.click(
      dialog.getByRole("button", { name: "Varsayılan görüşme süresi azalt" }),
    );
    await user.type(
      dialog.getByRole("spinbutton", { name: "İki görüşme arası tampon" }),
      "0",
    );

    expect(availabilityActions.stepNumber).toHaveBeenCalledWith(
      "menteeCapacity",
      1,
    );
    expect(availabilityActions.stepNumber).toHaveBeenCalledWith(
      "defaultMeetingDurationMinutes",
      -1,
    );
    expect(availabilityActions.setNumber).toHaveBeenCalledWith(
      "meetingBufferMinutes",
      "150",
    );
  });

  it("shows unavailable dates as chips and opens the date form", async () => {
    const user = userEvent.setup();
    mockAll();
    render(<MentorProfilePage />);

    const dialog = within(await openEditor(user));
    await user.click(
      dialog.getByRole("button", {
        name: /^1–3 Ekim( 2026)? · İzin tarihini kaldır$/,
      }),
    );
    await user.click(dialog.getByRole("button", { name: "Tarih ekle" }));

    expect(availabilityActions.removeException).toHaveBeenCalledWith(0);
    expect(availabilityActions.openExceptionForm).toHaveBeenCalled();
  });

  it("adds or cancels a date from the open form", async () => {
    const user = userEvent.setup();
    mockAll({ availabilityForm: { isAddingException: true } });
    render(<MentorProfilePage />);

    const dialog = within(await openEditor(user));
    expect(
      dialog.queryByRole("button", { name: "Tarih ekle" }),
    ).not.toBeInTheDocument();
    await user.type(dialog.getByLabelText("İstisna nedeni"), "K");
    await user.click(dialog.getByRole("button", { name: "Tarihi ekle" }));
    await user.click(dialog.getByRole("button", { name: "İptal" }));

    expect(availabilityActions.setExceptionField).toHaveBeenCalledWith(
      "reason",
      "K",
    );
    expect(availabilityActions.addException).toHaveBeenCalled();
    expect(availabilityActions.closeExceptionForm).toHaveBeenCalled();
  });

  it("saves the settings and shows why they were refused", async () => {
    const user = userEvent.setup();
    mockAll({
      availabilityForm: { error: "Salı: saat aralıkları çakışıyor." },
    });
    render(<MentorProfilePage />);

    const dialog = within(await openEditor(user));
    await user.click(dialog.getByRole("button", { name: "Kaydet" }));

    expect(availabilityActions.save).toHaveBeenCalled();
    expect(dialog.getByRole("alert")).toHaveTextContent(
      "Salı: saat aralıkları çakışıyor.",
    );
  });

  it("opens the editor from the availability card and closes it with Vazgeç", async () => {
    const user = userEvent.setup();
    mockAll();
    render(<MentorProfilePage />);

    await user.click(screen.getByRole("button", { name: "Müsaitlik düzenle" }));
    expect(
      screen.getByRole("dialog", { name: "Müsaitliği düzenle" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Vazgeç" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes the availability editor with Escape and returns focus", async () => {
    const user = userEvent.setup();
    mockAll();
    render(<MentorProfilePage />);

    const opener = screen.getByRole("button", { name: "Müsaitliği düzenle" });
    await openEditor(user);
    expect(
      screen.getByRole("button", { name: "Düzenlemeyi kapat" }),
    ).toHaveFocus();
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });
});
