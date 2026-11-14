/** The range Randevularım's calendar shows (Figma "Gün / Hafta / Ay"). */
export enum AppointmentsCalendarView {
  Day = "day",
  Week = "week",
  Month = "month",
}

/** The chips above the calendar ("Tümü / Randevular / Talepler / Müsaitlik"). */
export enum AppointmentsFilter {
  All = "all",
  Appointments = "appointments",
  Requests = "requests",
  Availability = "availability",
}

/** What a block on the calendar stands for; each kind has its own look in the legend. */
export enum CalendarEntryKind {
  /** A booked appointment ("Onaylandı"). */
  Confirmed = "confirmed",
  /** A time a student asked for that waits for the academician ("Onay Bekliyor"). */
  PendingRequest = "pendingRequest",
  /** A time that waits for the student: offered instead, or asked about ("Öneri · öğrenci yanıtı"). */
  AwaitingStudent = "awaitingStudent",
  /** A weekly range ("Tekrarlanan"). */
  Recurring = "recurring",
  /** Hours on one date ("Tek seferlik"). */
  OneOff = "oneOff",
  /** A day off ("Müsait değil"); it closes every other hour that day. */
  Unavailable = "unavailable",
}

/** How a requested time sits against the academician's hours, for the drawer's note. */
export enum RequestFit {
  Fits = "fits",
  Outside = "outside",
  Clash = "clash",
  DayOff = "dayOff",
  Past = "past",
}

/** Which part of an open request the page shows: its drawer, or the propose dialog. */
export enum RequestStep {
  Detail = "detail",
  Propose = "propose",
}
