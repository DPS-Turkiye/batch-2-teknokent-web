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
  MentorshipHealthFilter,
  MentorshipSort,
  mentorLoadLabel,
  nextMeetingLabel,
  notesSummary,
  sortMentorships,
  topicOptions,
} from "@/lib/coordinator-mentorships";
import {
  coordinatorMentorship,
  coordinatorMentorshipDetail,
} from "@test/fixtures/coordinator-mentorships";

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
      healthFilterOptions([lumen, kavun, terra]).map((option) => option.label),
    ).toEqual([
      "Tümü 3",
      "Müdahale gerekli 1",
      "Takip gerekli 0",
      "Sağlıklı 1",
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
    expect(lastMeetingLabel(lumen)).toBe("18 gün önce");
    expect(lastMeetingLabel(terra)).toBe("—");
    expect(nextMeetingLabel(lumen, now)).toBe("Planlanmadı");
    expect(nextMeetingLabel(terra, now)).toBe("Eşleşme onayı bekleniyor");
    expect(
      nextMeetingLabel(
        coordinatorMentorship({
          nextMeetingAt: new Date(2026, 8, 25, 14, 0).toISOString(),
        }),
        now,
      ),
    ).toBe("Yarın · 14:00");
    expect(actionsLabel(lumen)).toBe("2 açık · 1 gecikmiş");
    expect(actionsLabel(coordinatorMentorship({ overdueActions: 0 }))).toBe(
      "2 açık",
    );
    expect(
      actionsLabel(
        coordinatorMentorship({
          openActions: 0,
          overdueActions: 0,
          missingNotes: 1,
        }),
      ),
    ).toBe("Not eksik");
  });

  it("builds the drawer summary", () => {
    const detail = coordinatorMentorshipDetail();
    expect(cadenceAlert(detail)?.title).toBe(
      "18 gündür görüşme yok · sıradaki planlanmadı",
    );
    expect(cadenceAlert(detail)?.body).toContain("Eşik 14 gün.");
    expect(cadenceAlert(detail)?.body).toContain("1 aksiyonun süresi geçti.");
    expect(
      cadenceAlert(coordinatorMentorshipDetail({ mentorship: kavun })),
    ).toBeNull();
    expect(goalPercent(detail)).toBe(58);
    expect(goalPercent(coordinatorMentorshipDetail({ goalsTotal: 0 }))).toBe(0);
    expect(notesSummary(detail)).toMatch(
      /^4 görüşmenin 4'i için not girildi · son 4 Eylül 2026$/,
    );
    expect(notesSummary(coordinatorMentorshipDetail({ pastMeetings: 0 }))).toBe(
      "Henüz tamamlanan görüşme yok.",
    );
    expect(mentorLoadLabel(detail)).toBe("Satış & GTM · 2/3 yük");
    expect(coordinatorMessageHref("program-1", "mentor-1")).toBe(
      "/coordinator/messages?program=program-1&mentor=mentor-1",
    );
  });
});
