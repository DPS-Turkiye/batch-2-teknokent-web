import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PeerMentorProfileWizard } from "@/components/student/peer-mentor-profile-wizard";
import { PeerTopicCategory } from "@/interfaces/peer-mentoring";
import { type AppSession, IdentityKind, UserRole } from "@/interfaces/session";
import { PROFILE_COMPLETION_CATEGORIES } from "@/lib/client/fixtures/student-profile-completion";
import { fetchInstitutionRecord } from "@/lib/client/institution";
import { updateAvailabilitySettings } from "@/lib/client/mentor-profile";
import {
  getPeerMentorProfile,
  savePeerMentorProfile,
} from "@/lib/client/peer-mentoring";
import { renderWithQueryClient } from "@test/test-utils";

const push = vi.fn();
const session: AppSession = {
  userId: "zeynep",
  fullName: "Zeynep Demir",
  email: "zeynep.demir@odtu-dev.invalid",
  jobTitle: "",
  role: UserRole.Mentee,
  permissions: [UserRole.Mentee, UserRole.Mentor],
  institutionKinds: [IdentityKind.Student],
};
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
}));
vi.mock("@/components/providers/session-provider", () => ({
  useAppSession: () => session,
}));
vi.mock("@/lib/client/badges", () => ({
  getMyBadges: vi.fn(async () => []),
  getUserBadges: vi.fn(async () => []),
}));
vi.mock("@/lib/client/institution", () => ({
  fetchInstitutionRecord: vi.fn(),
  fetchInstitutionAdvisees: vi.fn(),
}));
vi.mock("@/lib/client/student-profile-completion", () => ({
  getProfileCompletionCategories: vi.fn(async () =>
    structuredClone(PROFILE_COMPLETION_CATEGORIES),
  ),
  getPeerMentorCategories: vi.fn(async () =>
    structuredClone(PROFILE_COMPLETION_CATEGORIES),
  ),
  getStudentProfileCompletion: vi.fn(),
  saveStudentProfileCompletion: vi.fn(),
}));
vi.mock("@/lib/client/peer-mentoring", () => ({
  getPeerMentorProfile: vi.fn(),
  savePeerMentorProfile: vi.fn(),
  getReceivedPeerRequests: vi.fn(),
  getPeerMentors: vi.fn(),
  getPeerMentoringRequests: vi.fn(),
  createPeerMentoringRequest: vi.fn(),
}));
vi.mock("@/lib/client/mentor-profile", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/client/mentor-profile")>()),
  getAvailabilitySettings: vi.fn(),
  updateAvailabilitySettings: vi.fn(async () => ({})),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getPeerMentorProfile).mockResolvedValue(null);
  vi.mocked(savePeerMentorProfile).mockImplementation(async (input) => ({
    ...input,
    erasmus: input.erasmus || null,
    linkedinUrl: input.linkedinUrl || null,
    department: "Endüstri Mühendisliği",
    classYear: 4,
    menteeCapacity: 3,
  }));
  vi.mocked(fetchInstitutionRecord).mockResolvedValue({
    kinds: [IdentityKind.Student],
    fullName: "Zeynep Demir",
    email: null,
    faculty: null,
    departmentName: "Endüstri Mühendisliği",
    classYear: 4,
    programLevel: null,
    academicTitle: null,
    iskurParticipant: true,
    advisor: null,
    syncedAt: null,
  });
});

describe("PeerMentorProfileWizard", () => {
  it("walks a new peer mentor through every step and publishes the profile and hours together", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<PeerMentorProfileWizard />);
    const next = () =>
      user.click(screen.getByRole("button", { name: "Devam et" }));

    expect(
      await screen.findByRole("heading", { name: "Mentor profilini oluştur" }),
    ).toBeVisible();
    await screen.findByRole("checkbox", { name: "Kariyer ve Staj" });
    await next();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "En az bir kategori seç.",
    );

    await user.click(screen.getByRole("checkbox", { name: "Kariyer ve Staj" }));
    await next();
    await user.click(
      screen.getByRole("checkbox", { name: "Örnek: CV hazırlama" }),
    );
    await next();

    await user.type(
      screen.getByLabelText(/Güçlü olduğun dersler/),
      "IE 251{enter}IE 265",
    );
    await next();

    await user.type(screen.getByLabelText(/Neye yardım edebilirsin/), "Kısa");
    await next();
    expect(screen.getByRole("alert")).toHaveTextContent("en az 20 karakter");
    await user.type(
      screen.getByLabelText(/Neye yardım edebilirsin/),
      " değil: staj başvurusu ve CV hazırlığı.",
    );
    await next();

    await user.type(
      screen.getByLabelText("LinkedIn adresin"),
      "linkedin.com/in/zeynep",
    );
    await next();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "http:// veya https://",
    );
    await user.clear(screen.getByLabelText("LinkedIn adresin"));
    await user.type(
      screen.getByLabelText("LinkedIn adresin"),
      "https://linkedin.com/in/zeynep",
    );
    await next();

    expect(screen.getByText("HAFTALIK UYGUNLUK")).toBeVisible();
    expect(screen.queryByText("UYGUN OLMADIĞIN TARİHLER")).toBeNull();
    await user.click(screen.getByRole("switch", { name: "Salı uygun" }));
    await next();

    expect(
      await screen.findByText("Öğrenciler seni böyle görecek."),
    ).toBeVisible();
    expect(screen.getByRole("heading", { name: "Zeynep Demir" })).toBeVisible();
    expect(
      screen.getByText("Kısa değil: staj başvurusu ve CV hazırlığı."),
    ).toBeVisible();
    expect(screen.getByText(/1 haftalık saat aralığı/)).toBeVisible();
    expect(savePeerMentorProfile).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Yayınla" }));

    await waitFor(() =>
      expect(push).toHaveBeenCalledWith("/student/peer-mentoring?as=MENTOR"),
    );
    expect(vi.mocked(savePeerMentorProfile).mock.calls[0]?.[0]).toEqual({
      categories: [PeerTopicCategory.CareerInternship],
      subTopics: ["fixture-cv"],
      strongCourses: ["IE 251", "IE 265"],
      projects: [],
      erasmus: "",
      helpWith: "Kısa değil: staj başvurusu ve CV hazırlığı.",
      linkedinUrl: "https://linkedin.com/in/zeynep",
    });
    expect(
      vi.mocked(updateAvailabilitySettings).mock.calls[0]?.[0],
    ).toMatchObject({
      menteeCapacity: 3,
      defaultMeetingDurationMinutes: 30,
      rules: [expect.objectContaining({ dayOfWeek: "TUESDAY" })],
    });
  });

  it("opens with the published answers when editing", async () => {
    vi.mocked(getPeerMentorProfile).mockResolvedValue({
      categories: [PeerTopicCategory.International],
      subTopics: [],
      strongCourses: [],
      projects: [],
      erasmus: "TU Delft",
      helpWith: "Erasmus başvurusu konusunda yardımcı olurum.",
      linkedinUrl: null,
      department: "Endüstri Mühendisliği",
      classYear: 4,
      menteeCapacity: 3,
    });
    renderWithQueryClient(<PeerMentorProfileWizard />);

    expect(
      await screen.findByRole("heading", { name: "Mentor profilini düzenle" }),
    ).toBeVisible();
    expect(
      screen.getByRole("checkbox", { name: "Uluslararası Fırsatlar" }),
    ).toBeChecked();
  });
});
