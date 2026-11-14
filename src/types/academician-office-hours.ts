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
  HidesOneOff = "hidesOneOff",
}
