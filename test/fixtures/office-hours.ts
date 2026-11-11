import {
  OfficeHoursRequestStatus,
  type OfficeHoursRequest,
} from "@/interfaces/office-hours";

/** A student's pending office-hours request to Ali Kaya with two preferred times. */
export function officeHoursRequest(
  overrides: Partial<OfficeHoursRequest> = {},
): OfficeHoursRequest {
  return {
    id: "req-1",
    courseId: "course-1",
    status: OfficeHoursRequestStatus.Pending,
    student: { id: "student-1", fullName: "Ayşe Yılmaz" },
    instructor: { id: "academic-1", fullName: "Ali Kaya" },
    topic: "2. ödevin 3. sorusu",
    expectedOutcome: null,
    preferredSlots: ["2026-11-12T09:00", "2026-11-12T10:30"],
    proposedSlots: [],
    instructorMessage: null,
    rejectionReason: null,
    messages: [],
    meeting: null,
    createdAt: "2026-11-07T10:00:00Z",
    ...overrides,
  };
}
