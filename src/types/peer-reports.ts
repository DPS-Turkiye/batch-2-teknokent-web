/**
 * What a report's status pill says (Figma 209:24). Beyond the stored statuses it has "Eksik Bilgi" (a held meeting
 * still lacks its report) and the row states "Tamamlandı" and "Çıktı Bekliyor".
 */
export enum PeerReportBadge {
  Draft = "draft",
  MissingInfo = "missingInfo",
  InReview = "inReview",
  RevisionRequested = "revisionRequested",
  Approved = "approved",
  Completed = "completed",
  AwaitingOutput = "awaitingOutput",
}

/** The two views of "Faaliyet Raporum". */
export enum PeerReportView {
  Daily = "daily",
  Weekly = "weekly",
}
