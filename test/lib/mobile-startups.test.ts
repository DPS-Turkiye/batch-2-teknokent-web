import { describe, expect, it } from "vitest";

import { ActionItemStatus } from "@/interfaces/action-item";
import { MeetingStatus } from "@/interfaces/meeting";
import { MeetingFrequency } from "@/interfaces/mentor";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import type { RegularMentorship } from "@/interfaces/regular-mentorship";
import type { StartupDocument } from "@/interfaces/startup-document";
import {
  activeStartupCards,
  pastStartupCards,
  StartupHealth,
  startupDetail,
} from "@/lib/mobile-startups";
import {
  menteeActionItemFixture,
  menteeMeetingFixture,
  menteeRequestFixture,
} from "@test/fixtures/mentee-home";
import { mobileTexts } from "@test/mobile-texts";

const NOW = new Date(2026, 8, 23, 12, 0);

const ATLAS = menteeRequestFixture({
  id: "r-atlas",
  organizationId: "atlas",
  organizationName: "Atlas AI",
  status: MentorshipRequestStatus.Accepted,
  supportArea: "Ürün stratejisi",
  createdAt: "2026-06-02T10:00:00Z",
});
const LUMEN = menteeRequestFixture({
  id: "r-lumen",
  organizationId: "lumen",
  organizationName: "Lumen",
  status: MentorshipRequestStatus.Accepted,
  supportArea: "Finansal model",
});
const MEETINGS = [
  menteeMeetingFixture({
    id: "held",
    organizationId: "lumen",
    scheduledAt: new Date(2026, 8, 15, 10, 0).toISOString(),
    durationMinutes: 60,
    status: MeetingStatus.Completed,
  }),
  menteeMeetingFixture({
    id: "next",
    organizationId: "atlas",
    scheduledAt: new Date(2026, 8, 24, 14, 0).toISOString(),
    durationMinutes: 60,
    meetLink: "https://meet.google.com/abc",
  }),
];

describe("activeStartupCards", () => {
  it("flags a startup with no meeting for a week and puts it first", () => {
    const cards = activeStartupCards(
      [ATLAS, LUMEN],
      MEETINGS,
      [],
      "m1",
      mobileTexts(),
      NOW,
    );

    expect(
      cards.map((card) => [card.name, card.health, card.nextLine]),
    ).toEqual([
      [
        "Lumen",
        StartupHealth.Attention,
        "Planlanmadı · 8 gündür görüşme yok · Finansal model",
      ],
      ["Atlas AI", StartupHealth.Active, "Yarın · 14:00 · Ürün stratejisi"],
    ]);
    expect(cards[1]?.href).toBe("/m/startups/atlas");
  });
});

describe("pastStartupCards", () => {
  it("lists ended regular mentorships once, leaving out startups still active", () => {
    const mentorship = (organizationId: string, status: string) =>
      ({
        id: `${organizationId}-${status}`,
        organizationId,
        organizationName: organizationId.toUpperCase(),
        status,
        endDate: "2026-08-31",
      }) as RegularMentorship;

    const cards = pastStartupCards(
      [
        mentorship("old", "COMPLETED"),
        mentorship("old", "CANCELLED"),
        mentorship("atlas", "COMPLETED"),
        mentorship("now", "ACTIVE"),
      ],
      new Set(["atlas"]),
    );

    expect(cards.map((card) => [card.name, card.nextLine])).toEqual([
      ["OLD", "Bitti · 31 Ağustos 2026"],
    ]);
  });
});

describe("startupDetail", () => {
  it("summarises the mentorship, team, tasks and files", () => {
    const detail = startupDetail({
      organizationId: "atlas",
      requests: [ATLAS],
      meetings: MEETINGS,
      programs: [],
      mentorId: "m1",
      members: [
        { id: "u2", email: "b@x", fullName: "Barış Arslan", role: "MENTEE" },
        {
          id: "u1",
          email: "g@x",
          fullName: "Gamze Kozak",
          role: "MENTEE",
          jobTitle: "CEO & Co-founder",
          founder: true,
        },
      ],
      documents: [
        { createdAt: "2026-09-21T10:00:00Z" },
        { createdAt: "2026-09-01T10:00:00Z" },
      ] as StartupDocument[],
      actionItems: [
        menteeActionItemFixture({
          id: "a",
          status: ActionItemStatus.Completed,
        }),
        menteeActionItemFixture({ id: "b" }),
        menteeActionItemFixture({
          id: "c",
          status: ActionItemStatus.Cancelled,
        }),
      ],
      frequency: MeetingFrequency.Biweekly,
      texts: mobileTexts(),
      now: NOW,
    });

    expect(detail).toMatchObject({
      chatHref: "/m/messages/mentorship/r-atlas",
      meetingsHref: "/m/calendar?meeting=next",
      upcoming: {
        when: "Yarın · 14:00–15:00",
        detail: "Ürün stratejisi · 1. görüşme · Online",
      },
      info: [
        { label: "Konu", value: "Ürün stratejisi" },
        { label: "Başlangıç", value: "2 Haziran 2026" },
        { label: "Görüşme sıklığı", value: "2 haftada 1" },
      ],
      lead: { name: "Gamze Kozak", title: "CEO & Co-founder" },
      members: { count: 1, initials: ["BA"] },
      tasks: "1 / 2 tamamlandı",
      files: "2 dosya · son 2 gün önce",
    });
  });

  it("has nothing for a startup without an active mentorship", () => {
    expect(
      startupDetail({
        organizationId: "gone",
        requests: [ATLAS],
        meetings: [],
        programs: [],
        mentorId: "m1",
        members: [],
        documents: [],
        actionItems: [],
        frequency: null,
        texts: mobileTexts(),
        now: NOW,
      }),
    ).toBeNull();
  });
});
