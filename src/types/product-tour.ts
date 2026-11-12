/** Who a product tour is written for; each has its own steps, copy and "seen" flag. */
export enum TourRole {
  Student = "ODTU_STUDENT",
  IskurStudent = "ISKUR_STUDENT",
  Academician = "ODTU_ACADEMICIAN",
}

/**
 * The `data-tour` values screens put on the element a step points at. They are plain attributes, so a screen
 * can carry its anchor before this module is imported anywhere.
 */
export enum TourAnchor {
  NavOfficeHours = "nav-officeHours",
  NavPeerMentoring = "nav-peerMentoring",
  OfficeHoursAcademician = "office-hours-academician",
  OfficeHoursContinue = "office-hours-continue",
  AppointmentRequestSubmit = "appointment-request-submit",
  AppointmentRequestSent = "appointment-request-sent",
  PeerMentoringGiveToggle = "peer-mentoring-give-toggle",
  PeerRequestAccept = "peer-request-accept",
  AppointmentsFirstRow = "appointments-first-row",
  AvailabilityAdd = "availability-add",
  AvailabilityWeekly = "availability-weekly",
  CalendarPendingRequest = "calendar-pending-request",
  RequestDrawerAccept = "request-drawer-accept",
}

/** One message group per step under `iaTour.steps`. */
export enum TourStepKey {
  OfficeHours = "officeHours",
  PickAcademician = "pickAcademician",
  PickSlot = "pickSlot",
  SendRequest = "sendRequest",
  RequestSent = "requestSent",
  PeerMentoring = "peerMentoring",
  GiveSide = "giveSide",
  AcceptRequest = "acceptRequest",
  AppointmentsList = "appointmentsList",
  AddAvailability = "addAvailability",
  WeeklyHours = "weeklyHours",
  OpenRequest = "openRequest",
  AnswerRequest = "answerRequest",
}

/** How a step moves on. */
export enum TourAdvance {
  /** The user clicks the highlighted element (a menu item, a button that opens the next screen). */
  Click = "CLICK",
  /**
   * The next step's element shows up: a submit that can fail must not move the tour on by itself, so the step
   * waits for the success screen (the "Talebin gönderildi" banner).
   */
  Arrival = "ARRIVAL",
  /** "İleri" on the card: an area with controls of its own inside, where a click is not a "go on". */
  Next = "NEXT",
  /** "Turu Bitir" on the last step. */
  Finish = "FINISH",
}

export enum TourPhase {
  Welcome = "WELCOME",
  Step = "STEP",
  Done = "DONE",
}

/** What the user did with a tour; either way it does not start on its own again. */
export enum TourOutcome {
  Completed = "COMPLETED",
  Skipped = "SKIPPED",
}

export type TourStep = {
  key: TourStepKey;
  anchor: TourAnchor;
  advance: TourAdvance;
  /** The page the step lives on when the previous step's click does not lead there by itself. */
  route?: string;
};

export type TourDefinition = {
  role: TourRole;
  /** Where the tour opens on its own the first time. */
  home: string;
  /** Where the end dialog's button leads. */
  exit: string;
  steps: readonly TourStep[];
};

/** A tour in progress. It outlives a page change and a reload (sessionStorage). */
export type TourRun = {
  role: TourRole;
  phase: TourPhase;
  stepIndex: number;
};

export enum CardPlacement {
  Below = "BELOW",
  Above = "ABOVE",
  Right = "RIGHT",
  Left = "LEFT",
  /** No room beside the target (a phone): the card sits at the bottom of the screen without an arrow. */
  Docked = "DOCKED",
  /** The target is not on the screen: the card sits in the middle. */
  Centered = "CENTERED",
}

export type Box = { top: number; left: number; width: number; height: number };

export type CardPosition = {
  top: number;
  left: number;
  width: number;
  placement: CardPlacement;
  /** Where the arrow's centre sits along the card's facing edge, in px from its start; null without an arrow. */
  arrowOffset: number | null;
};
