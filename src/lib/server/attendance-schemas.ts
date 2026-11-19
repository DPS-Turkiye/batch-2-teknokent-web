import { z } from "zod";

import {
  AttendanceSessionKind,
  type AttendanceSessionRef,
} from "@/interfaces/program-attendance";
import { invalidRequest, type JsonBody } from "@/lib/server/request-body";

/** The token in a session QR code's link: base64url, at most the 64 characters the backend stores. */
export const ATTENDANCE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

export const sessionCheckInSchema = z.object({
  token: z.string().regex(ATTENDANCE_TOKEN_PATTERN),
});

const sessionSchema = z.object({
  // Digits only: Number() would also take "1e2", "0x10" or " 5 ".
  week: z
    .string()
    .regex(/^[1-9]\d{0,2}$/)
    .transform(Number)
    .pipe(z.number().int().min(1).max(520)),
  kind: z.enum(AttendanceSessionKind),
});

const participantSchema = sessionSchema.extend({ userId: z.uuid() });

/** A route's `[week]/[kind]` segments, or a 400 before the backend is called. */
export async function readAttendanceSession(params: {
  week: string;
  kind: string;
}): Promise<JsonBody<AttendanceSessionRef>> {
  const parsed = sessionSchema.safeParse(params);
  return parsed.success
    ? { ok: true, data: parsed.data }
    : { ok: false, response: await invalidRequest("invalidRequestFields") };
}

/** A route's `[week]/[kind]/participants/[userId]` segments, or a 400. */
export async function readAttendanceParticipant(params: {
  week: string;
  kind: string;
  userId: string;
}): Promise<JsonBody<AttendanceSessionRef & { userId: string }>> {
  const parsed = participantSchema.safeParse(params);
  return parsed.success
    ? { ok: true, data: parsed.data }
    : { ok: false, response: await invalidRequest("invalidRequestFields") };
}
