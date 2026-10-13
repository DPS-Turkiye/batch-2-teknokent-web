import { describe, expect, it } from "vitest";

import {
  MentorshipRequestStatus,
  type MentorshipRequest,
} from "@/interfaces/mentorship-request";
import { REQUEST_DETAIL_LABELS } from "@/lib/const";
import {
  buildRequestDetailContent,
  isNeedOriginRequest,
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
    expect(detail.fields.map((field) => field.label)).toEqual([
      REQUEST_DETAIL_LABELS.needTopic,
      REQUEST_DETAIL_LABELS.needProblem,
      REQUEST_DETAIL_LABELS.needOutcome,
      REQUEST_DETAIL_LABELS.supportArea,
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
    expect(detail.fields.map((field) => field.label)).toEqual([
      REQUEST_DETAIL_LABELS.profileTopic,
      REQUEST_DETAIL_LABELS.profileStuck,
      REQUEST_DETAIL_LABELS.profileOutcome,
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
        (field) => field.label === REQUEST_DETAIL_LABELS.profileOutcome,
      )?.value,
    ).toBe("İlk finansal modelin çerçevesi");
  });
});
