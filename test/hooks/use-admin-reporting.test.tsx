import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAdminReporting } from "@/hooks/use-admin-reporting";
import {
  BottleneckSeverity,
  type AdminOverview,
} from "@/interfaces/admin-overview";
import { ProgramStatus, ProgramType } from "@/interfaces/program";
import { getProgramMeetingRatings } from "@/lib/client/program-report";
import { isoDay } from "@/lib/coordinator-calendar";
import { ALL_PROGRAM_TYPES } from "@/lib/program-types";
import { ReportRange, ReportTab } from "@/types/admin-reporting";
import {
  adminMentorship,
  adminProgram,
  adminStartup,
} from "@test/fixtures/admin-programs";
import { itemAt } from "@test/fixtures/list-assertions";
import { programMeetingRatings } from "@test/fixtures/program-report";
import { createTestQueryClient, freezeDate } from "@test/test-utils";

vi.mock("@/lib/client/program-report", () => ({
  getProgramMeetingFeedback: vi.fn(),
  getProgramMeetingRatings: vi.fn(),
  getProgramReport: vi.fn(),
  getProgramSessions: vi.fn(),
  programSessionsExportHref: vi.fn(),
}));

/** A Wednesday; its week starts on Monday 2026-11-09. */
const NOW = "2026-11-11T12:00:00+03:00";

const EIGHT_WEEKS = [
  "2026-09-21",
  "2026-09-28",
  "2026-10-05",
  "2026-10-12",
  "2026-10-19",
  "2026-10-26",
  "2026-11-02",
  "2026-11-09",
];

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

const finished = adminProgram({
  id: "program-0",
  name: "Eski Program",
  status: ProgramStatus.Completed,
  createdAt: "2025-09-01T00:00:00Z",
});
const alpha = adminProgram({
  id: "program-1",
  name: "Alpha",
  createdAt: "2026-10-01T00:00:00Z",
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
const lumenPair = adminMentorship({
  id: "m-1",
  organizationId: "org-1",
  programId: "program-1",
  daysSinceMeeting: 3,
  goalDone: 2,
  goalTotal: 4,
});
const novaPair = adminMentorship({
  id: "m-2",
  mentorId: "mentor-2",
  mentorName: "Can Öz",
  organizationId: "org-2",
  organizationName: "Nova",
  programId: null,
  daysSinceMeeting: 20,
});
const orbitPair = adminMentorship({
  id: "m-3",
  organizationId: "org-3",
  organizationName: "Orbit",
  programId: "program-2",
  daysSinceMeeting: 1,
});
const data = overview({
  programs: [finished, alpha, beta],
  mentorships: [lumenPair, novaPair, orbitPair],
  bottlenecks: [
    {
      id: "b-1",
      title: "Prototip gecikiyor",
      severity: BottleneckSeverity.High,
      status: "OPEN",
      organizationId: "org-2",
      organizationName: "Nova",
      createdAt: "2026-11-01T09:00:00Z",
    },
  ],
});

const alphaPairs = [
  { ...lumenPair, bottlenecks: 0, stale: false, goalDone: 2, goalTotal: 4 },
  { ...novaPair, bottlenecks: 1, stale: true, goalDone: 0, goalTotal: 0 },
];

function wrapperFor(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

function renderReporting(source = data) {
  return renderHook(() => useAdminReporting(source), {
    wrapper: wrapperFor(createTestQueryClient()),
  });
}

beforeEach(() => {
  freezeDate(NOW);
  vi.clearAllMocks();
  vi.mocked(getProgramMeetingRatings).mockResolvedValue(
    programMeetingRatings(),
  );
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useAdminReporting", () => {
  it("opens on the first active program of every type over the last eight weeks", async () => {
    const { result } = renderReporting();

    expect(result.current.type).toBe(ALL_PROGRAM_TYPES);
    expect(result.current.programs).toEqual([finished, alpha, beta]);
    expect(result.current.program).toEqual(alpha);
    expect(result.current.range).toBe(ReportRange.EightWeeks);
    expect(result.current.tab).toBe(ReportTab.Program);
    expect(result.current.weeks.map(isoDay)).toEqual(EIGHT_WEEKS);
    expect(result.current.pairs).toEqual(alphaPairs);
    expect(result.current.selected).toBeNull();
    expect(result.current.ratingsFrom).toBe("2026-09-21");
    await waitFor(() =>
      expect(result.current.ratingsQuery.data).toEqual(programMeetingRatings()),
    );
    expect(getProgramMeetingRatings).toHaveBeenCalledWith(
      "program-1",
      "2026-09-21",
    );
  });

  it("selects one of the program's pairs, and nothing for a pair from elsewhere", () => {
    const { result } = renderReporting();

    act(() => result.current.selectPair("m-2"));
    expect(result.current.selected).toEqual(itemAt(alphaPairs, 1));

    act(() => result.current.selectPair("m-3"));
    expect(result.current.selected).toBeNull();
  });

  it("drops the selected pair and loads the ratings of a newly chosen program", async () => {
    const { result } = renderReporting();
    act(() => result.current.selectPair("m-1"));

    act(() => result.current.chooseProgram("program-0"));

    expect(result.current.program).toEqual(finished);
    expect(result.current.pairs).toEqual([]);
    expect(result.current.selected).toBeNull();
    await waitFor(() =>
      expect(getProgramMeetingRatings).toHaveBeenCalledWith(
        "program-0",
        "2026-09-21",
      ),
    );
  });

  it("starts a new type over on its default program with no pair selected", () => {
    const { result } = renderReporting();
    act(() => result.current.chooseProgram("program-0"));
    act(() => result.current.selectPair("m-3"));

    act(() => result.current.chooseType(ProgramType.PeerMentoring));

    expect(result.current.type).toBe(ProgramType.PeerMentoring);
    expect(result.current.programs).toEqual([beta]);
    expect(result.current.program).toEqual(beta);
    expect(result.current.pairs).toEqual([
      { ...orbitPair, bottlenecks: 0, stale: false, goalDone: 0, goalTotal: 0 },
    ]);
    expect(result.current.selected).toBeNull();

    act(() => result.current.chooseType(ALL_PROGRAM_TYPES));

    expect(result.current.program).toEqual(alpha);
  });

  it("has no program or pairs for a type with no programs, and loads no ratings", () => {
    const { result } = renderReporting();

    act(() => result.current.chooseType(ProgramType.OfficeHours));

    expect(result.current.programs).toEqual([]);
    expect(result.current.program).toBeNull();
    expect(result.current.pairs).toEqual([]);
    expect(result.current.ratingsQuery.fetchStatus).toBe("idle");
  });

  it("covers thirteen weeks for a quarter and asks for the ratings from its first day", async () => {
    const { result } = renderReporting();

    act(() => result.current.setRange(ReportRange.Quarter));

    expect(result.current.range).toBe(ReportRange.Quarter);
    expect(result.current.weeks).toHaveLength(13);
    expect(isoDay(itemAt(result.current.weeks, 0))).toBe("2026-08-17");
    expect(result.current.ratingsFrom).toBe("2026-08-17");
    await waitFor(() =>
      expect(getProgramMeetingRatings).toHaveBeenCalledWith(
        "program-1",
        "2026-08-17",
      ),
    );
  });

  it("covers the weeks since the program started and every rating for the whole program", async () => {
    const { result } = renderReporting();

    act(() => result.current.setRange(ReportRange.WholeProgram));

    expect(result.current.weeks.map(isoDay)).toEqual([
      "2026-09-28",
      "2026-10-05",
      "2026-10-12",
      "2026-10-19",
      "2026-10-26",
      "2026-11-02",
      "2026-11-09",
    ]);
    expect(result.current.ratingsFrom).toBeNull();
    await waitFor(() =>
      expect(getProgramMeetingRatings).toHaveBeenCalledWith("program-1", null),
    );
  });

  it("switches tabs", () => {
    const { result } = renderReporting();

    act(() => result.current.setTab(ReportTab.Health));

    expect(result.current.tab).toBe(ReportTab.Health);
  });

  it("has no program, no pairs and no ratings request when there are no programs", () => {
    const { result } = renderReporting(overview());

    expect(result.current.programs).toEqual([]);
    expect(result.current.program).toBeNull();
    expect(result.current.pairs).toEqual([]);
    expect(result.current.weeks.map(isoDay)).toEqual(EIGHT_WEEKS);
    expect(result.current.ratingsQuery.fetchStatus).toBe("idle");
    expect(result.current.ratingsQuery.data).toBeUndefined();
    expect(getProgramMeetingRatings).not.toHaveBeenCalled();
  });

  it("keeps eight weeks and asks for every rating over the whole program when there is no program", () => {
    const { result } = renderReporting(overview());

    act(() => result.current.setRange(ReportRange.WholeProgram));

    expect(result.current.weeks.map(isoDay)).toEqual(EIGHT_WEEKS);
    expect(result.current.ratingsFrom).toBeNull();
    expect(getProgramMeetingRatings).not.toHaveBeenCalled();
  });
});
