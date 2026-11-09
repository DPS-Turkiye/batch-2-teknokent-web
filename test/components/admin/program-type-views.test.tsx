import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MentorshipsView } from "@/components/admin/mentorships-view";
import { ReportingView } from "@/components/admin/reporting-view";
import type { AdminOverview, AdminProgram } from "@/interfaces/admin-overview";
import { ProgramStatus, ProgramType } from "@/interfaces/program";
import { renderWithQueryClient } from "@test/test-utils";
import {
  meetingFeedbackState,
  reportOverview,
} from "@test/fixtures/program-report";

const state = vi.hoisted(() => ({ overview: null as AdminOverview | null }));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/hooks/use-admin-overview", () => ({
  useAdminOverview: () => ({
    data: state.overview,
    isLoading: false,
    error: null,
  }),
}));
vi.mock("@/hooks/use-admin-interventions", () => ({
  useAdminInterventions: () => ({ data: [], isLoading: false, error: null }),
  useOpenIntervention: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useResolveIntervention: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock("@/hooks/use-program-report", () => ({
  useProgramMeetingRatings: () => ({
    data: null,
    isLoading: false,
    error: null,
  }),
  useProgramMeetingFeedback: () => meetingFeedbackState(),
}));

function withPrograms(): AdminOverview {
  const base = reportOverview();
  const startup = base.programs[0];
  const peer: AdminProgram = {
    ...startup,
    id: "program-peer",
    name: "İŞKUR Akran 2026",
    type: ProgramType.PeerMentoring,
    status: ProgramStatus.Active,
    startups: [],
    mentors: [],
  };
  return { ...base, programs: [startup, peer] };
}

describe("program type on admin Mentorluklar and Raporlama", () => {
  it("labels each program with its type and narrows Mentorluklar to one type", async () => {
    state.overview = withPrograms();
    const user = userEvent.setup();
    renderWithQueryClient(<MentorshipsView tab="overview" />);

    expect(
      screen.getByText("İŞKUR Akran 2026", { selector: "span" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Akran Mentörlüğü", { selector: "span" }),
    ).toBeInTheDocument();
    const scope = screen.getByRole("combobox", { name: "Kapsam:" });
    expect(within(scope).getAllByRole("option")).toHaveLength(3);

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Program türü" }),
      ProgramType.PeerMentoring,
    );

    expect(
      screen.queryByText("ODTÜ Stars 2026", { selector: "span" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("İŞKUR Akran 2026", { selector: "span" }),
    ).toBeInTheDocument();
    expect(within(scope).getAllByRole("option")).toHaveLength(2);
  });

  it("lets Raporlama pick a type first and shows the program's type", async () => {
    state.overview = withPrograms();
    const user = userEvent.setup();
    renderWithQueryClient(<ReportingView />);

    expect(screen.getByText(/ODTÜ Stars 2026 ·/)).toBeInTheDocument();
    expect(screen.getAllByText("Girişim Mentörlüğü").length).toBeGreaterThan(0);

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Program türü" }),
      ProgramType.PeerMentoring,
    );

    expect(screen.getByText(/İŞKUR Akran 2026 ·/)).toBeInTheDocument();
    const picker = screen.getByLabelText("Program");
    expect(within(picker).getAllByRole("option")).toHaveLength(1);
  });
});
