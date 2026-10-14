import { createTranslator } from "next-intl";
import { describe, expect, it } from "vitest";

import {
  MentorshipRequestStatus,
  type MentorshipRequest,
} from "@/interfaces/mentorship-request";
import { needLabels } from "@/lib/mentor-request-need";
import en from "@/messages/en.json";
import {
  needTopicTitleForSupportArea,
  buildRequestDetailContent,
  isNeedOriginRequest,
  RequestDetailFieldKey,
} from "@/lib/request-detail-content";

function request(
  overrides: Partial<MentorshipRequest> = {},
): MentorshipRequest {
  return {
    id: "req-1",
    requesterId: "u-1",
    organizationId: "org-1",
    mentorId: "mentor-1",
    mentorName: "Leyla Aksoy",
    supportArea: "Finans ve yatırım",
    status: MentorshipRequestStatus.Pending,
    mentorMessage: null,
    rejectionReason: null,
    createdAt: "2026-09-11T11:02:00.000Z",
    messages: [],
    recommendationSnapshot: null,
    ...overrides,
  };
}

describe("request-detail-content", () => {
  it("uses need-flow labels when summary matches the need catalog", () => {
    const item = request({
      summary:
        "Ürünü kullanmaya başlıyor ama neden devam etmesi gerektiği net değil.",
      supportArea: "Ürün ve ürün yönetimi",
      requesterMessage: "Bir sonraki adımları belirlemek",
    });

    expect(isNeedOriginRequest(item)).toBe(true);
    const detail = buildRequestDetailContent(item);
    expect(detail.origin).toBe("need");
    expect(detail.fields.map((field) => field.key)).toEqual([
      RequestDetailFieldKey.NeedTopic,
      RequestDetailFieldKey.NeedProblem,
      RequestDetailFieldKey.NeedOutcome,
      RequestDetailFieldKey.SupportArea,
    ]);
  });

  it("uses profile-dialog labels for free-text profile requests", () => {
    const detail = buildRequestDetailContent(
      request({
        summary: "fs",
        supportArea: "Yatırım Alma",
        requesterMessage: "sfs\nTercih edilen saatler: 2026-09-11|10:30",
        recommendationSnapshot: {
          matchingMethod: "PROFILE",
          matchingModel: null,
          generatedAt: "2026-09-11T11:02:00.000Z",
          startupName: "Team TNT",
          startupSector: null,
          startupStage: null,
          startupSummary: null,
          startupTechnologies: [],
        },
      }),
    );

    expect(detail.origin).toBe("profile");
    expect(detail.fields.map((field) => field.key)).toEqual([
      RequestDetailFieldKey.ProfileTopic,
      RequestDetailFieldKey.ProfileStuck,
      RequestDetailFieldKey.ProfileOutcome,
    ]);
  });

  it("shows the stored expected outcome when the message only carries times", () => {
    const detail = buildRequestDetailContent(
      request({
        summary: "Finansal modeli kuramıyoruz.",
        supportArea: "Yatırım Alma",
        requesterMessage: "Tercih edilen saatler: 2026-09-11|10:30",
        expectedOutcome: "İlk finansal modelin çerçevesi",
      }),
    );

    expect(
      detail.fields.find(
        (field) => field.key === RequestDetailFieldKey.ProfileOutcome,
      )?.value,
    ).toBe("İlk finansal modelin çerçevesi");
  });

  it("shows the saved preset texts in English and leaves typed text as written", () => {
    const detail = buildRequestDetailContent(
      request({
        summary:
          "Ürünü kullanmaya başlıyor ama neden devam etmesi gerektiği net değil.",
        supportArea: "Ürün ve ürün yönetimi",
        expectedOutcome:
          "Bir karar vermek, Yol haritası oluşturmak\nKendi notum",
      }),
      {
        labels: needLabels(
          createTranslator({
            locale: "en",
            messages: en,
            namespace: "mentorRequest",
          }),
        ),
        locale: "en",
      },
    );

    expect(detail.fields).toEqual([
      { key: RequestDetailFieldKey.NeedTopic, value: "Product" },
      {
        key: RequestDetailFieldKey.NeedProblem,
        value:
          "They start using the product but it's not clear why they should keep going.",
      },
      {
        key: RequestDetailFieldKey.NeedOutcome,
        value: "Make a decision, Build a roadmap\nKendi notum",
      },
      {
        key: RequestDetailFieldKey.SupportArea,
        value: "Ürün ve ürün yönetimi",
      },
    ]);
  });
});

describe("needTopicTitleForSupportArea", () => {
  it("passes a topic outside the wizard's list to the page's topic label", () => {
    expect(
      needTopicTitleForSupportArea("UX Stratejisi", undefined, (value) =>
        value === "UX Stratejisi" ? "UX Strategy" : value,
      ),
    ).toBe("UX Strategy");
    expect(needTopicTitleForSupportArea("UX Stratejisi")).toBe("UX Stratejisi");
  });
});
