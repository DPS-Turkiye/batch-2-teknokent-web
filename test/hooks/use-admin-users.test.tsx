import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  useCoordinatorsTable,
  useMentorsTable,
  useTeamsTable,
  useUserListFilters,
} from "@/hooks/use-admin-users";
import type { AdminOverview, AdminUser } from "@/interfaces/admin-overview";
import { MentorshipStatus } from "@/interfaces/coordinator-mentorship";
import { ProgramMentorStatus, ProgramStatus } from "@/interfaces/program";
import { UserAccountStatus, UserRole } from "@/interfaces/session";
import { ToastTone } from "@/interfaces/toast";
import { setCoordinatorAccess } from "@/lib/client/admin-coordinators";
import {
  decidePendingAccount,
  type AccountDecision,
} from "@/lib/client/admin-users";
import type { ToastInput } from "@/stores/toast-store";
import { TeamHealth, UserFilter } from "@/types/admin-users";
import {
  adminMentorship,
  adminProgram,
  adminStartup,
} from "@test/fixtures/admin-programs";
import { itemAt } from "@test/fixtures/list-assertions";
import { backendUser } from "@test/fixtures/session";
import { createTestQueryClient, freezeDate, InLocale } from "@test/test-utils";

vi.mock("@/lib/client/admin-users", () => ({
  decidePendingAccount: vi.fn(),
  getPendingAccounts: vi.fn(),
}));
vi.mock("@/lib/client/admin-coordinators", () => ({
  addCoordinator: vi.fn(),
  getCoordinatorCandidate: vi.fn(),
  resendCoordinatorPasswordSetup: vi.fn(),
  setCoordinatorAccess: vi.fn(),
}));

const showToast = vi.fn<(toast: ToastInput) => void>();

vi.mock("@/stores/toast-store", () => ({
  useToast: () => ({ showToast, dismiss: vi.fn() }),
}));

const NOW = "2026-11-11T12:00:00+03:00";

function adminUser(overrides: Partial<AdminUser>): AdminUser {
  return {
    id: "user-1",
    email: "user@tekno.co",
    fullName: "Kişi",
    role: UserRole.Coordinator,
    status: UserAccountStatus.Approved,
    organizationId: null,
    organizationName: null,
    jobTitle: null,
    ...overrides,
  };
}

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

function decision(userId: string): AccountDecision {
  return { user: backendUser({ id: userId }), inviteCode: null };
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

/** The toast passed to showToast at the given call. */
function toastAt(index: number): ToastInput {
  return itemAt(showToast.mock.calls, index)[0];
}

beforeEach(() => {
  freezeDate(NOW);
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useUserListFilters", () => {
  it("starts with every user, no program, no search, on the first page", () => {
    const { result } = renderHook(() => useUserListFilters());

    expect(result.current).toEqual({
      filter: UserFilter.All,
      program: "",
      search: "",
      page: 0,
      setPage: expect.any(Function),
      onFilter: expect.any(Function),
      onProgram: expect.any(Function),
      onSearch: expect.any(Function),
    });
  });

  it("moves between pages without touching the filter, program or search", () => {
    const { result } = renderHook(() => useUserListFilters());

    act(() => result.current.setPage(3));

    expect(result.current.page).toBe(3);
    expect(result.current.filter).toBe(UserFilter.All);
    expect(result.current.program).toBe("");
    expect(result.current.search).toBe("");
  });

  it("goes back to the first page when the chip changes", () => {
    const { result } = renderHook(() => useUserListFilters());
    act(() => result.current.setPage(2));

    act(() => result.current.onFilter(UserFilter.Pending));

    expect(result.current.filter).toBe(UserFilter.Pending);
    expect(result.current.page).toBe(0);
  });

  it("goes back to the first page when the program changes", () => {
    const { result } = renderHook(() => useUserListFilters());
    act(() => result.current.setPage(2));

    act(() => result.current.onProgram("ODTÜ Stars 2026"));

    expect(result.current.program).toBe("ODTÜ Stars 2026");
    expect(result.current.page).toBe(0);
  });

  it("goes back to the first page when the search text changes", () => {
    const { result } = renderHook(() => useUserListFilters());
    act(() => result.current.setPage(2));

    act(() => result.current.onSearch("deniz"));

    expect(result.current.search).toBe("deniz");
    expect(result.current.page).toBe(0);
  });
});

describe("useCoordinatorsTable", () => {
  const deniz = adminUser({
    id: "c-1",
    fullName: "Deniz Acar",
    email: "deniz@tekno.co",
  });
  const kerem = adminUser({
    id: "c-2",
    fullName: "Kerem Yıldız",
    email: "kerem@tekno.co",
    status: UserAccountStatus.Pending,
  });
  const selin = adminUser({
    id: "c-3",
    fullName: "Selin Kaya",
    email: "selin@tekno.co",
    status: UserAccountStatus.Rejected,
  });
  const mentor = adminUser({
    id: "mentor-1",
    fullName: "Ayşe Demir",
    role: UserRole.Mentor,
  });
  const data = overview({
    programs: [adminProgram({ id: "program-1", coordinatorId: "c-1" })],
    users: [deniz, kerem, selin, mentor],
  });

  function renderTable(
    focus: string | null = null,
    queryClient = createTestQueryClient(),
  ) {
    return renderHook(
      ({ focusUserId }: { focusUserId: string | null }) =>
        useCoordinatorsTable(data, focusUserId),
      {
        initialProps: { focusUserId: focus },
        wrapper: wrapperFor(queryClient),
      },
    );
  }

  it("lists only coordinators, counts them by status and opens nothing", () => {
    const { result } = renderTable();

    expect(result.current.counts).toEqual({
      [UserFilter.All]: 3,
      [UserFilter.Active]: 1,
      [UserFilter.Pending]: 1,
      [UserFilter.NoAccess]: 0,
      [UserFilter.Inactive]: 1,
    });
    expect(result.current.total).toBe(3);
    expect(result.current.visible).toEqual([deniz, kerem, selin]);
    expect(result.current.selectedId).toBeNull();
    expect(result.current.selected).toBeNull();
    expect(result.current.review).toBeNull();
    expect(result.current.approving).toBeNull();
    expect(result.current.isDeciding).toBe(false);
  });

  it("narrows the rows by chip, program and search", () => {
    const { result } = renderTable();

    act(() => result.current.filters.onFilter(UserFilter.Pending));
    expect(result.current.visible).toEqual([kerem]);
    expect(result.current.total).toBe(1);

    act(() => result.current.filters.onFilter(UserFilter.All));
    act(() => result.current.filters.onProgram("ODTÜ Stars 2026"));
    expect(result.current.visible).toEqual([deniz]);

    act(() => result.current.filters.onProgram(""));
    act(() => result.current.filters.onSearch("selin@"));
    expect(result.current.visible).toEqual([selin]);
  });

  it("shows seven coordinators a page and the rest on the next one", () => {
    const many = Array.from({ length: 9 }, (_, index) =>
      adminUser({ id: `c-${String(index + 1)}`, fullName: `Kişi ${index}` }),
    );
    const { result } = renderHook(
      () => useCoordinatorsTable(overview({ users: many }), null),
      { wrapper: wrapperFor(createTestQueryClient()) },
    );

    expect(result.current.total).toBe(9);
    expect(result.current.visible).toEqual(many.slice(0, 7));

    act(() => result.current.filters.setPage(1));

    expect(result.current.visible).toEqual(many.slice(7));
  });

  it("opens the focused coordinator when the page is opened with ?user=", () => {
    // A link from another admin screen mounts the table with the focus already set.
    expect(renderTable("c-1").result.current.selected).toEqual(deniz);
    expect(renderTable("c-2").result.current.review).toEqual(kerem);
  });

  it("opens a pending coordinator for review when the ?user= focus moves to them", () => {
    const { result, rerender } = renderTable();

    rerender({ focusUserId: "c-2" });

    expect(result.current.review).toEqual(kerem);
    expect(result.current.selected).toBeNull();
  });

  it("opens an approved coordinator in the drawer when the ?user= focus moves to them", () => {
    const { result, rerender } = renderTable();

    rerender({ focusUserId: "c-1" });

    expect(result.current.selectedId).toBe("c-1");
    expect(result.current.selected).toEqual(deniz);
    expect(result.current.review).toBeNull();
  });

  it("ignores a focus on someone who is not a coordinator", () => {
    const { result, rerender } = renderTable();

    rerender({ focusUserId: "mentor-1" });
    rerender({ focusUserId: "nobody" });

    expect(result.current.selected).toBeNull();
    expect(result.current.review).toBeNull();
  });

  it("does not reopen a closed drawer while the focus stays the same", () => {
    const { result, rerender } = renderTable();
    rerender({ focusUserId: "c-1" });

    act(() => result.current.closeDrawer());
    rerender({ focusUserId: "c-1" });

    expect(result.current.selected).toBeNull();
  });

  it("opens a pending application for review and anyone else in the drawer", () => {
    const { result } = renderTable();

    act(() => result.current.openDetail(kerem));
    expect(result.current.review).toEqual(kerem);
    expect(result.current.selected).toBeNull();

    act(() => result.current.closeReview());
    act(() => result.current.openDetail(selin));
    expect(result.current.selected).toEqual(selin);
    expect(result.current.review).toBeNull();
  });

  it("opens and closes the drawer, the review and the approval directly", () => {
    const { result } = renderTable();

    act(() => result.current.select("c-3"));
    expect(result.current.selected).toEqual(selin);
    act(() => result.current.closeDrawer());
    expect(result.current.selected).toBeNull();

    act(() => result.current.startReview("c-2"));
    expect(result.current.review).toEqual(kerem);

    act(() => result.current.startApproval(kerem));
    expect(result.current.review).toBeNull();
    expect(result.current.approving).toEqual(kerem);

    act(() => result.current.closeApproval());
    expect(result.current.approving).toBeNull();
  });

  it("rejects an application, closes the review and the approval, and refreshes the lists", async () => {
    vi.mocked(decidePendingAccount).mockResolvedValue(decision("c-2"));
    const queryClient = createTestQueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderTable(null, queryClient);
    act(() => result.current.startReview("c-2"));

    act(() => result.current.reject(kerem));

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith({
        message: "Kerem Yıldız reddedildi.",
        tone: ToastTone.Success,
      }),
    );
    expect(decidePendingAccount).toHaveBeenCalledWith(
      "c-2",
      UserAccountStatus.Rejected,
    );
    expect(result.current.review).toBeNull();
    expect(result.current.approving).toBeNull();
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ["pending-accounts"],
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["admin-overview"] });
  });

  it("reports deciding while the rejection is on its way", async () => {
    let finish: (value: AccountDecision) => void = () => undefined;
    vi.mocked(decidePendingAccount).mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const { result } = renderTable();

    act(() => result.current.reject(kerem));

    await waitFor(() => expect(result.current.isDeciding).toBe(true));
    act(() => finish(decision("c-2")));
    await waitFor(() => expect(result.current.isDeciding).toBe(false));
  });

  it("keeps the review open and shows the server's message when the rejection fails", async () => {
    vi.mocked(decidePendingAccount).mockRejectedValue(
      new Error("Hesap bulunamadı."),
    );
    const { result } = renderTable();
    act(() => result.current.startReview("c-2"));

    act(() => result.current.reject(kerem));

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith({
        message: "Hesap bulunamadı.",
        tone: ToastTone.Error,
      }),
    );
    expect(result.current.review).toEqual(kerem);
  });

  it("falls back to the generic message when the rejection fails without an Error", async () => {
    vi.mocked(decidePendingAccount).mockRejectedValue("offline");
    const { result } = renderTable();

    act(() => result.current.reject(kerem));

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith({
        message: "Karar kaydedilemedi.",
        tone: ToastTone.Error,
      }),
    );
  });

  it("closes the approval and names the program the approved coordinator was assigned to", () => {
    const { result } = renderTable();
    act(() => result.current.startApproval(kerem));

    act(() => result.current.approved(kerem, "ODTÜ Stars 2026"));

    expect(result.current.approving).toBeNull();
    expect(showToast).toHaveBeenCalledWith({
      title: "Kerem Yıldız onaylandı",
      message: "ODTÜ Stars 2026 programına atandı.",
      tone: ToastTone.Success,
      action: { label: "Detay", onClick: expect.any(Function) },
    });
  });

  it("says when the approved coordinator already ran the program, and the toast's action opens their drawer", () => {
    const { result } = renderTable();

    act(() => result.current.approved(kerem, "ODTÜ Stars 2026", true));

    const toast = toastAt(0);
    expect(toast.message).toBe(
      "Zaten ODTÜ Stars 2026 programının koordinatörü.",
    );
    act(() => toast.action?.onClick());
    expect(result.current.selected).toEqual(kerem);
  });

  it("closes the approval and shows the error when the approval fails", () => {
    const { result } = renderTable();
    act(() => result.current.startApproval(kerem));

    act(() => result.current.approveFailed("Program dolu."));

    expect(result.current.approving).toBeNull();
    expect(showToast).toHaveBeenCalledWith({
      message: "Program dolu.",
      tone: ToastTone.Error,
    });
  });

  it("deactivates a coordinator's access through the access mutation", async () => {
    vi.mocked(setCoordinatorAccess).mockResolvedValue({
      id: "c-1",
      email: "deniz@tekno.co",
      fullName: "Deniz Acar",
      status: UserAccountStatus.Approved,
      outcome: null,
    });
    const { result } = renderTable();

    act(() => result.current.setAccess("c-1", false));

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith({
        message: "Deniz Acar pasife alındı; artık giriş yapamaz.",
        tone: ToastTone.Success,
      }),
    );
    expect(setCoordinatorAccess).toHaveBeenCalledWith("c-1", false);
  });
});

describe("useMentorsTable", () => {
  const ayse = adminUser({
    id: "mentor-1",
    fullName: "Ayşe Demir",
    email: "ayse@tekno.co",
    role: UserRole.Mentor,
    expertise: ["Finans"],
  });
  const mert = adminUser({
    id: "mentor-2",
    fullName: "Mert Can",
    email: "mert@tekno.co",
    role: UserRole.Mentor,
    status: UserAccountStatus.Pending,
  });
  const ece = adminUser({
    id: "mentor-3",
    fullName: "Ece Su",
    email: "ece@tekno.co",
    role: UserRole.Mentor,
    status: UserAccountStatus.Rejected,
  });
  const coordinator = adminUser({ id: "c-1", fullName: "Deniz Acar" });
  const alpha = adminProgram({
    id: "program-1",
    name: "Alpha",
    mentors: [
      {
        mentorId: "mentor-1",
        fullName: "Ayşe Demir",
        email: "ayse@tekno.co",
        status: ProgramMentorStatus.Pending,
      },
    ],
  });
  const beta = adminProgram({
    id: "program-2",
    name: "Beta",
    mentors: [
      {
        mentorId: "mentor-1",
        fullName: "Ayşe Demir",
        email: "ayse@tekno.co",
        status: ProgramMentorStatus.Accepted,
      },
    ],
  });
  const closed = adminProgram({
    id: "program-3",
    name: "Gamma",
    status: ProgramStatus.Completed,
  });
  const mentorship = adminMentorship({
    mentorId: "mentor-1",
    daysSinceMeeting: 3,
  });
  const data = overview({
    programs: [alpha, beta, closed],
    users: [ayse, mert, ece, coordinator],
    mentorships: [mentorship],
  });

  function renderTable(
    focus: string | null = null,
    queryClient = createTestQueryClient(),
  ) {
    return renderHook(
      ({ focusUserId }: { focusUserId: string | null }) =>
        useMentorsTable(data, focusUserId),
      {
        initialProps: { focusUserId: focus },
        wrapper: wrapperFor(queryClient),
      },
    );
  }

  const ayseRow = {
    user: ayse,
    programs: [alpha, beta],
    mentorships: [mentorship],
    stale: false,
    pendingInvite: true,
  };

  it("lists only mentors as rows with their programs, load and invitation", () => {
    const { result } = renderTable();

    expect(result.current.counts).toEqual({
      [UserFilter.All]: 3,
      [UserFilter.Active]: 1,
      [UserFilter.Pending]: 1,
      [UserFilter.Invited]: 1,
      [UserFilter.Inactive]: 1,
    });
    expect(result.current.total).toBe(3);
    expect(result.current.visible).toEqual([
      ayseRow,
      {
        user: mert,
        programs: [],
        mentorships: [],
        stale: false,
        pendingInvite: false,
      },
      {
        user: ece,
        programs: [],
        mentorships: [],
        stale: false,
        pendingInvite: false,
      },
    ]);
    expect(result.current.selected).toBeNull();
    expect(result.current.isDeciding).toBe(false);
  });

  it("narrows the rows by chip and by expertise in the search", () => {
    const { result } = renderTable();

    act(() => result.current.filters.onFilter(UserFilter.Invited));
    expect(result.current.visible.map((row) => row.user.id)).toEqual([
      "mentor-1",
    ]);

    act(() => result.current.filters.onFilter(UserFilter.All));
    act(() => result.current.filters.onSearch("finans"));
    expect(result.current.total).toBe(1);
    expect(result.current.visible.map((row) => row.user.id)).toEqual([
      "mentor-1",
    ]);
  });

  it("opens the selected mentor with the open programs they can still join", () => {
    const { result } = renderTable();

    act(() => result.current.select("mentor-1"));

    expect(result.current.selected).toEqual({
      ...ayseRow,
      assignable: [alpha],
    });

    act(() => result.current.closeDrawer());
    expect(result.current.selected).toBeNull();
  });

  it("opens the drawer when the ?user= focus moves to a mentor", () => {
    const { result, rerender } = renderTable();

    rerender({ focusUserId: "mentor-2" });

    expect(result.current.selected?.user).toEqual(mert);
  });

  it("ignores a focus on someone who is not a mentor", () => {
    const { result, rerender } = renderTable();

    rerender({ focusUserId: "c-1" });

    expect(result.current.selected).toBeNull();
  });

  it("approves a pending mentor, says so and refreshes the lists", async () => {
    vi.mocked(decidePendingAccount).mockResolvedValue(decision("mentor-2"));
    const queryClient = createTestQueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderTable(null, queryClient);

    act(() => result.current.decideAccount(mert, UserAccountStatus.Approved));

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith({
        message: "Mert Can onaylandı.",
        tone: ToastTone.Success,
      }),
    );
    expect(decidePendingAccount).toHaveBeenCalledWith(
      "mentor-2",
      UserAccountStatus.Approved,
    );
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ["pending-accounts"],
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["admin-overview"] });
  });

  it("rejects a pending mentor and says so", async () => {
    vi.mocked(decidePendingAccount).mockResolvedValue(decision("mentor-2"));
    const { result } = renderTable();

    act(() => result.current.decideAccount(mert, UserAccountStatus.Rejected));

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith({
        message: "Mert Can reddedildi.",
        tone: ToastTone.Success,
      }),
    );
    expect(decidePendingAccount).toHaveBeenCalledWith(
      "mentor-2",
      UserAccountStatus.Rejected,
    );
  });

  it("shows the server's message when the decision fails", async () => {
    vi.mocked(decidePendingAccount).mockRejectedValue(
      new Error("Yetkiniz yok."),
    );
    const { result } = renderTable();

    act(() => result.current.decideAccount(mert, UserAccountStatus.Approved));

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith({
        message: "Yetkiniz yok.",
        tone: ToastTone.Error,
      }),
    );
  });

  it("falls back to the generic message when the decision fails without an Error", async () => {
    vi.mocked(decidePendingAccount).mockRejectedValue(500);
    const { result } = renderTable();

    act(() => result.current.decideAccount(mert, UserAccountStatus.Rejected));

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith({
        message: "Karar kaydedilemedi.",
        tone: ToastTone.Error,
      }),
    );
  });
});

describe("useTeamsTable", () => {
  const lumen = adminStartup({ id: "org-1", name: "Lumen" });
  const nova = adminStartup({ id: "org-2", name: "Nova" });
  const lumenInBeta = adminStartup({
    id: "org-1",
    name: "Lumen",
    programId: "program-2",
    programName: "Beta",
  });
  const mentorship = adminMentorship({
    organizationId: "org-1",
    programId: "program-1",
    daysSinceMeeting: 20,
  });
  const data = overview({
    programs: [
      adminProgram({ id: "program-1", startups: [lumen, nova, lumen] }),
      adminProgram({ id: "program-2", name: "Beta", startups: [lumenInBeta] }),
    ],
    mentorships: [
      mentorship,
      { ...mentorship, id: "m-2", status: MentorshipStatus.Completed },
    ],
  });

  it("lists each team once per program with its mentorship and health", () => {
    const { result } = renderHook(() => useTeamsTable(data));

    expect(result.current.counts).toEqual({
      [UserFilter.All]: 3,
      [UserFilter.Mentored]: 1,
      [UserFilter.Waiting]: 2,
      [UserFilter.Risky]: 1,
    });
    expect(result.current.total).toBe(3);
    expect(result.current.visible).toEqual([
      {
        startup: lumen,
        key: "program-1:org-1",
        mentorship,
        members: [],
        health: TeamHealth.Risky,
      },
      {
        startup: nova,
        key: "program-1:org-2",
        mentorship: undefined,
        members: [],
        health: null,
      },
      {
        startup: lumenInBeta,
        key: "program-2:org-1",
        mentorship: undefined,
        members: [],
        health: null,
      },
    ]);
    expect(result.current.selected).toBeNull();
  });

  it("narrows the rows by chip and program", () => {
    const { result } = renderHook(() => useTeamsTable(data));

    act(() => result.current.filters.onFilter(UserFilter.Waiting));
    expect(result.current.visible.map((row) => row.key)).toEqual([
      "program-1:org-2",
      "program-2:org-1",
    ]);

    act(() => result.current.filters.onProgram("Beta"));
    expect(result.current.visible.map((row) => row.key)).toEqual([
      "program-2:org-1",
    ]);
  });

  it("opens the team of the chosen program by its key and closes it again", () => {
    const { result } = renderHook(() => useTeamsTable(data));

    act(() => result.current.select("program-2:org-1"));
    expect(result.current.selected).toEqual(lumenInBeta);

    act(() => result.current.select("program-9:org-1"));
    expect(result.current.selected).toBeNull();

    act(() => result.current.select("program-1:org-2"));
    act(() => result.current.closeDrawer());
    expect(result.current.selected).toBeNull();
  });

  it("has no rows when there are no programs", () => {
    const { result } = renderHook(() => useTeamsTable(overview()));

    expect(result.current.total).toBe(0);
    expect(result.current.visible).toEqual([]);
    expect(result.current.counts).toEqual({
      [UserFilter.All]: 0,
      [UserFilter.Mentored]: 0,
      [UserFilter.Waiting]: 0,
      [UserFilter.Risky]: 0,
    });
  });
});
