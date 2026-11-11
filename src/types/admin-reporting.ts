/** The period picker of Raporlama; also the message keys under `adminReporting.ranges`. */
export enum ReportRange {
  EightWeeks = "8",
  Quarter = "13",
  WholeProgram = "all",
}

/** The tabs of Raporlama; also the message keys under `adminReporting.tabs`. */
export enum ReportTab {
  Program = "program",
  Health = "health",
  Activity = "activity",
}

/** A heatmap cell: a completed meeting that week, none, or nothing to judge (no dates, a future week, not started). */
export enum HeatCell {
  Held = "held",
  Missed = "missed",
  Unknown = "unknown",
}
