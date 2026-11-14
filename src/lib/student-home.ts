import { AppointmentStatus, type Appointment } from "@/interfaces/appointment";
import type {
  PeerMentorCard,
  PeerMentoringRequest,
} from "@/interfaces/peer-mentoring";
import { splitAppointments } from "@/lib/appointments";
import { OPEN_PEER_REQUEST_STATUSES } from "@/lib/peer-mentoring";

/** Ana Sayfa shows this many rows per list (upcoming, waiting requests). */
export const STUDENT_HOME_PREVIEW = 3;
/** Ana Sayfa recommends this many peer mentors. */
export const STUDENT_HOME_MENTOR_COUNT = 2;

/** Asked for but not settled yet: the student's "talep" side of the appointments. */
const AWAITING_STATUSES: ReadonlySet<AppointmentStatus> = new Set([
  AppointmentStatus.Pending,
  AppointmentStatus.AlternativeProposed,
]);

export function isAwaitingAnswer(appointment: Appointment) {
  return AWAITING_STATUSES.has(appointment.status);
}

/** What Ana Sayfa needs from the student's appointments, read at `now`. */
export function summarizeAppointments(appointments: Appointment[], now: Date) {
  const { upcoming } = splitAppointments(appointments, now);
  const awaiting = upcoming.filter(isAwaitingAnswer);
  return {
    /** The soonest of everything ahead, settled or not. */
    next: upcoming[0] ?? null,
    upcoming: upcoming.slice(0, STUDENT_HOME_PREVIEW),
    /** Confirmed sessions ahead; requests are counted separately. */
    confirmedCount: upcoming.length - awaiting.length,
    awaiting,
  };
}

/** The peer requests the student sent that a mentor has not answered yet, newest first. */
export function openPeerRequests(requests: PeerMentoringRequest[]) {
  return requests
    .filter((request) => OPEN_PEER_REQUEST_STATUSES.includes(request.status))
    .toSorted((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

/**
 * "Bekleyen taleplerim" as one list of at most `STUDENT_HOME_PREVIEW` rows: the appointment requests first, then
 * the peer requests. `total` counts all of them, for "Tümü (n)".
 */
export function waitingPreview(
  awaiting: Appointment[],
  peerRequests: PeerMentoringRequest[],
) {
  const shownAwaiting = awaiting.slice(0, STUDENT_HOME_PREVIEW);
  return {
    awaiting: shownAwaiting,
    peerRequests: peerRequests.slice(
      0,
      STUDENT_HOME_PREVIEW - shownAwaiting.length,
    ),
    total: awaiting.length + peerRequests.length,
  };
}

/** Mentors with a free place and a reason to show, in the backend's (best match first) order. */
export function recommendedPeerMentors(mentors: PeerMentorCard[]) {
  return mentors
    .filter(
      (mentor) =>
        !mentor.capacityFull && mentor.recommendationReasons.length > 0,
    )
    .slice(0, STUDENT_HOME_MENTOR_COUNT);
}

/** "Ayşe Nur Yılmaz" → "Ayşe": the greeting uses the first given name only. */
export function greetingName(fullName: string | null | undefined) {
  const first = fullName?.trim().split(/\s+/)[0];
  return first === undefined || first === "" ? null : first;
}
