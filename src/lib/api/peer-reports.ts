import "server-only";

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
import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";

const BASE = "/api/peer-mentoring/reports";

/** The actor's held peer meetings between two days (both included). */
export function fetchPeerReportMeetings(
  actorId: string,
  from: string,
  to: string,
) {
  return backendRequest<PeerReportMeeting[]>({
    method: HttpMethod.Get,
    url: `${BASE}/meetings`,
    params: { actorId, from, to },
  });
}

export function fetchPeerMeetingReport(actorId: string, meetingId: string) {
  return backendRequest<PeerMeetingReport>({
    method: HttpMethod.Get,
    url: `${BASE}/meetings/${encodeURIComponent(meetingId)}`,
    params: { actorId },
  });
}

export function savePeerMeetingReport(
  actorId: string,
  meetingId: string,
  input: SavePeerMeetingReportInput,
) {
  return backendRequest<PeerMeetingReport>({
    method: HttpMethod.Put,
    url: `${BASE}/meetings/${encodeURIComponent(meetingId)}`,
    data: { ...input, actorId },
  });
}

export function submitPeerMeetingReport(actorId: string, meetingId: string) {
  return backendRequest<PeerMeetingReport>({
    method: HttpMethod.Post,
    url: `${BASE}/meetings/${encodeURIComponent(meetingId)}/submit`,
    params: { actorId },
  });
}

export function updatePeerReportAction(
  actorId: string,
  meetingId: string,
  actionId: string,
  done: boolean,
) {
  return backendRequest<PeerMeetingReport>({
    method: HttpMethod.Patch,
    url: `${BASE}/meetings/${encodeURIComponent(meetingId)}/actions/${encodeURIComponent(actionId)}`,
    data: { actorId, done },
  });
}

export function fetchPeerReportWeek(actorId: string, weekStart: string) {
  return backendRequest<PeerReportWeek>({
    method: HttpMethod.Get,
    url: `${BASE}/days`,
    params: { actorId, week: weekStart },
  });
}

export function fetchPeerDailyReport(actorId: string, date: string) {
  return backendRequest<PeerDailyReport>({
    method: HttpMethod.Get,
    url: `${BASE}/days/${encodeURIComponent(date)}`,
    params: { actorId },
  });
}

export function savePeerDailyReport(
  actorId: string,
  date: string,
  input: SavePeerDailyReportInput,
) {
  return backendRequest<PeerDailyReport>({
    method: HttpMethod.Put,
    url: `${BASE}/days/${encodeURIComponent(date)}`,
    data: { ...input, actorId },
  });
}

export function submitPeerDailyReport(actorId: string, date: string) {
  return backendRequest<PeerDailyReport>({
    method: HttpMethod.Post,
    url: `${BASE}/days/${encodeURIComponent(date)}/submit`,
    params: { actorId },
  });
}

export function addPeerActivity(actorId: string, input: SavePeerActivityInput) {
  return backendRequest<PeerActivity>({
    method: HttpMethod.Post,
    url: `${BASE}/activities`,
    data: { ...input, actorId },
  });
}

export function updatePeerActivity(
  actorId: string,
  activityId: string,
  input: SavePeerActivityInput,
) {
  return backendRequest<PeerActivity>({
    method: HttpMethod.Put,
    url: `${BASE}/activities/${encodeURIComponent(activityId)}`,
    data: { ...input, actorId },
  });
}

export function deletePeerActivity(actorId: string, activityId: string) {
  return backendRequest<void>({
    method: HttpMethod.Delete,
    url: `${BASE}/activities/${encodeURIComponent(activityId)}`,
    params: { actorId },
  });
}

export function fetchPeerWeeklyReport(actorId: string, weekStart: string) {
  return backendRequest<PeerWeeklyReport>({
    method: HttpMethod.Get,
    url: `${BASE}/weeks/${encodeURIComponent(weekStart)}`,
    params: { actorId },
  });
}

export function savePeerWeeklyReport(
  actorId: string,
  weekStart: string,
  input: SavePeerWeeklyReportInput,
) {
  return backendRequest<PeerWeeklyReport>({
    method: HttpMethod.Put,
    url: `${BASE}/weeks/${encodeURIComponent(weekStart)}`,
    data: { ...input, actorId },
  });
}

export function submitPeerWeeklyReport(actorId: string, weekStart: string) {
  return backendRequest<PeerWeeklyReport>({
    method: HttpMethod.Post,
    url: `${BASE}/weeks/${encodeURIComponent(weekStart)}/submit`,
    params: { actorId },
  });
}
