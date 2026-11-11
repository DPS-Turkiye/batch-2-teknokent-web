import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MeetingFeedbackList } from "@/components/admin/meeting-feedback-list";
import { useProgramMeetingFeedback } from "@/hooks/use-program-report";
import { MeetingFeedbackSide } from "@/interfaces/program-report";
import {
  meetingFeedbackState,
  programMeetingFeedback,
} from "@test/fixtures/program-report";
import { InLocale } from "@test/test-utils";

vi.mock("@/hooks/use-program-report", () => ({
  useProgramMeetingFeedback: vi.fn(),
}));

function renderList(locale: "tr" | "en" = "tr") {
  return render(
    <InLocale locale={locale}>
      <MeetingFeedbackList programId="program-1" from="2026-11-01" />
    </InLocale>,
  );
}

describe("MeetingFeedbackList", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows who rated whom, for which meeting, with the scores, qualities and note", () => {
    vi.mocked(useProgramMeetingFeedback).mockReturnValue(
      meetingFeedbackState({
        total: 2,
        totalPages: 1,
        feedback: [
          programMeetingFeedback(),
          programMeetingFeedback({
            id: "feedback-2",
            authorName: "Leyla Aksoy",
            side: MeetingFeedbackSide.Mentor,
            ratings: [4, 3],
            qualities: ["Hazırlıklı"],
            note: null,
          }),
        ],
      }),
    );

    renderList();

    expect(useProgramMeetingFeedback).toHaveBeenCalledWith(
      "program-1",
      "2026-11-01",
    );
    expect(screen.getByText("Kim kimi değerlendirdi")).toBeInTheDocument();
    expect(screen.getByText("2 değerlendirme")).toBeInTheDocument();
    const [mentee, mentor] = screen
      .getAllByRole("listitem")
      .filter((item) => item.textContent.includes("değerlendirdi"));
    expect(mentee).toHaveTextContent("UX Flow Review");
    expect(mentee).toHaveTextContent("Lumen · Mentor: Leyla Aksoy");
    expect(mentee).toHaveTextContent("Gülse Buran değerlendirdi");
    expect(mentee).toHaveTextContent("Mentee");
    expect(mentee).toHaveTextContent("Sonraki adımlar netleşti 5/5");
    expect(mentee).toHaveTextContent("Somut aksiyonlar belirlemek");
    expect(mentee).toHaveTextContent(
      "Not: Satış hunisini bir dahaki sefere konuşalım.",
    );
    expect(mentor).toHaveTextContent("Leyla Aksoy değerlendirdi");
    expect(mentor).toHaveTextContent("Mentee hazırlıklıydı 4/5");
    expect(mentor).toHaveTextContent("Sonuç netleşti Kısmen");
    expect(mentor).not.toHaveTextContent("3/5");
    expect(mentor).toHaveTextContent("Hazırlıklı");
    expect(mentor).not.toHaveTextContent("Not:");
  });

  it("says so when nobody has rated yet", () => {
    vi.mocked(useProgramMeetingFeedback).mockReturnValue(
      meetingFeedbackState(),
    );

    renderList();

    expect(
      screen.getByText("Bu pencerede henüz değerlendirme yok."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("pages through longer lists", () => {
    const next = vi.fn();
    const previous = vi.fn();
    vi.mocked(useProgramMeetingFeedback).mockReturnValue(
      meetingFeedbackState({
        feedback: [programMeetingFeedback()],
        total: 45,
        page: 1,
        totalPages: 3,
        hasPrevious: true,
        hasNext: true,
        next,
        previous,
      }),
    );

    renderList();
    fireEvent.click(screen.getByRole("button", { name: "Sonraki" }));
    fireEvent.click(screen.getByRole("button", { name: "Önceki" }));

    expect(
      screen.getByRole("navigation", { name: "Değerlendirme sayfaları" }),
    ).toHaveTextContent("Sayfa 2/3");
    expect(next).toHaveBeenCalledOnce();
    expect(previous).toHaveBeenCalledOnce();
  });

  it("reads in English", () => {
    vi.mocked(useProgramMeetingFeedback).mockReturnValue(
      meetingFeedbackState({
        total: 1,
        totalPages: 1,
        feedback: [programMeetingFeedback()],
      }),
    );

    renderList("en");

    expect(screen.getByText("Who rated whom")).toBeInTheDocument();
    expect(screen.getByText("1 rating")).toBeInTheDocument();
    expect(screen.getByText("Rated by Gülse Buran")).toBeInTheDocument();
    expect(
      screen.queryByText("Somut aksiyonlar belirlemek"),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/Next steps got clearer/)).toBeInTheDocument();
  });
});
