import { Workspace } from "@/interfaces/workspace";
import {
  CardPlacement,
  TourAdvance,
  TourAnchor,
  TourRole,
  TourStepKey,
  type Box,
  type CardPosition,
  type TourDefinition,
} from "@/types/product-tour";

const STUDENT_HOME = "/student";
const STUDENT_APPOINTMENTS = "/student/appointments";
const ACADEMICIAN_HOME = "/academician";
const ACADEMICIAN_APPOINTMENTS = "/academician/appointments";

/** The steps of each tour, in the order of the "07 Product Tour" frames. */
export const TOURS: Readonly<Record<TourRole, TourDefinition>> = {
  [TourRole.Student]: {
    role: TourRole.Student,
    home: STUDENT_HOME,
    exit: STUDENT_HOME,
    steps: [
      {
        key: TourStepKey.OfficeHours,
        anchor: TourAnchor.NavOfficeHours,
        advance: TourAdvance.Click,
        route: STUDENT_HOME,
      },
      {
        key: TourStepKey.PickAcademician,
        anchor: TourAnchor.OfficeHoursAcademician,
        advance: TourAdvance.Click,
      },
      {
        key: TourStepKey.PickSlot,
        anchor: TourAnchor.OfficeHoursContinue,
        advance: TourAdvance.Click,
      },
      {
        key: TourStepKey.SendRequest,
        anchor: TourAnchor.AppointmentRequestSubmit,
        advance: TourAdvance.Click,
      },
      {
        key: TourStepKey.RequestSent,
        anchor: TourAnchor.AppointmentRequestSent,
        advance: TourAdvance.Finish,
        route: STUDENT_APPOINTMENTS,
      },
    ],
  },
  [TourRole.IskurStudent]: {
    role: TourRole.IskurStudent,
    home: STUDENT_HOME,
    exit: STUDENT_HOME,
    steps: [
      {
        key: TourStepKey.PeerMentoring,
        anchor: TourAnchor.NavPeerMentoring,
        advance: TourAdvance.Click,
        route: STUDENT_HOME,
      },
      {
        key: TourStepKey.GiveSide,
        anchor: TourAnchor.PeerMentoringGiveToggle,
        advance: TourAdvance.Click,
      },
      {
        key: TourStepKey.AcceptRequest,
        anchor: TourAnchor.PeerRequestAccept,
        advance: TourAdvance.Click,
      },
      {
        key: TourStepKey.AppointmentsList,
        anchor: TourAnchor.AppointmentsFirstRow,
        advance: TourAdvance.Finish,
        route: STUDENT_APPOINTMENTS,
      },
    ],
  },
  [TourRole.Academician]: {
    role: TourRole.Academician,
    home: ACADEMICIAN_HOME,
    exit: ACADEMICIAN_APPOINTMENTS,
    steps: [
      {
        key: TourStepKey.AddAvailability,
        anchor: TourAnchor.AvailabilityAdd,
        advance: TourAdvance.Click,
        route: ACADEMICIAN_HOME,
      },
      {
        key: TourStepKey.WeeklyHours,
        anchor: TourAnchor.AvailabilityWeekly,
        advance: TourAdvance.Click,
      },
      {
        key: TourStepKey.OpenRequest,
        anchor: TourAnchor.CalendarPendingRequest,
        advance: TourAdvance.Click,
        route: ACADEMICIAN_APPOINTMENTS,
      },
      {
        key: TourStepKey.AnswerRequest,
        anchor: TourAnchor.RequestDrawerAccept,
        advance: TourAdvance.Click,
      },
    ],
  },
};

/**
 * The tour this account gets in its workspace: ODTÜ students (İŞKUR participants have their own) and academicians.
 * Teknokent workspaces have no tour yet.
 */
export function tourRoleOf(
  workspace: Workspace | null,
  iskurParticipant: boolean,
): TourRole | null {
  if (workspace === Workspace.OdtuAcademician) return TourRole.Academician;
  if (workspace === Workspace.OdtuStudent) {
    return iskurParticipant ? TourRole.IskurStudent : TourRole.Student;
  }
  return null;
}

/** The `data-tour` selector of a step's anchor. */
export function anchorSelector(anchor: TourAnchor) {
  return `[data-tour="${anchor}"]`;
}

/** Whether a page path is exactly a step's page, ignoring a trailing slash. */
export function isOnRoute(pathname: string, route: string) {
  const path = pathname.replace(/\/+$/, "") || "/";
  return path === route;
}

const INTERACTIVE_TAGS = new Set([
  "A",
  "BUTTON",
  "INPUT",
  "SELECT",
  "TEXTAREA",
  "SUMMARY",
]);
const INTERACTIVE_ROLES = new Set([
  "button",
  "link",
  "tab",
  "option",
  "menuitem",
  "checkbox",
  "radio",
  "switch",
]);

/**
 * Whether a keyboard user can reach and press the element. A step on anything else also shows "İleri", so the
 * tour never asks for a click only a mouse can make.
 */
export function isInteractiveElement(element: Element) {
  if (INTERACTIVE_TAGS.has(element.tagName)) return true;
  const role = element.getAttribute("role");
  if (role !== null && INTERACTIVE_ROLES.has(role)) return true;
  const tabIndex = element.getAttribute("tabindex");
  return tabIndex !== null && Number(tabIndex) >= 0;
}

export const CARD_WIDTH = 340;
/** The card's height before it is measured: the design's three-line step. */
export const CARD_FALLBACK_HEIGHT = 210;
const GAP = 18;
const MARGIN = 16;
const ARROW_INSET = 24;
const DOCK_BELOW_WIDTH = 640;
/** Targets inside the top bar (the menu) get the card underneath, as in the design. */
const TOP_BAR_BOTTOM = 120;

type Viewport = { width: number; height: number };
type SidePlacement = Exclude<
  CardPlacement,
  CardPlacement.Docked | CardPlacement.Centered
>;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function arrowAlong(center: number, start: number, length: number) {
  return clamp(center - start, ARROW_INSET, length - ARROW_INSET);
}

/**
 * Where the step card goes: beside the highlighted element on the first side with room, clamped to the screen,
 * with the arrow pointing at the element. Phones get the card docked at the bottom; a missing target centres it.
 */
export function placeCard(
  target: Box | null,
  cardHeight: number,
  viewport: Viewport,
): CardPosition {
  const width = Math.min(CARD_WIDTH, viewport.width - MARGIN * 2);
  const docked = {
    top: Math.max(MARGIN, viewport.height - cardHeight - MARGIN),
    left: MARGIN,
    width,
    placement: CardPlacement.Docked,
    arrowOffset: null,
  };
  if (target === null) {
    return {
      top: Math.max(MARGIN, (viewport.height - cardHeight) / 2),
      left: (viewport.width - width) / 2,
      width,
      placement: CardPlacement.Centered,
      arrowOffset: null,
    };
  }
  if (viewport.width < DOCK_BELOW_WIDTH) {
    return { ...docked, width: viewport.width - MARGIN * 2 };
  }

  const centerX = target.left + target.width / 2;
  // Beside a tall element the arrow points near its top, where its title usually is.
  const anchorY = target.top + Math.min(target.height / 2, 32);
  const horizontalLeft = clamp(
    centerX - width / 2,
    MARGIN,
    viewport.width - width - MARGIN,
  );
  const sideTop = clamp(
    anchorY - ARROW_INSET - 8,
    MARGIN,
    viewport.height - cardHeight - MARGIN,
  );

  const candidates: Record<
    SidePlacement,
    { fits: boolean; position: CardPosition }
  > = {
    [CardPlacement.Below]: {
      fits:
        target.top + target.height + GAP + cardHeight <=
        viewport.height - MARGIN,
      position: {
        top: target.top + target.height + GAP,
        left: horizontalLeft,
        width,
        placement: CardPlacement.Below,
        arrowOffset: arrowAlong(centerX, horizontalLeft, width),
      },
    },
    [CardPlacement.Above]: {
      fits: target.top - GAP - cardHeight >= MARGIN,
      position: {
        top: target.top - GAP - cardHeight,
        left: horizontalLeft,
        width,
        placement: CardPlacement.Above,
        arrowOffset: arrowAlong(centerX, horizontalLeft, width),
      },
    },
    [CardPlacement.Right]: {
      fits: target.left + target.width + GAP + width <= viewport.width - MARGIN,
      position: {
        top: sideTop,
        left: target.left + target.width + GAP,
        width,
        placement: CardPlacement.Right,
        arrowOffset: arrowAlong(anchorY, sideTop, cardHeight),
      },
    },
    [CardPlacement.Left]: {
      fits: target.left - GAP - width >= MARGIN,
      position: {
        top: sideTop,
        left: target.left - GAP - width,
        width,
        placement: CardPlacement.Left,
        arrowOffset: arrowAlong(anchorY, sideTop, cardHeight),
      },
    },
  };

  const order: SidePlacement[] =
    target.top + target.height <= TOP_BAR_BOTTOM
      ? [
          CardPlacement.Below,
          CardPlacement.Right,
          CardPlacement.Left,
          CardPlacement.Above,
        ]
      : [
          CardPlacement.Right,
          CardPlacement.Left,
          CardPlacement.Below,
          CardPlacement.Above,
        ];
  const fitting = order.find((placement) => candidates[placement].fits);
  // Nothing fits (an element as big as the screen): keep the card on screen at the bottom.
  return fitting === undefined ? docked : candidates[fitting].position;
}

/** The four rectangles around a box that dim the page and catch clicks, leaving the box itself open. */
export function panesAround(
  box: Box,
  viewport: Viewport,
): Record<"top" | "bottom" | "left" | "right", Box> {
  const right = box.left + box.width;
  const bottom = box.top + box.height;
  return {
    top: {
      top: 0,
      left: 0,
      width: viewport.width,
      height: Math.max(0, box.top),
    },
    bottom: {
      top: bottom,
      left: 0,
      width: viewport.width,
      height: Math.max(0, viewport.height - bottom),
    },
    left: {
      top: box.top,
      left: 0,
      width: Math.max(0, box.left),
      height: box.height,
    },
    right: {
      top: box.top,
      left: right,
      width: Math.max(0, viewport.width - right),
      height: box.height,
    },
  };
}

type Illustration = { src: string; width: number; height: number };

const FIRST_APPOINTMENT: Illustration = {
  src: "/ia/tour/first-appointment.webp",
  width: 456,
  height: 304,
};

/** The welcome dialog's picture: students share one, academicians get the smaller "empty chairs" one. */
export const TOUR_ILLUSTRATIONS: Readonly<Record<TourRole, Illustration>> = {
  [TourRole.Student]: FIRST_APPOINTMENT,
  [TourRole.IskurStudent]: FIRST_APPOINTMENT,
  [TourRole.Academician]: {
    src: "/ia/tour/office-hours-ready.webp",
    width: 286,
    height: 190,
  },
};

/** A box grown by `by` px on every side (the halo around the highlight). */
export function grow(box: Box, by: number): Box {
  return {
    top: box.top - by,
    left: box.left - by,
    width: box.width + by * 2,
    height: box.height + by * 2,
  };
}
