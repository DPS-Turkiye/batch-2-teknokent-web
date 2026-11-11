/** The program filter of the admin home page; also the message keys under `adminHome.scopes`. */
export enum HomeProgramScope {
  All = "ALL",
  Active = "ACTIVE",
  Completed = "COMPLETED",
}

/** Why a row is on the home page's intervention list. */
export enum HomeInterventionKind {
  /** A pair that has gone too long without a meeting. */
  Pair = "pair",
  /** Open bottlenecks with the same title. */
  Bottleneck = "bottleneck",
  /** Mentors waiting for a program's approval. */
  Access = "access",
}

/** How urgent an intervention row reads. */
export enum InterventionTone {
  Red = "red",
  Amber = "amber",
  Neutral = "neutral",
}
