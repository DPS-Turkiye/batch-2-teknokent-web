import { describe, expect, it } from "vitest";

import {
  CoordinatorMentorshipHealth,
  MentorshipStatus,
} from "@/interfaces/coordinator-mentorship";
import {
  actionsLabel,
  ALL_TOPICS,
  cadenceAlert,
  coordinatorMessageHref,
  filterMentorships,
  goalPercent,
  healthFilterOptions,
  lastMeetingLabel,
  mentorLoadLabel,
  MentorshipHealthFilter,
  MentorshipSort,
  nextMeetingLabel,
  notesSummary,
  sortMentorships,
  topicOptions,
  type MentorshipTexts,
} from "@/lib/coordinator-mentorships";
import {
  coordinatorMentorship,
  coordinatorMentorshipDetail,
} from "@test/fixtures/coordinator-mentorships";
import { translatorIn } from "@test/translators";

function texts(locale: "tr" | "en"): MentorshipTexts {
  return {
    t: translatorIn(locale, "coordinatorMentorships"),
    locale,
  };
}
const trTexts = texts("tr");
const { t } = trTexts;

const lumen = coordinatorMentorship();
const kavun = coordinatorMentorship({
  id: "mentorship-2",
  organizationName: "Kavun",
  health: CoordinatorMentorshipHealth.Healthy,
  topic: "GTM",
  daysSinceLastMeeting: 3,
  openActions: 0,
  overdueActions: 0,
});
const terra = coordinatorMentorship({
  id: "mentorship-3",
  mentorName: "Kerem Sarı",
  organizationName: "Terra",
  status: MentorshipStatus.Planned,
  health: CoordinatorMentorshipHealth.New,
  topic: null,
  lastMeetingAt: null,
  daysSinceLastMeeting: null,
});

describe("coordinator mentorships", () => {
  it("counts each health bucket for the filter pills", () => {
    expect(
      healthFilterOptions([lumen, kavun, terra], t).map(
        (option) => option.label,
      ),
    ).toEqual([
      "Tümü 3",
      "Müdahale gerekli 1",
      "Takip gerekli 0",
      "Sağlıklı 1",
    ]);
    expect(
      healthFilterOptions([lumen], texts("en").t).map((option) => option.label),
    ).toEqual([
      "All 1",
      "Needs intervention 1",
      "Needs follow-up 0",
      "Healthy 0",
    ]);
  });

  it("filters by health, topic and a case-insensitive Turkish search", () => {
    const rows = [lumen, kavun, terra];
    const by = (
      health: MentorshipHealthFilter,
      search = "",
      topic = ALL_TOPICS,
    ) => filterMentorships(rows, { health, search, topic }).map((r) => r.id);

    expect(by(MentorshipHealthFilter.Risky)).toEqual(["mentorship-1"]);
    expect(by(MentorshipHealthFilter.All, "KEREM")).toEqual(["mentorship-3"]);
    expect(by(MentorshipHealthFilter.All, "kav")).toEqual(["mentorship-2"]);
    expect(by(MentorshipHealthFilter.All, "", "GTM")).toEqual(["mentorship-2"]);
    expect(topicOptions(rows)).toEqual([ALL_TOPICS, "Finansal model", "GTM"]);
  });

  it("keeps the server's risk order, or sorts by silence or name", () => {
    const rows = [kavun, terra, lumen];
    expect(sortMentorships(rows, MentorshipSort.Risk)).toBe(rows);
    expect(
      sortMentorships(rows, MentorshipSort.LastMeeting).map((r) => r.id),
    ).toEqual(["mentorship-1", "mentorship-2", "mentorship-3"]);
    expect(
      sortMentorships(rows, MentorshipSort.Name).map((r) => r.mentorName),
    ).toEqual(["Ayşe Demir", "Ayşe Demir", "Kerem Sarı"]);
  });

  it("labels the table cells", () => {
    const now = new Date(2026, 8, 24, 10, 0);
    expect(lastMeetingLabel(lumen, trTexts)).toBe("18 gün önce");
    expect(lastMeetingLabel(lumen, texts("en"))).toBe("18 days ago");
    expect(lastMeetingLabel(terra, trTexts)).toBe("—");
    expect(nextMeetingLabel(lumen, trTexts, now)).toBe("Planlanmadı");
    expect(nextMeetingLabel(terra, trTexts, now)).toBe(
      "Eşleşme onayı bekleniyor",
    );
    expect(
      nextMeetingLabel(
        coordinatorMentorship({
          nextMeetingAt: new Date(2026, 8, 25, 14, 0).toISOString(),
        }),
        trTexts,
        now,
      ),
    ).toBe("Yarın · 14:00");
    expect(
      nextMeetingLabel(
        coordinatorMentorship({
          nextMeetingAt: new Date(2026, 8, 25, 14, 0).toISOString(),
        }),
        texts("en"),
        now,
      ),
    ).toBe("Tomorrow · 02:00 PM");
    expect(actionsLabel(lumen, t)).toBe("2 açık · 1 gecikmiş");
    expect(actionsLabel(lumen, texts("en").t)).toBe("2 open · 1 overdue");
    expect(actionsLabel(coordinatorMentorship({ overdueActions: 0 }), t)).toBe(
      "2 açık",
    );
    expect(
      actionsLabel(
        coordinatorMentorship({
          openActions: 0,
          overdueActions: 0,
          missingNotes: 1,
        }),
        t,
      ),
    ).toBe("Not eksik");
  });

  it("builds the drawer summary", () => {
    const detail = coordinatorMentorshipDetail();
    expect(cadenceAlert(detail, trTexts)?.title).toBe(
      "18 gündür görüşme yok · sıradaki planlanmadı",
    );
    expect(cadenceAlert(detail, trTexts)?.body).toContain("Eşik 14 gün.");
    expect(cadenceAlert(detail, trTexts)?.body).toContain(
      "1 aksiyonun süresi geçti.",
    );
    expect(cadenceAlert(detail, texts("en"))?.title).toBe(
      "No meeting for 18 days · next not scheduled",
    );
    expect(
      cadenceAlert(coordinatorMentorshipDetail({ mentorship: kavun }), trTexts),
    ).toBeNull();
    expect(goalPercent(detail)).toBe(58);
    expect(goalPercent(coordinatorMentorshipDetail({ goalsTotal: 0 }))).toBe(0);
    expect(notesSummary(detail, trTexts)).toMatch(
      /^4 görüşmenin 4'i için not girildi · son 4 Eylül 2026$/,
    );
    expect(notesSummary(detail, texts("en"))).toBe(
      "Notes taken for 4 of 4 meetings · last September 4, 2026",
    );
    expect(
      notesSummary(coordinatorMentorshipDetail({ pastMeetings: 0 }), trTexts),
    ).toBe("Henüz tamamlanan görüşme yok.");
    expect(mentorLoadLabel(detail, t)).toBe("Satış & GTM · 2/3 yük");
    expect(coordinatorMessageHref("program-1", "mentor-1")).toBe(
      "/coordinator/messages?program=program-1&mentor=mentor-1",
    );
  });
});
