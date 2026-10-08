import type { MentorshipRequest } from "@/interfaces/mentorship-request";
import { REQUEST_DETAIL_LABELS } from "@/lib/const";
import {
  parsePreferredSlotsFromMessage,
  type ParsedPreferredSlot,
} from "@/lib/mentor-availability-days";
import { requestExpectedOutcome } from "@/lib/meeting-context";
import {
  MENTOR_REQUEST_NEED_GOALS,
  MENTOR_REQUEST_NEED_SITUATIONS,
  MENTOR_REQUEST_NEED_TOPICS,
} from "@/lib/mentor-request-need";

export type RequestDetailField = {
  label: string;
  value: string;
};

export type RequestDetailContent = {
  origin: "profile" | "need";
  topic: string;
  fields: RequestDetailField[];
  preferredSlots: ParsedPreferredSlot[];
};

export function needTopicTitleForSupportArea(supportArea: string) {
  const match = MENTOR_REQUEST_NEED_TOPICS.find(
    (topic) => topic.supportArea === supportArea,
  );
  return match?.title ?? supportArea;
}

export function isNeedOriginRequest(request: MentorshipRequest) {
  const summary = request.summary?.trim() ?? "";
  if (
    summary &&
    (MENTOR_REQUEST_NEED_SITUATIONS.some(
      (situation) =>
        situation.id !== "none" &&
        (situation.description === summary || situation.title === summary),
    ) ||
      MENTOR_REQUEST_NEED_TOPICS.some(
        (topic) =>
          topic.id !== "other" &&
          (topic.description === summary || topic.title === summary),
      ))
  ) {
    return true;
  }
  const outcome = requestExpectedOutcome(request);
  if (
    !outcome ||
    !MENTOR_REQUEST_NEED_GOALS.some((goal) => outcome.includes(goal.label))
  ) {
    return false;
  }
  return MENTOR_REQUEST_NEED_TOPICS.some(
    (topic) =>
      topic.id !== "other" && topic.supportArea === request.supportArea,
  );
}

export function buildRequestDetailContent(
  request: MentorshipRequest,
): RequestDetailContent {
  const needOrigin = isNeedOriginRequest(request);
  const outcome = requestExpectedOutcome(request);
  const preferredSlots = parsePreferredSlotsFromMessage(
    request.requesterMessage,
  );
  const topic = needTopicTitleForSupportArea(request.supportArea);
  const summary = request.summary?.trim() ?? "";

  if (needOrigin) {
    return {
      origin: "need",
      topic,
      fields: [
        { label: REQUEST_DETAIL_LABELS.needTopic, value: topic },
        ...(summary
          ? [{ label: REQUEST_DETAIL_LABELS.needProblem, value: summary }]
          : []),
        ...(outcome
          ? [{ label: REQUEST_DETAIL_LABELS.needOutcome, value: outcome }]
          : []),
        ...(request.supportArea && request.supportArea !== topic
          ? [
              {
                label: REQUEST_DETAIL_LABELS.supportArea,
                value: request.supportArea,
              },
            ]
          : []),
      ],
      preferredSlots,
    };
  }

  return {
    origin: "profile",
    topic,
    fields: [
      { label: REQUEST_DETAIL_LABELS.profileTopic, value: topic },
      ...(summary
        ? [{ label: REQUEST_DETAIL_LABELS.profileStuck, value: summary }]
        : []),
      ...(outcome
        ? [
            {
              label: REQUEST_DETAIL_LABELS.profileOutcome,
              value: outcome,
            },
          ]
        : []),
    ],
    preferredSlots,
  };
}
