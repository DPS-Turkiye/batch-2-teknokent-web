/** What one line of the academician's availability describes ("Müsaitliğim"). */
export enum AvailabilityItemKind {
  Recurring = "recurring",
  OneOff = "oneOff",
  Unavailable = "unavailable",
}

/** Why an availability form can't be saved; each has its own message. */
export enum AvailabilityFormError {
  NeedFields = "needFields",
  EndAfterStart = "endAfterStart",
  Overlap = "overlap",
  Past = "past",
  InsideDayOff = "insideDayOff",
}

/** What the "Yaklaşan randevu" cell of an advisee shows. */
export enum AdviseeNextKind {
  Appointment = "appointment",
  PendingRequest = "pendingRequest",
}

/** The badge of one line in "Seninle randevuları". */
export enum StudentHistoryBadge {
  Pending = "pending",
  Proposed = "proposed",
  Confirmed = "confirmed",
  Completed = "completed",
  Cancelled = "cancelled",
}

/** Where a student's profile was opened from; its "←" link goes back there. */
export enum StudentProfileOrigin {
  Appointments = "appointments",
  Advisees = "advisees",
}
