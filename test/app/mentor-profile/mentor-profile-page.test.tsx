import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import MentorProfilePage from "@/app/mentor-profile/page";
import { useMeetings } from "@/hooks/use-meetings";
import {
  useAvailabilitySlotForm,
  useMentorAvailabilitySlots,
  useMentorProfile,
  useMentorProfileForm,
} from "@/hooks/use-mentor-profile";
import { useMentorshipRequests } from "@/hooks/use-mentorship-requests";
import { usePrograms } from "@/hooks/use-programs";
import type {
  MentorAvailabilitySlot,
  MentorProfile,
} from "@/interfaces/mentor";
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
  useMentorAvailabilitySlots: vi.fn(),
  useAvailabilitySlotForm: vi.fn(),
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

function slot(overrides: Partial<MentorAvailabilitySlot> = {}) {
  return {
    id: "slot-1",
    startsAt: "2026-09-14T11:00:00.000Z",
    durationMinutes: 60,
    booked: false,
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
const handleDeleteSlot = vi.fn();
const handleAddSlot = vi.fn();
const setSlotForm = vi.fn();

function mockAll(overrides: Record<string, unknown> = {}) {
  const o = {
    profileQuery: { data: profile(), isLoading: false, error: null },
    slots: [slot()],
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
    form: profile(),
    specialtyInput: "",
    setSpecialtyInput,
    saveError: "",
    saveSuccess: false,
    isSaving: false,
    updateField,
    addSpecialty,
    removeSpecialty,
    handleSave,
    ...(o.form as object),
  } as unknown as ReturnType<typeof useMentorProfileForm>);
  vi.mocked(useMentorAvailabilitySlots).mockReturnValue({
    data: o.slots,
    isLoading: false,
  } as unknown as ReturnType<typeof useMentorAvailabilitySlots>);
  vi.mocked(useAvailabilitySlotForm).mockReturnValue({
    slotForm: { startsAt: "2026-09-20T10:00", durationMinutes: 60 },
    setSlotForm,
    slotError: "",
    isCreating: false,
    isDeleting: false,
    handleAddSlot,
    handleDeleteSlot,
  } as unknown as ReturnType<typeof useAvailabilitySlotForm>);
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

    await user.type(screen.getByDisplayValue("Döngü Labs"), "!");
    expect(updateField).toHaveBeenCalled();
  });

  it("saves the profile", async () => {
    const user = userEvent.setup();
    mockAll();
    render(<MentorProfilePage />);

    await user.click(screen.getByRole("button", { name: "Profili Kaydet" }));
    expect(handleSave).toHaveBeenCalled();
  });

  it("adds and removes a mentoring topic", async () => {
    const user = userEvent.setup();
    mockAll();
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

  it("shows the mentor's real availability slots", () => {
    mockAll();
    render(<MentorProfilePage />);

    expect(screen.getAllByText("60 dk").length).toBeGreaterThan(0);
  });

  it("notes when no availability is defined", () => {
    mockAll({ slots: [] });
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

  it("removes an availability slot from the editor", async () => {
    const user = userEvent.setup();
    mockAll();
    render(<MentorProfilePage />);

    const dialog = await openEditor(user);
    await user.click(within(dialog).getByRole("button", { name: "Kaldır" }));

    expect(handleDeleteSlot).toHaveBeenCalledWith("slot-1");
  });

  it("will not remove a booked slot", async () => {
    const user = userEvent.setup();
    mockAll({ slots: [slot({ booked: true })] });
    render(<MentorProfilePage />);

    const dialog = await openEditor(user);
    expect(
      within(dialog).getByRole("button", { name: "Kaldır" }),
    ).toBeDisabled();
  });

  it("adds a new availability slot", async () => {
    const user = userEvent.setup();
    mockAll();
    render(<MentorProfilePage />);

    const dialog = await openEditor(user);
    await user.click(within(dialog).getByRole("button", { name: /Saat ekle/ }));

    expect(handleAddSlot).toHaveBeenCalled();
  });

  it("closes the availability editor", async () => {
    const user = userEvent.setup();
    mockAll();
    render(<MentorProfilePage />);

    await openEditor(user);
    await user.click(screen.getByRole("button", { name: "Kapat" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
