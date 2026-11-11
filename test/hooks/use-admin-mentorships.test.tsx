import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  useAdminMentorships,
  useMentorshipInterventions,
  useMentorshipMatching,
} from "@/hooks/use-admin-mentorships";
import type { AdminIntervention } from "@/interfaces/admin-intervention";
import {
  BottleneckSeverity,
  type AdminBottleneck,
  type AdminOverview,
  type AdminRequest,
} from "@/interfaces/admin-overview";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import { ProgramStatus, ProgramType } from "@/interfaces/program";
import { ToastTone } from "@/interfaces/toast";
import { listAdminInterventions } from "@/lib/client/admin-interventions";
import { getAdminOverview } from "@/lib/client/admin-overview";
import { ALL_PROGRAM_TYPES } from "@/lib/program-types";
import type { ToastInput } from "@/stores/toast-store";
import {
  InterventionFilter,
  MatchingFilter,
  MatchingSort,
} from "@/types/admin-mentorships";
import {
  adminMentorship,
  adminProgram,
  adminStartup,
} from "@test/fixtures/admin-programs";
import { itemAt } from "@test/fixtures/list-assertions";
import { createTestQueryClient, freezeDate, InLocale } from "@test/test-utils";

const navigation = vi.hoisted(() => {
  const state: { params: URLSearchParams } = {
    params: new URLSearchParams(),
  };
  return state;
});

vi.mock("next/navigation", () => ({
  useSearchParams: () => navigation.params,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/admin/mentorships/interventions",
}));
vi.mock("@/lib/client/admin-overview", () => ({
  getAdminOverview: vi.fn(),
}));
vi.mock("@/lib/client/admin-interventions", () => ({
  listAdminInterventions: vi.fn(),
  openAdminIntervention: vi.fn(),
  resolveAdminIntervention: vi.fn(),
}));

const showToast = vi.fn<(toast: ToastInput) => void>();

vi.mock("@/stores/toast-store", () => ({
  useToast: () => ({ showToast, dismiss: vi.fn() }),
}));

const NOW = "2026-11-11T12:00:00+03:00";

function overview(overrides: Partial<AdminOverview> = {}): AdminOverview {
  return {
    programs: [],
    users: [],
    mentorships: [],
    requests: [],
    bottlenecks: [],
    meetingsLast8Weeks: 0,
    ...overrides,
  };
}

function bottleneck(overrides: Partial<AdminBottleneck>): AdminBottleneck {
  return {
    id: "b-1",
    title: "Prototip gecikiyor",
    severity: BottleneckSeverity.High,
    status: "OPEN",
    organizationId: "org-1",
    organizationName: "Lumen",
    createdAt: "2026-11-01T09:00:00Z",
    ...overrides,
  };
}

function request(overrides: Partial<AdminRequest>): AdminRequest {
  return {
    id: "r-1",
    organizationId: "org-1",
    organizationName: "Lumen",
    mentorId: null,
    mentorName: null,
    supportArea: null,
    status: MentorshipRequestStatus.Pending,
    createdAt: "2026-11-01T12:00:00+03:00",
    ...overrides,
  };
}

function followUp(overrides: Partial<AdminIntervention>): AdminIntervention {
  return {
    id: "f-1",
    mentorshipId: "m-1",
    coordinatorId: "c-1",
    coordinatorName: "Deniz Acar",
    openedByName: "Yönetici",
    action: "48 saat içinde görüşme planlansın",
    note: null,
    openedAt: "2026-11-10T09:00:00Z",
    readAt: null,
    plannedMeetingAt: null,
    resolvedAt: null,
    ...overrides,
  };
}

function wrapperFor(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <InLocale locale="tr">{children}</InLocale>
      </QueryClientProvider>
    );
  };
}

beforeEach(() => {
  freezeDate(NOW);
  vi.clearAllMocks();
  navigation.params = new URLSearchParams();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useAdminMentorships", () => {
  const alpha = adminProgram({
    id: "program-1",
    name: "Alpha",
    startups: [
      adminStartup({ id: "org-1", name: "Lumen", programName: "Alpha" }),
      adminStartup({ id: "org-2", name: "Nova", programName: "Alpha" }),
    ],
  });
  const beta = adminProgram({
    id: "program-2",
    name: "Beta",
    type: ProgramType.PeerMentoring,
    startups: [
      adminStartup({
        id: "org-3",
        name: "Orbit",
        programId: "program-2",
        programName: "Beta",
      }),
    ],
  });
  const gamma = adminProgram({
    id: "program-3",
    name: "Gamma",
    status: ProgramStatus.Completed,
    startups: [
      adminStartup({
        id: "org-4",
        name: "Zeta",
        programId: "program-3",
        programName: "Gamma",
      }),
    ],
  });
  const data = overview({
    programs: [alpha, beta, gamma],
    mentorships: [
      adminMentorship({
        organizationId: "org-1",
        programId: "program-1",
        daysSinceMeeting: 20,
      }),
    ],
  });

  function renderScreen() {
    return renderHook(() => useAdminMentorships(), {
      wrapper: wrapperFor(createTestQueryClient()),
    });
  }

  it("has no screen until the overview arrives", () => {
    vi.mocked(getAdminOverview).mockReturnValue(new Promise(() => {}));
    const { result } = renderScreen();

    expect(result.current.query.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(result.current.screen).toBeNull();
    expect(result.current.type).toBe(ALL_PROGRAM_TYPES);
    expect(result.current.scope).toBe("");
  });

  it("has no screen when the overview fails", async () => {
    vi.mocked(getAdminOverview).mockRejectedValue(new Error("Sunucu hatası"));
    const { result } = renderScreen();

    await waitFor(() => expect(result.current.query.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
    expect(result.current.screen).toBeNull();
  });

  it("covers every program of every type, and counts only live ones", async () => {
    vi.mocked(getAdminOverview).mockResolvedValue(data);
    const { result } = renderScreen();

    await waitFor(() => expect(result.current.data).toEqual(data));
    expect(result.current.screen).toEqual({
      typedNames: ["Alpha", "Beta", "Gamma"],
      programs: [alpha, beta, gamma],
      live: [alpha, beta],
      interventionCount: 1,
      waitingCount: 2,
    });
  });

  it("narrows the screen to the chosen program", async () => {
    vi.mocked(getAdminOverview).mockResolvedValue(data);
    const { result } = renderScreen();
    await waitFor(() => expect(result.current.data).toEqual(data));

    act(() => result.current.setScope("Alpha"));

    expect(result.current.scope).toBe("Alpha");
    expect(result.current.screen).toEqual({
      typedNames: ["Alpha", "Beta", "Gamma"],
      programs: [alpha],
      live: [alpha],
      interventionCount: 1,
      waitingCount: 1,
    });
  });

  it("leaves nothing live in a finished program", async () => {
    vi.mocked(getAdminOverview).mockResolvedValue(data);
    const { result } = renderScreen();
    await waitFor(() => expect(result.current.data).toEqual(data));

    act(() => result.current.setScope("Gamma"));

    expect(result.current.screen).toEqual({
      typedNames: ["Alpha", "Beta", "Gamma"],
      programs: [gamma],
      live: [],
      interventionCount: 0,
      waitingCount: 0,
    });
  });

  it("starts over on every program of a newly chosen type", async () => {
    vi.mocked(getAdminOverview).mockResolvedValue(data);
    const { result } = renderScreen();
    await waitFor(() => expect(result.current.data).toEqual(data));
    act(() => result.current.setScope("Alpha"));

    act(() => result.current.selectType(ProgramType.PeerMentoring));

    expect(result.current.type).toBe(ProgramType.PeerMentoring);
    expect(result.current.scope).toBe("");
    expect(result.current.screen).toEqual({
      typedNames: ["Beta"],
      programs: [beta],
      live: [beta],
      interventionCount: 0,
      waitingCount: 1,
    });
  });
});

describe("useMentorshipInterventions", () => {
  const alpha = adminProgram({
    id: "program-1",
    name: "Alpha",
    coordinatorId: "c-1",
    coordinatorName: "Deniz Acar",
    startups: [
      adminStartup({ id: "org-1", name: "Lumen", programName: "Alpha" }),
      adminStartup({ id: "org-2", name: "Nova", programName: "Alpha" }),
      adminStartup({ id: "org-3", name: "Orbit", programName: "Alpha" }),
    ],
  });
  const data = overview({
    programs: [alpha],
    mentorships: [
      adminMentorship({
        id: "m-1",
        organizationId: "org-1",
        organizationName: "Lumen",
        programId: "program-1",
        daysSinceMeeting: 20,
      }),
      adminMentorship({
        id: "m-2",
        mentorId: "mentor-2",
        mentorName: "Can Öz",
        organizationId: "org-2",
        organizationName: "Nova",
        programId: "program-1",
        daysSinceMeeting: 3,
      }),
    ],
    bottlenecks: [
      bottleneck({
        id: "b-2",
        organizationId: "org-2",
        organizationName: "Nova",
      }),
      bottleneck({
        id: "b-3",
        title: "Ekip eksik",
        organizationId: "org-3",
        organizationName: "Orbit",
      }),
    ],
  });
  const tracked = followUp({ id: "f-1", mentorshipId: "m-1" });
  const resolvedFollowUp = followUp({
    id: "f-2",
    mentorshipId: "m-2",
    resolvedAt: "2026-11-10T12:00:00Z",
  });

  /** The same programs without Orbit's bottleneck, so every row on the list has a mentorship to notify about. */
  const mentoredOnly: AdminOverview = {
    ...data,
    bottlenecks: data.bottlenecks.filter(
      (block) => block.organizationId !== "org-3",
    ),
  };

  function renderTab(queryClient = createTestQueryClient(), source = data) {
    return renderHook(() => useMentorshipInterventions(source, [alpha]), {
      wrapper: wrapperFor(queryClient),
    });
  }

  async function renderLoaded(source = data) {
    vi.mocked(listAdminInterventions).mockResolvedValue([
      tracked,
      resolvedFollowUp,
    ]);
    const rendered = renderTab(createTestQueryClient(), source);
    await waitFor(() =>
      expect(rendered.result.current.counts[InterventionFilter.Assigned]).toBe(
        1,
      ),
    );
    return rendered;
  }

  function visibleIds(current: { visible: { row: { id: string } }[] }) {
    return current.visible.map((entry) => entry.row.id);
  }

  it("starts on every row of every program when the URL names no filter", async () => {
    const { result } = await renderLoaded();

    expect(result.current.filter).toBe(InterventionFilter.All);
    expect(result.current.program).toBe("");
    expect(result.current.search).toBe("");
    expect(visibleIds(result.current)).toEqual(["m-1", "b-2", "b-3"]);
    expect(result.current.followError).toBeNull();
    expect(result.current.detail).toBeUndefined();
  });

  it("counts a pair under follow-up as assigned and unanswered, and a resolved follow-up as none", async () => {
    const { result } = await renderLoaded();

    expect(result.current.counts).toEqual({
      [InterventionFilter.All]: 3,
      [InterventionFilter.Critical]: 0,
      [InterventionFilter.Bottleneck]: 2,
      [InterventionFilter.Unanswered]: 1,
      [InterventionFilter.Assigned]: 1,
    });
    expect(
      result.current.visible.map((entry) => entry.tracked?.id ?? null),
    ).toEqual(["f-1", null, null]);
  });

  it("counts every late pair as critical while the follow-ups are still loading", () => {
    vi.mocked(listAdminInterventions).mockReturnValue(new Promise(() => {}));
    const { result } = renderTab();

    expect(result.current.counts).toEqual({
      [InterventionFilter.All]: 3,
      [InterventionFilter.Critical]: 1,
      [InterventionFilter.Bottleneck]: 2,
      [InterventionFilter.Unanswered]: 0,
      [InterventionFilter.Assigned]: 0,
    });
  });

  it("opens on the filter and program the URL names", async () => {
    navigation.params = new URLSearchParams({
      filter: InterventionFilter.Bottleneck,
      program: "Alpha",
    });
    const { result } = await renderLoaded();

    expect(result.current.filter).toBe(InterventionFilter.Bottleneck);
    expect(result.current.program).toBe("Alpha");
    expect(visibleIds(result.current)).toEqual(["b-2", "b-3"]);
  });

  it("falls back to every row when the URL names an unknown filter", async () => {
    navigation.params = new URLSearchParams({ filter: "bottleneck" });
    const { result } = await renderLoaded();

    expect(result.current.filter).toBe(InterventionFilter.All);
  });

  it("switches to a known filter and ignores an unknown one", async () => {
    const { result } = await renderLoaded();

    act(() => result.current.selectFilter(InterventionFilter.Unanswered));
    expect(result.current.filter).toBe(InterventionFilter.Unanswered);
    expect(visibleIds(result.current)).toEqual(["m-1"]);

    act(() => result.current.selectFilter("EVERYTHING"));
    expect(result.current.filter).toBe(InterventionFilter.Unanswered);
  });

  it("narrows the rows by search text and by program", async () => {
    const { result } = await renderLoaded();

    act(() => result.current.setSearch("EKİP"));
    expect(result.current.search).toBe("EKİP");
    expect(visibleIds(result.current)).toEqual(["b-3"]);

    act(() => result.current.setSearch(""));
    act(() => result.current.setProgram("Beta"));
    expect(result.current.program).toBe("Beta");
    expect(result.current.visible).toEqual([]);
  });

  it("hands over the follow-up error when the list fails", async () => {
    const failure = new Error("Takipler yüklenemedi.");
    vi.mocked(listAdminInterventions).mockRejectedValue(failure);
    const { result } = renderTab();

    await waitFor(() => expect(result.current.followError).toBe(failure));
  });

  it("hands over no follow-up error when the list fails with something other than an Error", async () => {
    vi.mocked(listAdminInterventions).mockRejectedValue("offline");
    const queryClient = createTestQueryClient();
    const { result } = renderTab(queryClient);

    await waitFor(() =>
      expect(queryClient.getQueryState(["admin-interventions"])?.status).toBe(
        "error",
      ),
    );
    expect(result.current.followError).toBeNull();
  });

  it("opens the notify dialog on a pair's row and closes it", async () => {
    const { result } = await renderLoaded(mentoredOnly);
    const lumenRow = itemAt(result.current.visible, 0).row;
    expect(result.current.notifyRow).toBeNull();

    act(() => result.current.openNotify("m-2"));
    expect(result.current.notifyRow).toEqual(
      itemAt(result.current.visible, 1).row,
    );

    act(() => result.current.openNotify("m-1"));
    expect(result.current.notifyRow).toEqual(lumenRow);

    act(() => result.current.closeNotify());
    expect(result.current.notifyRow).toBeNull();
  });

  it("has no notify row for a mentorship that is not on the list", async () => {
    const { result } = await renderLoaded();

    act(() => result.current.openNotify("m-9"));

    expect(result.current.notifyRow).toBeNull();
  });

  it("closes the notify dialog and names the coordinator and pair once they are notified", async () => {
    const { result } = await renderLoaded(mentoredOnly);
    act(() => result.current.openNotify("m-1"));

    act(() => result.current.notified());

    expect(result.current.notifyRow).toBeNull();
    expect(showToast).toHaveBeenCalledWith({
      title: "Deniz Acar bilgilendirildi",
      message: "Ayşe Demir ↔ Lumen takibe alındı.",
      tone: ToastTone.Success,
    });
  });

  it("says nothing when notified with no dialog open", async () => {
    const { result } = await renderLoaded(mentoredOnly);

    act(() => result.current.notified());

    expect(showToast).not.toHaveBeenCalled();
  });

  it("picks no notify row while no dialog is open, even beside a team without a mentorship", async () => {
    // Such a bottleneck row has a null mentorship id, like a closed dialog.
    const { result } = await renderLoaded();
    expect(
      result.current.visible.some((entry) => entry.row.mentorshipId === null),
    ).toBe(true);

    expect(result.current.notifyRow).toBeNull();
    act(() => result.current.notified());
    expect(showToast).not.toHaveBeenCalled();
  });

  it("opens a follow-up's drawer by its id and closes it", async () => {
    const { result } = await renderLoaded();

    act(() => result.current.openDetail("f-1"));
    expect(result.current.detail).toEqual(itemAt(result.current.visible, 0));

    act(() => result.current.closeDetail());
    expect(result.current.detail).toBeUndefined();

    act(() => result.current.openDetail("f-2"));
    expect(result.current.detail).toBeUndefined();
  });

  it("closes the drawer and confirms once the follow-up is resolved", async () => {
    const { result } = await renderLoaded();
    act(() => result.current.openDetail("f-1"));

    act(() => result.current.resolved());

    expect(result.current.detail).toBeUndefined();
    expect(showToast).toHaveBeenCalledWith({
      message: "Takip çözüldü olarak kapatıldı.",
      tone: ToastTone.Success,
    });
  });
});

describe("useMentorshipMatching", () => {
  const alpha = adminProgram({
    id: "program-1",
    name: "Alpha",
    startups: [
      adminStartup({ id: "org-1", name: "Zeplin", programName: "Alpha" }),
      adminStartup({ id: "org-2", name: "Atlas", programName: "Alpha" }),
      adminStartup({ id: "org-3", name: "Orbit", programName: "Alpha" }),
    ],
  });
  const data = overview({
    programs: [alpha],
    mentorships: [
      adminMentorship({
        id: "m-3",
        organizationId: "org-3",
        organizationName: "Orbit",
        programId: "program-1",
        startDate: "2026-11-08",
        daysSinceMeeting: 1,
      }),
    ],
    requests: [
      request({
        id: "r-1",
        organizationId: "org-1",
        organizationName: "Zeplin",
        supportArea: "Finans",
        createdAt: "2026-11-01T12:00:00+03:00",
      }),
      request({
        id: "r-2",
        organizationId: "org-2",
        organizationName: "Atlas",
        status: MentorshipRequestStatus.Declined,
        createdAt: "2026-11-06T12:00:00+03:00",
      }),
    ],
  });

  function renderTab(source = data, programs = [alpha]) {
    return renderHook(() => useMentorshipMatching(source, programs));
  }

  function visibleIds(current: { visible: { id: string }[] }) {
    return current.visible.map((row) => row.id);
  }

  it("starts on the waiting teams, longest wait first, with the summary numbers", () => {
    const { result } = renderTab();

    expect(result.current.filter).toBe(MatchingFilter.Waiting);
    expect(result.current.sort).toBe(MatchingSort.Wait);
    expect(result.current.program).toBe("");
    expect(result.current.search).toBe("");
    expect(visibleIds(result.current)).toEqual([
      "program-1:org-1",
      "program-1:org-2",
    ]);
    expect(result.current.averageWait).toBe(10);
    expect(result.current.waitingProgramCount).toBe(1);
    expect(
      result.current.rows[MatchingFilter.ThisWeek].map((row) => row.id),
    ).toEqual(["m-3"]);
  });

  it("switches to a known filter and ignores an unknown one", () => {
    const { result } = renderTab();

    act(() => result.current.selectFilter(MatchingFilter.Declined));
    expect(result.current.filter).toBe(MatchingFilter.Declined);
    expect(visibleIds(result.current)).toEqual(["r-2"]);

    act(() => result.current.selectFilter(MatchingFilter.ThisWeek));
    expect(visibleIds(result.current)).toEqual(["m-3"]);

    act(() => result.current.selectFilter("waiting"));
    expect(result.current.filter).toBe(MatchingFilter.ThisWeek);
  });

  it("sorts by team name when asked and ignores an unknown sort", () => {
    const { result } = renderTab();

    act(() => result.current.selectSort(MatchingSort.Name));
    expect(result.current.sort).toBe(MatchingSort.Name);
    expect(visibleIds(result.current)).toEqual([
      "program-1:org-2",
      "program-1:org-1",
    ]);

    act(() => result.current.selectSort("NEWEST"));
    expect(result.current.sort).toBe(MatchingSort.Name);
  });

  it("narrows the rows by the need in the search and by program", () => {
    const { result } = renderTab();

    act(() => result.current.setSearch("finans"));
    expect(result.current.search).toBe("finans");
    expect(visibleIds(result.current)).toEqual(["program-1:org-1"]);

    act(() => result.current.setSearch(""));
    act(() => result.current.setProgram("Beta"));
    expect(result.current.program).toBe("Beta");
    expect(result.current.visible).toEqual([]);
  });

  it("has no rows and no average wait without programs", () => {
    const { result } = renderTab(overview(), []);

    expect(result.current.visible).toEqual([]);
    expect(result.current.averageWait).toBeNull();
    expect(result.current.waitingProgramCount).toBe(0);
  });
});
