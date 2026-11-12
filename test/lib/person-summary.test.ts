import { describe, expect, it } from "vitest";

import { MentorLanguage, Weekday } from "@/interfaces/mentor";
import { PersonProgramRelation } from "@/interfaces/person-summary";
import { ProgramMentorStatus, ProgramStatus } from "@/interfaces/program";
import { UserAccountStatus, UserRole } from "@/interfaces/session";
import { availabilityModel, personSummaryModel } from "@/lib/person-summary";
import { SummaryFactKind } from "@/types/person-summary";
import {
  menteeSummary,
  mentorAvailability,
  mentorSummary,
} from "@test/fixtures/person-summary";

describe("personSummaryModel", () => {
  it("prefers a mentor's own title, about text and specialties", () => {
    const model = personSummaryModel(
      mentorSummary({ jobTitle: "Hesap", bio: "Hesap bio", expertise: ["X"] }),
    );

    expect(model.headline).toBe("Ürün lideri · Örnek Şirket");
    expect(model.about).toBe(
      "Erken aşama ekiplerle ürün keşfi üzerine çalışıyor.",
    );
    expect(model.tags).toEqual([
      { key: "Ürün stratejisi", value: "Ürün stratejisi" },
    ]);
    expect(model.roleLabel).toBe("roles.MENTOR");
    expect(model.status).toEqual({ tone: "green", label: "statuses.APPROVED" });
    expect(model.showStartup).toBe(false);
    expect(model.showTeamHistory).toBe(false);
  });

  it("lists only the mentor facts that are filled, in a fixed order", () => {
    const model = personSummaryModel(mentorSummary());

    expect(model.mentor?.facts).toEqual([
      {
        kind: SummaryFactKind.Text,
        label: "facts.experienceLevel",
        text: "10+ yıl",
      },
      {
        kind: SummaryFactKind.Text,
        label: "facts.sectorExperience",
        text: "Fintech",
      },
      { kind: SummaryFactKind.Text, label: "facts.startupStages", text: "MVP" },
      {
        kind: SummaryFactKind.Languages,
        label: "facts.languages",
        languages: [MentorLanguage.Turkish, MentorLanguage.English],
      },
    ]);
    expect(model.mentor?.experiences).toEqual([
      {
        key: "Ürün Direktörü · Örnek Şirket\n2020 – bugün",
        heading: "Ürün Direktörü · Örnek Şirket",
        detail: "2020 – bugün",
      },
    ]);
    expect(model.mentor?.educations).toEqual([
      { key: "Örnek Üniversitesi · MBA", value: "Örnek Üniversitesi · MBA" },
    ]);
    expect(model.activity).toEqual([
      { kind: SummaryFactKind.Text, label: "activeMentees", text: "2 / 4" },
      { kind: SummaryFactKind.Text, label: "completedMentorships", text: "5" },
      {
        kind: SummaryFactKind.Date,
        label: "registered",
        date: "2026-09-01T09:00:00Z",
      },
    ]);
  });

  it("shows the active count alone when the mentor set no capacity, and drops duplicate entries", () => {
    const base = mentorSummary();
    const mentor = base.mentor ?? mentorSummary().mentor;
    const model = personSummaryModel(
      mentorSummary({
        mentor: mentor && {
          ...mentor,
          menteeCapacity: null,
          meetingMode: "Online",
          specialties: ["Satış", "Satış"],
          offerings: ["Ürün yol haritası", "Ürün yol haritası"],
        },
        createdAt: null,
      }),
    );

    expect(model.activity[0]).toEqual({
      kind: SummaryFactKind.Text,
      label: "activeMentees",
      text: "2",
    });
    expect(model.activity).toHaveLength(2);
    expect(model.mentor?.facts).toContainEqual({
      kind: SummaryFactKind.Option,
      label: "facts.meetingMode",
      group: "meetingFormat",
      value: "Online",
    });
    expect(model.tags).toHaveLength(1);
    expect(model.mentor?.offerings).toHaveLength(1);
  });

  it("describes a mentee and their startup, with only web links kept", () => {
    const model = personSummaryModel(
      menteeSummary({ linkedinUrl: "javascript:alert(1)" }),
    );

    expect(model.headline).toBe("Kurucu ortak");
    expect(model.about).toBe("Yerel üreticileri alıcılarla buluşturuyor.");
    expect(model.tags).toEqual([{ key: "Satış", value: "Satış" }]);
    expect(model.roleLabel).toBe("roles.MENTEE");
    expect(model.status).toEqual({ tone: "amber", label: "statuses.PENDING" });
    expect(model.linkedinUrl).toBeNull();
    expect(model.mentor).toBeNull();
    expect(model.showStartup).toBe(true);
    expect(model.showTeamHistory).toBe(true);
    expect(model.startup).toEqual({
      name: "Pazar Lab",
      description: "Yerel üreticiler için pazar yeri",
      websiteUrl: "https://pazarlab.example.test",
      facts: [
        {
          kind: SummaryFactKind.Text,
          label: "startupFields.sector",
          text: "E-ticaret",
        },
        {
          kind: SummaryFactKind.Text,
          label: "startupFields.foundedYear",
          text: "2025",
        },
        {
          kind: SummaryFactKind.Text,
          label: "startupFields.problem",
          text: "Üreticiler alıcıya ulaşamıyor.",
        },
      ],
    });
    expect(model.programs).toEqual([
      {
        key: "program-1-MENTEE",
        id: "program-1",
        name: "Yeşil Program",
        note: "relations.MENTEE",
      },
    ]);
  });

  it("maps the startup's option values and keeps the empty startup state for mentees", () => {
    const withOptions = personSummaryModel(
      menteeSummary({
        startup: {
          id: "s1",
          name: "Pazar Lab",
          description: null,
          website: null,
          sector: null,
          maturity: "Fikir",
          problem: null,
          solution: "Pazar yeri",
          fundingStage: "Pre-seed",
          foundedYear: null,
        },
      }),
    );
    expect(withOptions.startup?.facts).toEqual([
      {
        kind: SummaryFactKind.Option,
        label: "startupFields.maturity",
        group: "stage",
        value: "Fikir",
      },
      {
        kind: SummaryFactKind.Option,
        label: "startupFields.fundingStage",
        group: "fundingStage",
        value: "Pre-seed",
      },
      {
        kind: SummaryFactKind.Text,
        label: "startupFields.solution",
        text: "Pazar yeri",
      },
    ]);

    const noStartup = personSummaryModel(
      menteeSummary({ startup: null, jobTitle: null, bio: null }),
    );
    expect(noStartup.showStartup).toBe(true);
    expect(noStartup.startup).toBeNull();
    expect(noStartup.headline).toBeNull();
    expect(noStartup.about).toBeNull();
  });

  it("notes a mentor's pending request and labels no other roles", () => {
    const model = personSummaryModel(
      mentorSummary({
        role: UserRole.Coordinator,
        status: UserAccountStatus.Rejected,
        programs: [
          {
            id: "p2",
            name: "Mavi Program",
            status: ProgramStatus.Active,
            relation: PersonProgramRelation.Mentor,
            mentorStatus: ProgramMentorStatus.Pending,
          },
        ],
      }),
    );

    expect(model.roleLabel).toBeNull();
    expect(model.status).toEqual({ tone: "red", label: "statuses.REJECTED" });
    expect(model.programs.map((program) => program.note)).toEqual([
      "mentorPending",
    ]);
  });
});

describe("availabilityModel", () => {
  it("groups weekly windows by day, Monday first, keeping each day's order", () => {
    const model = availabilityModel(mentorAvailability());

    expect(model.days).toEqual([
      {
        day: Weekday.Monday,
        ranges: [{ key: "09:00–10:00", value: "09:00–10:00" }],
      },
      {
        day: Weekday.Tuesday,
        ranges: [
          { key: "14:00–15:00", value: "14:00–15:00" },
          { key: "10:00–12:00", value: "10:00–12:00" },
        ],
      },
    ]);
    expect(model.daysOff).toEqual([
      {
        key: "2026-11-20/2026-11-22",
        startsOn: "2026-11-20",
        endsOn: "2026-11-22",
      },
    ]);
    expect(model.extraSlots).toEqual([
      {
        key: "2026-11-14T09:00:00Z",
        startsAt: "2026-11-14T09:00:00Z",
        durationMinutes: 45,
      },
    ]);
    expect(model.isEmpty).toBe(false);
  });

  it("is empty when the mentor set nothing", () => {
    expect(
      availabilityModel({ weekly: [], daysOff: [], extraSlots: [] }),
    ).toEqual({ days: [], daysOff: [], extraSlots: [], isEmpty: true });
  });
});
