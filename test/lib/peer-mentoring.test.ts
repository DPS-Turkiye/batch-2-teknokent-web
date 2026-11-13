import { describe, expect, it } from "vitest";

import { AppointmentSide, AppointmentStatus } from "@/interfaces/appointment";
import { BadgeCode, BadgeStatus } from "@/interfaces/badges";
import { Weekday } from "@/interfaces/mentor";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import {
  PeerMentorGateState,
  PeerTopicCategory,
} from "@/interfaces/peer-mentoring";
import type { ProfileCompletionCategory } from "@/interfaces/student-profile-completion";
import {
  chosenSubtopics,
  iskurHomeMode,
  latestGateAward,
  nextSessionsByRequest,
  offeredSubTopics,
  PEER_REQUEST_STATUS_TONE,
  peerMentorCapacity,
  peerMentorGateState,
  peerMentoringSide,
  peerMentorProfileHref,
  peerRequestAvailability,
  splitPeerRequests,
  splitRecommended,
  subtopicGroupsWithCounts,
  subTopicOptions,
  weeklyHours,
} from "@/lib/peer-mentoring";
import {
  IskurHomeMode,
  PeerCapacityNote,
  PeerRequestAvailability,
} from "@/types/iskur-student";

describe("peerMentoringSide", () => {
  it("opens Mentorluk Ver only for as=MENTOR", () => {
    expect(peerMentoringSide("MENTOR")).toBe(AppointmentSide.Mentor);
    expect(peerMentoringSide(null)).toBe(AppointmentSide.Mentee);
    expect(peerMentoringSide("mentor")).toBe(AppointmentSide.Mentee);
  });
});

describe("PEER_REQUEST_STATUS_TONE", () => {
  it("covers every status and never shows a waiting request as accepted", () => {
    expect(Object.keys(PEER_REQUEST_STATUS_TONE).sort()).toEqual(
      Object.values(MentorshipRequestStatus).sort(),
    );
    const accepted = PEER_REQUEST_STATUS_TONE[MentorshipRequestStatus.Accepted];
    expect(PEER_REQUEST_STATUS_TONE[MentorshipRequestStatus.Pending]).not.toBe(
      accepted,
    );
  });
});

describe("peerMentorGateState", () => {
  const active = { status: BadgeStatus.Active };
  const revoked = { status: BadgeStatus.Revoked };

  it("opens the mentor side for an active badge or MENTOR", () => {
    expect(
      peerMentorGateState({
        holdsMentor: false,
        iskurParticipant: true,
        gateAward: active,
      }),
    ).toBe(PeerMentorGateState.Earned);
    expect(
      peerMentorGateState({
        holdsMentor: true,
        iskurParticipant: false,
        gateAward: null,
      }),
    ).toBe(PeerMentorGateState.Earned);
  });

  it("says Rozet Yok to an İŞKUR student who never had the badge", () => {
    expect(
      peerMentorGateState({
        holdsMentor: false,
        iskurParticipant: true,
        gateAward: null,
      }),
    ).toBe(PeerMentorGateState.NoBadge);
  });

  // D4 seam: a revoked badge closes the mentor side, even for running mentorships.
  it("closes the mentor side after a revoke", () => {
    expect(
      peerMentorGateState({
        holdsMentor: false,
        iskurParticipant: true,
        gateAward: revoked,
      }),
    ).toBe(PeerMentorGateState.Revoked);
  });

  it("hides the mentor side from everyone else", () => {
    expect(
      peerMentorGateState({
        holdsMentor: false,
        iskurParticipant: false,
        gateAward: null,
      }),
    ).toBe(PeerMentorGateState.Hidden);
  });
});

describe("latestGateAward", () => {
  it("picks the newest Akran Mentoru award and ignores achievements", () => {
    expect(
      latestGateAward([
        {
          code: BadgeCode.PeerMentor,
          awardedAt: "2026-09-01T00:00:00Z",
          id: "old",
        },
        {
          code: BadgeCode.Sessions10,
          awardedAt: "2026-11-05T00:00:00Z",
          id: "achievement",
        },
        {
          code: BadgeCode.PeerMentor,
          awardedAt: "2026-11-01T00:00:00Z",
          id: "new",
        },
      ])?.id,
    ).toBe("new");
    expect(latestGateAward([])).toBeNull();
  });
});

describe("peerMentorCapacity", () => {
  it("has no bar while no capacity is set (null, zero or negative)", () => {
    expect(peerMentorCapacity(2, null)).toEqual({
      used: 2,
      capacity: null,
      filled: 2,
      percent: 0,
      note: PeerCapacityNote.Unset,
    });
    expect(peerMentorCapacity(0, 0).note).toBe(PeerCapacityNote.Unset);
    expect(peerMentorCapacity(1, -3).note).toBe(PeerCapacityNote.Unset);
  });

  it("warns when accepting one more request fills the last place", () => {
    expect(peerMentorCapacity(3, 4)).toEqual({
      used: 3,
      capacity: 4,
      filled: 3,
      percent: 75,
      note: PeerCapacityNote.LastPlace,
    });
    expect(peerMentorCapacity(0, 1).note).toBe(PeerCapacityNote.LastPlace);
  });

  it("stays open with places to spare and never rounds an open capacity up to a full bar", () => {
    expect(peerMentorCapacity(1, 4).note).toBe(PeerCapacityNote.Open);
    expect(peerMentorCapacity(1, 3).percent).toBe(33);
    expect(peerMentorCapacity(198, 200)).toMatchObject({
      percent: 99,
      note: PeerCapacityNote.Open,
    });
  });

  it("is full at capacity, and holds the bar at capacity when a lowered capacity leaves extra mentees", () => {
    expect(peerMentorCapacity(4, 4)).toMatchObject({
      filled: 4,
      percent: 100,
      note: PeerCapacityNote.Full,
    });
    expect(peerMentorCapacity(5, 4)).toEqual({
      used: 5,
      capacity: 4,
      filled: 4,
      percent: 100,
      note: PeerCapacityNote.Full,
    });
  });
});

describe("weeklyHours", () => {
  it("orders the ranges by weekday, then by start, and trims the seconds", () => {
    expect(
      weeklyHours([
        {
          dayOfWeek: Weekday.Saturday,
          startTime: "12:00:00",
          endTime: "15:00:00",
        },
        {
          dayOfWeek: Weekday.Tuesday,
          startTime: "18:00:00",
          endTime: "20:00:00",
        },
        { dayOfWeek: Weekday.Tuesday, startTime: "09:30", endTime: "10:00" },
      ]),
    ).toEqual([
      { dayOfWeek: Weekday.Tuesday, start: "09:30", end: "10:00" },
      { dayOfWeek: Weekday.Tuesday, start: "18:00", end: "20:00" },
      { dayOfWeek: Weekday.Saturday, start: "12:00", end: "15:00" },
    ]);
    expect(weeklyHours([])).toEqual([]);
  });

  it("orders 9:05 before 10:00 whether or not the times carry seconds", () => {
    const rules = [
      { dayOfWeek: Weekday.Monday, startTime: "10:00", endTime: "11:00" },
      { dayOfWeek: Weekday.Monday, startTime: "09:05:00", endTime: "09:35:00" },
    ];
    expect(weeklyHours(rules).map((range) => range.start)).toEqual([
      "09:05",
      "10:00",
    ]);
    expect(rules[0]?.startTime).toBe("10:00");
  });
});

const CATALOGUE: ProfileCompletionCategory[] = [
  {
    id: PeerTopicCategory.CareerInternship,
    subtopics: [
      { id: "cv", labelKey: "cv" },
      { id: "interview", labelKey: "project" },
    ],
  },
  {
    id: PeerTopicCategory.AcademicDevelopment,
    subtopics: [{ id: "courses", labelKey: "study" }],
  },
];

describe("subtopicGroupsWithCounts", () => {
  it("counts the picked sub-topics of each chosen category", () => {
    expect(
      subtopicGroupsWithCounts(CATALOGUE, ["interview", "cv"]).map((group) => [
        group.id,
        group.selectedCount,
      ]),
    ).toEqual([
      [PeerTopicCategory.CareerInternship, 2],
      [PeerTopicCategory.AcademicDevelopment, 0],
    ]);
  });

  it("marks each sub-topic as picked or not", () => {
    expect(subtopicGroupsWithCounts(CATALOGUE, ["cv"])[0]?.subtopics).toEqual([
      { id: "cv", labelKey: "cv", checked: true },
      { id: "interview", labelKey: "project", checked: false },
    ]);
  });
});

describe("chosenSubtopics", () => {
  it("lists the picked sub-topics in catalogue order and drops unknown ids", () => {
    expect(
      chosenSubtopics(CATALOGUE, ["courses", "gone", "cv"]).map(
        (sub) => sub.id,
      ),
    ).toEqual(["cv", "courses"]);
  });
});

describe("splitRecommended", () => {
  const mentors = ["a", "b", "c", "d", "e"].map((mentorId) => ({ mentorId }));
  const withReason = (mentor: { mentorId: string }) => mentor.mentorId !== "b";

  it("recommends the first three mentors with a reason and lists everyone else", () => {
    const { recommended, others } = splitRecommended(
      mentors,
      withReason,
      false,
    );
    expect(recommended.map((mentor) => mentor.mentorId)).toEqual([
      "a",
      "c",
      "d",
    ]);
    expect(others.map((mentor) => mentor.mentorId)).toEqual(["b", "e"]);
  });

  it("treats every mentor as a search result while the student filters", () => {
    expect(splitRecommended(mentors, withReason, true)).toEqual({
      recommended: [],
      others: mentors,
    });
  });
});

describe("splitPeerRequests", () => {
  it("separates accepted requests (active mentorships) from the rest", () => {
    const requests = [
      { id: "1", status: MentorshipRequestStatus.Pending },
      { id: "2", status: MentorshipRequestStatus.Accepted },
      { id: "3", status: MentorshipRequestStatus.Declined },
    ];
    const { active, others } = splitPeerRequests(requests);
    expect(active.map((request) => request.id)).toEqual(["2"]);
    expect(others.map((request) => request.id)).toEqual(["1", "3"]);
  });
});

describe("peerRequestAvailability", () => {
  it("puts an open request before a full capacity", () => {
    expect(peerRequestAvailability(true, true)).toBe(
      PeerRequestAvailability.Requested,
    );
    expect(peerRequestAvailability(false, true)).toBe(
      PeerRequestAvailability.Full,
    );
    expect(peerRequestAvailability(false, false)).toBe(
      PeerRequestAvailability.Open,
    );
    expect(peerRequestAvailability(true, true, true)).toBe(
      PeerRequestAvailability.Mentoring,
    );
  });
});

describe("peerMentorProfileHref", () => {
  it("links to the mentor's profile with an encoded id", () => {
    expect(peerMentorProfileHref("peer 1/2")).toBe(
      "/student/peer-mentoring/mentors/peer%201%2F2",
    );
  });
});

describe("sub-topic helpers", () => {
  const catalogue: ProfileCompletionCategory[] = [
    {
      id: PeerTopicCategory.CareerInternship,
      subtopics: [
        { id: "cv", labelKey: "cv" },
        { id: "shared", labelKey: "time" },
      ],
    },
    {
      id: PeerTopicCategory.International,
      subtopics: [
        { id: "exchange", labelKey: "exchange" },
        { id: "shared", labelKey: "time" },
      ],
    },
  ];

  it("offers the chosen category's sub-topics, or every category's once", () => {
    expect(
      subTopicOptions(catalogue, PeerTopicCategory.International).map(
        (sub) => sub.id,
      ),
    ).toEqual(["exchange", "shared"]);
    expect(subTopicOptions(catalogue, null).map((sub) => sub.id)).toEqual([
      "cv",
      "shared",
      "exchange",
    ]);
    expect(subTopicOptions(catalogue, PeerTopicCategory.CampusLife)).toEqual(
      [],
    );
  });

  it("pairs a mentor's sub-topics with their catalogue entry, keeping unknown ones", () => {
    expect(offeredSubTopics(catalogue, ["exchange", "Serbest"])).toEqual([
      { id: "exchange", entry: { id: "exchange", labelKey: "exchange" } },
      { id: "Serbest", entry: null },
    ]);
  });
});

describe("nextSessionsByRequest", () => {
  const now = new Date("2026-11-09T09:00:00.000Z");
  const session = (
    requestId: string | null,
    startsAt: string,
    status = AppointmentStatus.Confirmed,
  ) => ({
    requestId,
    status,
    startsAt,
    alternative: null,
    endsAt: new Date(Date.parse(startsAt) + 30 * 60_000).toISOString(),
  });

  it("keeps each request's earliest meeting still to come", () => {
    const later = session("r1", "2026-11-14T09:00:00.000Z");
    const sooner = session("r1", "2026-11-10T09:00:00.000Z");
    const next = nextSessionsByRequest([later, sooner], now);
    expect(next.get("r1")).toBe(sooner);
  });

  it("skips cancelled, refused and past meetings, and appointments without a request", () => {
    const next = nextSessionsByRequest(
      [
        session("r1", "2026-11-10T09:00:00.000Z", AppointmentStatus.Cancelled),
        session("r2", "2026-11-10T09:00:00.000Z", AppointmentStatus.Rejected),
        session("r3", "2026-11-02T09:00:00.000Z"),
        session(null, "2026-11-10T09:00:00.000Z"),
      ],
      now,
    );
    expect(next.size).toBe(0);
  });
});

describe("iskurHomeMode", () => {
  it("adds nothing for students who cannot give peer mentoring or lost the badge", () => {
    expect(iskurHomeMode(PeerMentorGateState.Hidden, false)).toBe(
      IskurHomeMode.None,
    );
    expect(iskurHomeMode(PeerMentorGateState.Revoked, true)).toBe(
      IskurHomeMode.None,
    );
  });

  it("points to the training, then the wizard, then shows the mentor blocks", () => {
    expect(iskurHomeMode(PeerMentorGateState.NoBadge, false)).toBe(
      IskurHomeMode.Training,
    );
    expect(iskurHomeMode(PeerMentorGateState.Earned, false)).toBe(
      IskurHomeMode.CreateProfile,
    );
    expect(iskurHomeMode(PeerMentorGateState.Earned, true)).toBe(
      IskurHomeMode.Mentor,
    );
  });
});
