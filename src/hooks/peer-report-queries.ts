import type { QueryClient } from "@tanstack/react-query";

/**
 * Query keys of the peer-mentor reports. Every one starts with {@link PEER_REPORTS_QUERY_KEY}, so sending a meeting
 * report, a day or a week refreshes all report views at once. Shared by the report screens; keep new keys here.
 */
export const PEER_REPORTS_QUERY_KEY = ["peer-reports"] as const;

export function peerMeetingReportQueryKey(meetingId: string) {
  return [...PEER_REPORTS_QUERY_KEY, "meeting", meetingId] as const;
}

export function peerDailyReportQueryKey(day: string) {
  return [...PEER_REPORTS_QUERY_KEY, "days", day] as const;
}

export function peerReportWeekQueryKey(weekStart: string) {
  return [...PEER_REPORTS_QUERY_KEY, "week-days", weekStart] as const;
}

/**
 * After a save: the other report views count what changed, so they refresh from the server. The saved report's own
 * query already holds the server's answer; refetching it could race the mentor's typing.
 */
export function refreshOtherReportViews(
  queryClient: QueryClient,
  own: readonly unknown[],
) {
  void queryClient.invalidateQueries({
    queryKey: PEER_REPORTS_QUERY_KEY,
    predicate: (candidate) =>
      !candidate.queryKey.every((part, index) => part === own[index]),
  });
}
