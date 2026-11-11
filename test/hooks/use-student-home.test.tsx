import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  STUDENT_PROFILE_COMPLETION_HREF,
  useStudentHome,
} from "@/hooks/use-student-home";
import { AppointmentStatus } from "@/interfaces/appointment";
import { fetchInstitutionRecord } from "@/lib/client/institution";
import {
  getPeerMentoringRequests,
  getPeerMentors,
} from "@/lib/client/peer-mentoring";
import { getStudentHome } from "@/lib/client/student-home";
import {
  PEER_MENTORS_FIXTURE,
  peerMentoringRequestsFixture,
} from "@test/fixtures/peer-mentoring";
import {
  APPOINTMENTS_NOW,
  peerAppointment,
} from "@test/fixtures/student-appointments";
import { STUDENT_RECORD } from "@test/fixtures/student-home";
import { createTestQueryClient, InLocale } from "@test/test-utils";

vi.mock("@/lib/client/student-home", () => ({ getStudentHome: vi.fn() }));
vi.mock("@/lib/client/institution", () => ({
  fetchInstitutionRecord: vi.fn(),
  fetchInstitutionAdvisees: vi.fn(),
}));
vi.mock("@/lib/client/peer-mentoring", () => ({
  getPeerMentors: vi.fn(),
  getPeerMentoringRequests: vi.fn(),
  getPeerCategories: vi.fn(),
}));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      <InLocale locale="tr">{children}</InLocale>
    </QueryClientProvider>
  );
}

const confirmed = peerAppointment({
  startsAt: "2026-11-10T08:00:00.000Z",
  endsAt: "2026-11-10T08:30:00.000Z",
});
const pending = peerAppointment({
  id: "pending",
  status: AppointmentStatus.Pending,
  startsAt: "2026-11-13T08:00:00.000Z",
  endsAt: "2026-11-13T08:30:00.000Z",
});

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(APPOINTMENTS_NOW);
  vi.mocked(getStudentHome).mockReset().mockResolvedValue({
    profileCompleted: false,
    appointments: [pending, confirmed],
  });
  vi.mocked(fetchInstitutionRecord)
    .mockReset()
    .mockResolvedValue(STUDENT_RECORD);
  vi.mocked(getPeerMentors).mockReset().mockResolvedValue(PEER_MENTORS_FIXTURE);
  vi.mocked(getPeerMentoringRequests)
    .mockReset()
    .mockResolvedValue(peerMentoringRequestsFixture());
});

describe("useStudentHome", () => {
  it("greets the student by first name and finds the advisor", async () => {
    const { result } = renderHook(() => useStudentHome(), { wrapper });
    expect(result.current.greeting).toBeNull();
    await waitFor(() => expect(result.current.name).toBe("Ayşe"));

    // 12:00 in Istanbul.
    expect(result.current.greeting).toBe("İyi günler");
    expect(result.current.advisor?.fullName).toBe("Elif Şahin");
  });

  it("splits what is ahead into the next session, confirmed ones and requests", async () => {
    const { result } = renderHook(() => useStudentHome(), { wrapper });
    await waitFor(() => expect(result.current.ready).toBe(true));
    await waitFor(() =>
      expect(result.current.peerRequests).toHaveLength(1),
    );

    expect(result.current.next?.id).toBe(confirmed.id);
    expect(result.current.confirmedCount).toBe(1);
    expect(result.current.awaiting.map((item) => item.id)).toEqual([
      "pending",
    ]);
    expect(result.current.requestCount).toBe(2);
  });

  it("sends an unfinished profile to the completion steps and asks the unfiltered mentor list", async () => {
    const { result } = renderHook(() => useStudentHome(), { wrapper });
    await waitFor(() => expect(result.current.ready).toBe(true));
    await waitFor(() => expect(result.current.mentors).not.toHaveLength(0));

    expect(result.current.profileHref).toBe(STUDENT_PROFILE_COMPLETION_HREF);
    expect(getPeerMentors).toHaveBeenCalledWith({ category: null, query: "" });
    expect(
      result.current.mentors.every((mentor) => !mentor.capacityFull),
    ).toBe(true);
  });

  it("opens Profilim once the profile is done", async () => {
    vi.mocked(getStudentHome).mockResolvedValue({
      profileCompleted: true,
      appointments: [],
    });
    const { result } = renderHook(() => useStudentHome(), { wrapper });
    await waitFor(() => expect(result.current.ready).toBe(true));

    expect(result.current.profileHref).toBe("/student/profile");
    expect(result.current.next).toBeNull();
  });
});
