/**
 * Query keys of the peer-mentor reports. Every one starts with {@link PEER_REPORTS_QUERY_KEY}, so sending a meeting
 * report, a day or a week refreshes all report views at once. Shared by the report screens; keep new keys here.
 */
export const PEER_REPORTS_QUERY_KEY = ["peer-reports"] as const;

export function peerMeetingReportQueryKey(meetingId: string) {
  return [...PEER_REPORTS_QUERY_KEY, "meeting", meetingId] as const;
}
