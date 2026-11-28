import type {
  PeerActivity,
  PeerDailyReport,
  PeerMeetingReport,
  PeerReportMeeting,
  PeerReportWeek,
  PeerWeeklyReport,
  SavePeerActivityInput,
  SavePeerDailyReportInput,
  SavePeerMeetingReportInput,
  SavePeerWeeklyReportInput,
} from "@/interfaces/peer-reports";
import { requireSuccess } from "@/lib/client/api";
import { backendHttp } from "@/lib/client/backend-http";

/** The signed-in peer mentor's own reports; the backend takes the mentor from the session. */
const BASE = "/api/peer-mentoring/reports";

function meetingPath(meetingId: string) {
  return `${BASE}/meetings/${encodeURIComponent(meetingId)}`;
}

/** The signed-in peer mentor's held meetings between two days (both included), with their report state. */
export async function getPeerReportMeetings(
  from: string,
  to: string,
): Promise<PeerReportMeeting[]> {
  return requireSuccess(
    await backendHttp.get<PeerReportMeeting[]>(`${BASE}/meetings`, {
      params: { from, to },
    }),
  );
}

export async function getPeerMeetingReport(
  meetingId: string,
): Promise<PeerMeetingReport> {
  return requireSuccess(
    await backendHttp.get<PeerMeetingReport>(meetingPath(meetingId)),
  );
}

export async function savePeerMeetingReport(
  meetingId: string,
  input: SavePeerMeetingReportInput,
): Promise<PeerMeetingReport> {
  return requireSuccess(
    await backendHttp.put<PeerMeetingReport>(meetingPath(meetingId), input),
  );
}

export async function submitPeerMeetingReport(
  meetingId: string,
): Promise<PeerMeetingReport> {
  return requireSuccess(
    await backendHttp.post<PeerMeetingReport>(
      `${meetingPath(meetingId)}/submit`,
    ),
  );
}

export async function setPeerReportActionDone(
  meetingId: string,
  actionId: string,
  done: boolean,
): Promise<PeerMeetingReport> {
  return requireSuccess(
    await backendHttp.patch<PeerMeetingReport>(
      `${meetingPath(meetingId)}/actions/${encodeURIComponent(actionId)}`,
      { done },
    ),
  );
}

export async function getPeerReportWeek(
  weekStart: string,
): Promise<PeerReportWeek> {
  return requireSuccess(
    await backendHttp.get<PeerReportWeek>(`${BASE}/days`, {
      params: { week: weekStart },
    }),
  );
}

export async function getPeerDailyReport(
  date: string,
): Promise<PeerDailyReport> {
  return requireSuccess(
    await backendHttp.get<PeerDailyReport>(
      `${BASE}/days/${encodeURIComponent(date)}`,
    ),
  );
}

export async function savePeerDailyReport(
  date: string,
  input: SavePeerDailyReportInput,
): Promise<PeerDailyReport> {
  return requireSuccess(
    await backendHttp.put<PeerDailyReport>(
      `${BASE}/days/${encodeURIComponent(date)}`,
      input,
    ),
  );
}

export async function submitPeerDailyReport(
  date: string,
): Promise<PeerDailyReport> {
  return requireSuccess(
    await backendHttp.post<PeerDailyReport>(
      `${BASE}/days/${encodeURIComponent(date)}/submit`,
    ),
  );
}

export async function addPeerActivity(
  input: SavePeerActivityInput,
): Promise<PeerActivity> {
  return requireSuccess(
    await backendHttp.post<PeerActivity>(`${BASE}/activities`, input),
  );
}

export async function updatePeerActivity(
  activityId: string,
  input: SavePeerActivityInput,
): Promise<PeerActivity> {
  return requireSuccess(
    await backendHttp.put<PeerActivity>(
      `${BASE}/activities/${encodeURIComponent(activityId)}`,
      input,
    ),
  );
}

export async function deletePeerActivity(activityId: string): Promise<void> {
  requireSuccess(
    await backendHttp.delete(
      `${BASE}/activities/${encodeURIComponent(activityId)}`,
    ),
  );
}

export async function getPeerWeeklyReport(
  weekStart: string,
): Promise<PeerWeeklyReport> {
  return requireSuccess(
    await backendHttp.get<PeerWeeklyReport>(
      `${BASE}/weeks/${encodeURIComponent(weekStart)}`,
    ),
  );
}

export async function savePeerWeeklyReport(
  weekStart: string,
  input: SavePeerWeeklyReportInput,
): Promise<PeerWeeklyReport> {
  return requireSuccess(
    await backendHttp.put<PeerWeeklyReport>(
      `${BASE}/weeks/${encodeURIComponent(weekStart)}`,
      input,
    ),
  );
}

export async function submitPeerWeeklyReport(
  weekStart: string,
): Promise<PeerWeeklyReport> {
  return requireSuccess(
    await backendHttp.post<PeerWeeklyReport>(
      `${BASE}/weeks/${encodeURIComponent(weekStart)}/submit`,
    ),
  );
}
