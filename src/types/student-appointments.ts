/** Randevularım's four ways to look at the same appointments (Figma: Liste · Gün · Hafta · Ay). */
export enum AppointmentsView {
  List = "list",
  Day = "day",
  Week = "week",
  Month = "month",
}

/** The list view's tabs: settled sessions ahead, requests still waiting, and everything else. */
export enum AppointmentsTab {
  Upcoming = "upcoming",
  Requests = "requests",
  Past = "past",
}
