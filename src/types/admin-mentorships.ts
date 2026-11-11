/** The tabs of the admin Mentorluklar screen; each has its own route. */
export enum MentorshipTab {
  Overview = "overview",
  Interventions = "interventions",
  Matching = "matching",
}

/** Why a pair is on the intervention list: an overdue meeting (critical) or an open bottleneck only. */
export enum InterventionKind {
  Critical = "critical",
  Bottleneck = "bottleneck",
}

/** The filter pills of the interventions tab; also the `?filter=` URL parameter and the message keys. */
export enum InterventionFilter {
  All = "ALL",
  Critical = "CRITICAL",
  Bottleneck = "BOTTLENECK",
  Unanswered = "UNANSWERED",
  Assigned = "ASSIGNED",
}

/** The filter pills of the matching tab; also the message keys. */
export enum MatchingFilter {
  Waiting = "WAITING",
  ThisWeek = "THIS_WEEK",
  Declined = "DECLINED",
}

/** The sort orders of the matching tab; also the message keys. */
export enum MatchingSort {
  Wait = "WAIT",
  Name = "NAME",
}
