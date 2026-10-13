import type { MentorshipRequest } from "@/interfaces/mentorship-request";
import {
  parsePreferredSlotsFromMessage,
  type ParsedPreferredSlot,
} from "@/lib/mentor-availability-days";
import { requestExpectedOutcome } from "@/lib/meeting-context";
import {
  MENTOR_REQUEST_NEED_GOALS,
  MENTOR_REQUEST_NEED_SITUATIONS,
  MENTOR_REQUEST_NEED_TOPICS,
  type NeedLabels,
} from "@/lib/mentor-request-need";

export enum RequestDetailFieldKey {
  NeedTopic = "needTopic",
  NeedProblem = "needProblem",
  NeedOutcome = "needOutcome",
  SupportArea = "supportArea",
  ProfileTopic = "profileTopic",
  ProfileStuck = "profileStuck",
  ProfileOutcome = "profileOutcome",
}

export type RequestDetailField = {
  key: RequestDetailFieldKey;
  value: string;
};

/** How to show the request in the page's language; without it the saved texts show as they are. */
export type RequestDetailDisplay = {
  labels: NeedLabels;
  locale: string;
};

export type RequestDetailContent = {
  origin: "profile" | "need";
  topic: string;
  fields: RequestDetailField[];
  preferredSlots: ParsedPreferredSlot[];
};

export function needTopicTitleForSupportArea(
  supportArea: string,
  labels?: NeedLabels,
) {
  const match = MENTOR_REQUEST_NEED_TOPICS.find(
    (topic) => topic.supportArea === supportArea,
  );
  if (!match) return supportArea;
  return labels ? labels.topicTitle(match.id) : match.title;
}

// The wizard saves its preset texts in Turkish; anything the mentee wrote stays as written.
function presetSummary(summary: string, labels?: NeedLabels) {
  if (!labels) return summary;
  const topic = MENTOR_REQUEST_NEED_TOPICS.find(
    (item) => item.id !== "other" && item.description === summary,
  );
  if (topic) return labels.topicDescription(topic.id);
  const situation = MENTOR_REQUEST_NEED_SITUATIONS.find(
    (item) => item.id !== "none" && item.description === summary,
  );
  return situation ? labels.situationDescription(situation.id) : summary;
}

function presetOutcome(outcome: string, labels?: NeedLabels) {
  if (!labels) return outcome;
  const [goals, ...note] = outcome.split("\n");
  const shown = goals
    .split(", ")
    .map((part) => {
      const goal = MENTOR_REQUEST_NEED_GOALS.find(
        (item) => item.label === part,
      );
      return goal ? labels.goalLabel(goal.id) : part;
    })
    .join(", ");
  return [shown, ...note].join("\n");
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
  display?: RequestDetailDisplay,
): RequestDetailContent {
  const needOrigin = isNeedOriginRequest(request);
  const outcome = presetOutcome(
    requestExpectedOutcome(request),
    display?.labels,
  );
  const preferredSlots = parsePreferredSlotsFromMessage(
    request.requesterMessage,
    display?.locale,
  );
  const topic = needTopicTitleForSupportArea(
    request.supportArea,
    display?.labels,
  );
  const summary = presetSummary(request.summary?.trim() ?? "", display?.labels);

  if (needOrigin) {
    return {
      origin: "need",
      topic,
      fields: [
        { key: RequestDetailFieldKey.NeedTopic, value: topic },
        ...(summary
          ? [{ key: RequestDetailFieldKey.NeedProblem, value: summary }]
          : []),
        ...(outcome
          ? [{ key: RequestDetailFieldKey.NeedOutcome, value: outcome }]
          : []),
        ...(request.supportArea &&
        request.supportArea !==
          needTopicTitleForSupportArea(request.supportArea)
          ? [
              {
                key: RequestDetailFieldKey.SupportArea,
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
      { key: RequestDetailFieldKey.ProfileTopic, value: topic },
      ...(summary
        ? [{ key: RequestDetailFieldKey.ProfileStuck, value: summary }]
        : []),
      ...(outcome
        ? [{ key: RequestDetailFieldKey.ProfileOutcome, value: outcome }]
        : []),
    ],
    preferredSlots,
  };
}
