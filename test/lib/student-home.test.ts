import { describe, expect, it } from "vitest";

import { AppointmentStatus } from "@/interfaces/appointment";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import {
  greetingName,
  isAwaitingAnswer,
  openPeerRequests,
  recommendedPeerMentors,
  STUDENT_HOME_MENTOR_COUNT,
  STUDENT_HOME_PREVIEW,
  summarizeAppointments,
  waitingPreview,
} from "@/lib/student-home";
import { itemAt } from "@test/fixtures/list-assertions";
import {
  PEER_MENTORS_FIXTURE,
  peerMentoringRequestsFixture,
} from "@test/fixtures/peer-mentoring";
import {
  APPOINTMENTS_NOW,
  peerAppointment,
  STUDENT_APPOINTMENTS,
} from "@test/fixtures/student-appointments";

describe("summarizeAppointments", () => {
  it("puts the soonest session first and counts confirmed ones apart from requests", () => {
    const pending = peerAppointment({
      id: "pending",
      status: AppointmentStatus.Pending,
      startsAt: "2026-11-13T08:00:00.000Z",
      endsAt: "2026-11-13T08:30:00.000Z",
    });
    const summary = summarizeAppointments(
      [...STUDENT_APPOINTMENTS, pending],
      APPOINTMENTS_NOW,
    );

    expect(summary.next?.id).toBe("meeting-2");
    expect(summary.upcoming.map((item) => item.id)).toEqual([
      "meeting-2",
      "meeting-1",
      "pending",
    ]);
    expect(summary.confirmedCount).toBe(2);
    expect(summary.awaiting.map((item) => item.id)).toEqual(["pending"]);
  });

  it(`shows at most ${STUDENT_HOME_PREVIEW} upcoming rows`, () => {
    const many = Array.from({ length: 5 }, (_, index) =>
      peerAppointment({
        id: `m-${index}`,
        startsAt: `2026-11-2${index}T08:00:00.000Z`,
        endsAt: `2026-11-2${index}T08:30:00.000Z`,
      }),
    );
    const summary = summarizeAppointments(many, APPOINTMENTS_NOW);
    expect(summary.upcoming).toHaveLength(STUDENT_HOME_PREVIEW);
    expect(summary.confirmedCount).toBe(5);
  });

  it("has nothing next without appointments", () => {
    expect(summarizeAppointments([], APPOINTMENTS_NOW)).toEqual({
      next: null,
      upcoming: [],
      confirmedCount: 0,
      awaiting: [],
    });
  });
});

describe("isAwaitingAnswer", () => {
  it("counts pending and alternative-proposed sessions as requests", () => {
    expect(
      isAwaitingAnswer(peerAppointment({ status: AppointmentStatus.Pending })),
    ).toBe(true);
    expect(
      isAwaitingAnswer(
        peerAppointment({ status: AppointmentStatus.AlternativeProposed }),
      ),
    ).toBe(true);
    expect(isAwaitingAnswer(peerAppointment())).toBe(false);
  });
});

describe("openPeerRequests", () => {
  it("keeps the unanswered requests, newest first", () => {
    const first = itemAt(peerMentoringRequestsFixture(), 0);
    const newer = {
      ...first,
      id: "newer",
      createdAt: "2026-11-08T10:00:00+03:00",
    };
    const accepted = {
      ...first,
      id: "accepted",
      status: MentorshipRequestStatus.Accepted,
    };
    expect(
      openPeerRequests([first, accepted, newer]).map((item) => item.id),
    ).toEqual(["newer", first.id]);
  });
});

describe("recommendedPeerMentors", () => {
  it("skips full mentors and those without a reason, and keeps the backend order", () => {
    const full = { ...itemAt(PEER_MENTORS_FIXTURE, 0), capacityFull: true };
    const picked = recommendedPeerMentors([
      full,
      ...PEER_MENTORS_FIXTURE.slice(1),
    ]);
    expect(picked.length).toBeLessThanOrEqual(STUDENT_HOME_MENTOR_COUNT);
    expect(picked.map((mentor) => mentor.mentorId)).not.toContain(
      full.mentorId,
    );
    expect(
      picked.every((mentor) => mentor.recommendationReasons.length > 0),
    ).toBe(true);
  });
});

describe("greetingName", () => {
  it("greets by the first given name", () => {
    expect(greetingName("Ayşe Nur Yılmaz")).toBe("Ayşe");
    expect(greetingName("  Can ")).toBe("Can");
  });

  it("has no name to greet without a record", () => {
    expect(greetingName(null)).toBeNull();
    expect(greetingName(undefined)).toBeNull();
    expect(greetingName("   ")).toBeNull();
  });
});

describe("waitingPreview", () => {
  const request = itemAt(peerMentoringRequestsFixture(), 0);
  const pending = (id: string) =>
    peerAppointment({ id, status: AppointmentStatus.Pending });

  it(`shows at most ${STUDENT_HOME_PREVIEW} rows, appointment requests first, and counts them all`, () => {
    const preview = waitingPreview(
      [pending("a"), pending("b")],
      [request, { ...request, id: "peer-2" }],
    );
    expect(preview.awaiting.map((item) => item.id)).toEqual(["a", "b"]);
    expect(preview.peerRequests.map((item) => item.id)).toEqual([request.id]);
    expect(preview.total).toBe(4);
  });

  it("leaves no room for peer requests once the appointments fill the list", () => {
    const preview = waitingPreview(
      [pending("a"), pending("b"), pending("c"), pending("d")],
      [request],
    );
    expect(preview.awaiting).toHaveLength(STUDENT_HOME_PREVIEW);
    expect(preview.peerRequests).toEqual([]);
    expect(preview.total).toBe(5);
  });
});
