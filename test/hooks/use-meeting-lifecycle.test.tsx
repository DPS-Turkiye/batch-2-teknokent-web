import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  useMeetingFeedback,
  useMeetingLifecycle,
} from "@/hooks/use-meeting-lifecycle";
import { RATED_MEETINGS_QUERY_KEY } from "@/hooks/use-meetings-awaiting-feedback";
import { MeetingStatus } from "@/interfaces/meeting";
import { ToastTone } from "@/interfaces/toast";
import {
  getMeetingFeedback,
  getMeetings,
  postMeetingFeedback,
  updateMeeting,
  type MeetingFeedbackItem,
} from "@/lib/client/meetings";
import { useToastStore } from "@/stores/toast-store";
import { menteeMeetingFixture } from "@test/fixtures/mentee-home";
import { queryWrapper } from "@test/fixtures/query-wrapper";

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
  search: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: navigation.push }),
  useSearchParams: () => navigation.search,
}));
vi.mock("@/lib/client/meetings", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/client/meetings")>()),
  getMeetings: vi.fn(),
  updateMeeting: vi.fn(),
  getMeetingFeedback: vi.fn(),
  postMeetingFeedback: vi.fn(),
}));

const completed = menteeMeetingFixture({
  id: "done",
  status: MeetingStatus.Completed,
  notes: "Eski notlar",
});
const scheduled = menteeMeetingFixture({
  id: "next/1",
  status: MeetingStatus.Scheduled,
  notes: "Gündem",
  outcomes: "Kararlar",
});

function toasts() {
  return useToastStore
    .getState()
    .toasts.map(({ message, tone }) => ({ message, tone }));
}

function feedback(
  overrides: Partial<MeetingFeedbackItem> = {},
): MeetingFeedbackItem {
  return {
    id: "fb-1",
    meetingId: "m-1",
    authorId: "mentee-1",
    ratings: [5, 4, 3, 2],
    benefits: [],
    createdAt: "2026-09-02T10:00:00Z",
    ...overrides,
  };
}

describe("useMeetingLifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigation.search = new URLSearchParams();
    vi.mocked(getMeetings).mockResolvedValue([completed, scheduled]);
    vi.mocked(updateMeeting).mockImplementation(async (id, payload) => ({
      ...scheduled,
      id,
      ...payload,
    }));
  });

  async function renderLoaded() {
    const view = renderHook(() => useMeetingLifecycle(), queryWrapper());
    await waitFor(() => expect(view.result.current.isLoading).toBe(false));
    return view;
  }

  it("opens the next scheduled meeting and fills the draft from it", async () => {
    const { result } = await renderLoaded();

    expect(result.current.meeting?.id).toBe("next/1");
    expect(result.current.notes).toBe("Gündem");
    expect(result.current.outcomes).toBe("Kararlar");
  });

  it("opens the meeting named in the link", async () => {
    navigation.search = new URLSearchParams({ id: "done" });

    const { result } = await renderLoaded();

    expect(result.current.meeting?.id).toBe("done");
    expect(result.current.notes).toBe("Eski notlar");
    expect(result.current.outcomes).toBe("");
  });

  it("falls back to the scheduled meeting when the linked one is not the user's", async () => {
    navigation.search = new URLSearchParams({ id: "someone-elses" });

    const { result } = await renderLoaded();

    expect(result.current.meeting?.id).toBe("next/1");
  });

  it("falls back to the first meeting when none is scheduled", async () => {
    vi.mocked(getMeetings).mockResolvedValue([completed]);

    const { result } = await renderLoaded();

    expect(result.current.meeting?.id).toBe("done");
  });

  it("has no meeting, plain links and does nothing on save when the user has none", async () => {
    vi.mocked(getMeetings).mockResolvedValue([]);
    const { result } = await renderLoaded();

    await act(() => result.current.saveNotes());
    await act(() => result.current.completeMeeting());

    expect(result.current.meeting).toBeNull();
    expect(result.current.meetingHref("/meetings/research/summary")).toBe(
      "/meetings/research/summary",
    );
    expect(updateMeeting).not.toHaveBeenCalled();
    expect(navigation.push).not.toHaveBeenCalled();
  });

  it("links to a page with the meeting's encoded id", async () => {
    const { result } = await renderLoaded();

    expect(result.current.meetingHref("/meetings/research/about")).toBe(
      "/meetings/research/about?id=next%2F1",
    );
  });

  it("saves the edited notes and goes on to the summary", async () => {
    const { result } = await renderLoaded();

    act(() => {
      result.current.setNotes("Yeni notlar");
      result.current.setOutcomes("Yeni kararlar");
    });
    await act(() => result.current.saveNotes());

    expect(updateMeeting).toHaveBeenCalledWith("next/1", {
      notes: "Yeni notlar",
      outcomes: "Yeni kararlar",
    });
    expect(toasts()).toEqual([
      { message: "Görüşme notları kaydedildi.", tone: ToastTone.Success },
    ]);
    expect(navigation.push).toHaveBeenCalledWith(
      "/meetings/research/summary?id=next%2F1",
    );
  });

  it("stays on the page and says so when saving the notes fails", async () => {
    vi.mocked(updateMeeting).mockRejectedValue(new Error("offline"));
    const { result } = await renderLoaded();

    await act(() => result.current.saveNotes());

    expect(toasts()).toEqual([
      { message: "Görüşme notları kaydedilemedi.", tone: ToastTone.Error },
    ]);
    expect(navigation.push).not.toHaveBeenCalled();
    await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));
  });

  it("completes the meeting with its notes and goes on to the feedback", async () => {
    const { result } = await renderLoaded();

    await act(() => result.current.completeMeeting());

    expect(updateMeeting).toHaveBeenCalledWith("next/1", {
      notes: "Gündem",
      outcomes: "Kararlar",
      status: MeetingStatus.Completed,
    });
    expect(toasts()).toEqual([
      { message: "Görüşme tamamlandı.", tone: ToastTone.Success },
    ]);
    expect(navigation.push).toHaveBeenCalledWith(
      "/meetings/research/feedback?id=next%2F1",
    );
  });

  it("stays on the page and says so when completing fails", async () => {
    vi.mocked(updateMeeting).mockRejectedValue(new Error("offline"));
    const { result } = await renderLoaded();

    await act(() => result.current.completeMeeting());

    expect(toasts()).toEqual([
      { message: "Görüşme tamamlanamadı.", tone: ToastTone.Error },
    ]);
    expect(navigation.push).not.toHaveBeenCalled();
  });

  it("refills the draft when the link moves to another meeting", async () => {
    const { result, rerender } = await renderLoaded();
    act(() => result.current.setNotes("Kaydedilmemiş"));

    navigation.search = new URLSearchParams({ id: "done" });
    rerender();

    expect(result.current.meeting?.id).toBe("done");
    expect(result.current.notes).toBe("Eski notlar");
  });
});

describe("useMeetingFeedback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getMeetingFeedback).mockResolvedValue(null);
    vi.mocked(postMeetingFeedback).mockResolvedValue(feedback());
  });

  async function renderFor(meetingId: string | null) {
    const view = renderHook(
      () => useMeetingFeedback(meetingId),
      queryWrapper(),
    );
    await waitFor(() =>
      expect(view.result.current.isFeedbackLoading).toBe(false),
    );
    return view;
  }

  function rateAll(
    result: { current: ReturnType<typeof useMeetingFeedback> },
    value: number,
  ) {
    act(() => {
      result.current.ratings.forEach((_, index) => {
        result.current.rate(index, value);
      });
    });
  }

  it("cannot be sent until every question is rated", async () => {
    const { result } = await renderFor("m-1");

    expect(result.current.ratings).toEqual([0, 0, 0, 0]);
    expect(result.current.canSubmit).toBe(false);

    act(() => result.current.rate(0, 4));
    expect(result.current.ratings).toEqual([4, 0, 0, 0]);
    expect(result.current.canSubmit).toBe(false);

    rateAll(result, 3);
    expect(result.current.canSubmit).toBe(true);
  });

  it("toggles a benefit on and off again", async () => {
    const { result } = await renderFor("m-1");

    act(() => result.current.toggleBenefit("Finansal modeli anlamak"));
    expect([...result.current.selectedBenefits]).toEqual([
      "Finansal modeli anlamak",
    ]);

    act(() => result.current.toggleBenefit("Finansal modeli anlamak"));
    expect(result.current.selectedBenefits.size).toBe(0);
  });

  it("sends the ratings with the trimmed note as one more benefit, then locks", async () => {
    const { result } = await renderFor("m-1");
    rateAll(result, 5);
    act(() => {
      result.current.toggleBenefit("Somut aksiyonlar belirlemek");
      result.current.setNextMeetingNote("  Daha çok finans  ");
    });

    await act(() => result.current.submit());

    expect(postMeetingFeedback).toHaveBeenCalledWith("m-1", {
      ratings: [5, 5, 5, 5],
      benefits: ["Somut aksiyonlar belirlemek", "Daha çok finans"],
    });
    expect(result.current.submitted).toBe(true);
    expect(result.current.canSubmit).toBe(false);
    expect(toasts()).toEqual([
      { message: "Değerlendirmen gönderildi.", tone: ToastTone.Success },
    ]);

    act(() => result.current.rate(0, 1));
    expect(result.current.ratings[0]).toBe(5);
  });

  it("leaves a blank note out of the benefits", async () => {
    const { result } = await renderFor("m-1");
    rateAll(result, 2);
    act(() => result.current.setNextMeetingNote("   "));

    await act(() => result.current.submit());

    expect(postMeetingFeedback).toHaveBeenCalledWith("m-1", {
      ratings: [2, 2, 2, 2],
      benefits: [],
    });
  });

  it("refreshes this meeting's feedback and the rated list after sending", async () => {
    const { queryClient, wrapper } = queryWrapper();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useMeetingFeedback("m-1"), {
      wrapper,
    });
    await waitFor(() => expect(result.current.isFeedbackLoading).toBe(false));
    rateAll(result, 4);

    await act(() => result.current.submit());

    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ["meeting-feedback", "m-1"],
    });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: RATED_MEETINGS_QUERY_KEY,
    });
  });

  it("keeps the draft editable and shows the failure when sending fails", async () => {
    vi.mocked(postMeetingFeedback).mockRejectedValue(new Error("offline"));
    const { result } = await renderFor("m-1");
    rateAll(result, 3);

    await act(() => result.current.submit());

    const failed = "Değerlendirme kaydedilemedi. Lütfen tekrar deneyin.";
    expect(result.current.submitError).toBe(failed);
    expect(result.current.submitted).toBe(false);
    expect(result.current.submitting).toBe(false);
    expect(result.current.canSubmit).toBe(true);
    expect(toasts()).toEqual([{ message: failed, tone: ToastTone.Error }]);
  });

  it("says there is no meeting instead of sending when none is chosen", async () => {
    const { result } = await renderFor(null);
    rateAll(result, 3);

    await act(() => result.current.submit());

    expect(getMeetingFeedback).not.toHaveBeenCalled();
    expect(postMeetingFeedback).not.toHaveBeenCalled();
    expect(result.current.submitError).toBe(
      "Değerlendirilecek toplantı bulunamadı.",
    );
  });

  it("shows saved feedback read-only, splitting known benefits from the free note", async () => {
    vi.mocked(getMeetingFeedback).mockResolvedValue(
      feedback({
        ratings: [5, 4],
        benefits: [
          "Önceliklerimi netleştirmek",
          "Maliyetleri konuşalım",
          "Kaynak / bağlantı önerileri",
          "Daha uzun olsun",
        ],
      }),
    );
    const { result } = await renderFor("m-1");

    expect(result.current.readOnly).toBe(true);
    expect(result.current.ratings).toEqual([5, 4, 0, 0]);
    expect([...result.current.selectedBenefits]).toEqual([
      "Önceliklerimi netleştirmek",
      "Kaynak / bağlantı önerileri",
    ]);
    expect(result.current.nextMeetingNote).toBe(
      "Maliyetleri konuşalım\nDaha uzun olsun",
    );

    act(() => {
      result.current.rate(2, 5);
      result.current.toggleBenefit("Finansal modeli anlamak");
      result.current.setNextMeetingNote("değişiklik");
    });
    await act(() => result.current.submit());

    expect(result.current.ratings).toEqual([5, 4, 0, 0]);
    expect(result.current.selectedBenefits.size).toBe(2);
    expect(result.current.nextMeetingNote).toBe(
      "Maliyetleri konuşalım\nDaha uzun olsun",
    );
    expect(postMeetingFeedback).not.toHaveBeenCalled();
  });
});
