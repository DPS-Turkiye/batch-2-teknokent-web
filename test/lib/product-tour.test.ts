import { describe, expect, it } from "vitest";

import { Workspace } from "@/interfaces/workspace";
import {
  anchorSelector,
  CARD_WIDTH,
  grow,
  isInteractiveElement,
  isOnRoute,
  panesAround,
  placeCard,
  TOUR_ILLUSTRATIONS,
  tourRoleOf,
  TOURS,
} from "@/lib/product-tour";
import {
  CardPlacement,
  TourAdvance,
  TourAnchor,
  TourRole,
  type Box,
} from "@/types/product-tour";

const DESKTOP = { width: 1440, height: 900 };

function box(left: number, top: number, width: number, height: number): Box {
  return { left, top, width, height };
}

describe("tourRoleOf", () => {
  it("gives ODTÜ students the appointment tour and İŞKUR participants the peer-mentoring one", () => {
    expect(tourRoleOf(Workspace.OdtuStudent, false)).toBe(TourRole.Student);
    expect(tourRoleOf(Workspace.OdtuStudent, true)).toBe(TourRole.IskurStudent);
  });

  it("gives academicians their tour whatever the İŞKUR flag says", () => {
    expect(tourRoleOf(Workspace.OdtuAcademician, true)).toBe(
      TourRole.Academician,
    );
  });

  it("has no tour for Teknokent and staff workspaces, or no workspace", () => {
    expect(tourRoleOf(Workspace.GirisimMentee, false)).toBeNull();
    expect(tourRoleOf(Workspace.Coordinator, false)).toBeNull();
    expect(tourRoleOf(null, true)).toBeNull();
  });
});

describe("TOURS", () => {
  it("follows the frames: 5 student steps, 4 İŞKUR steps, 4 academician steps", () => {
    expect(TOURS[TourRole.Student].steps).toHaveLength(5);
    expect(TOURS[TourRole.IskurStudent].steps).toHaveLength(4);
    expect(TOURS[TourRole.Academician].steps).toHaveLength(4);
  });

  it("starts every tour on its home page and ends the academician's in Randevularım", () => {
    expect(TOURS[TourRole.Student].home).toBe("/student");
    expect(TOURS[TourRole.Academician].exit).toBe("/academician/appointments");
    for (const tour of Object.values(TOURS)) {
      expect(tour.steps[0]?.route).toBe(tour.home);
    }
  });

  it("points the menu steps at the kit's nav anchors", () => {
    expect(TOURS[TourRole.Student].steps[0]?.anchor).toBe(
      TourAnchor.NavOfficeHours,
    );
    expect(TOURS[TourRole.IskurStudent].steps[0]?.anchor).toBe(
      TourAnchor.NavPeerMentoring,
    );
  });

  it("finishes the student tours with Turu Bitir and the academician's with the Kabul Et click", () => {
    expect(TOURS[TourRole.Student].steps.at(-1)?.advance).toBe(
      TourAdvance.Finish,
    );
    expect(TOURS[TourRole.IskurStudent].steps.at(-1)?.advance).toBe(
      TourAdvance.Finish,
    );
    expect(TOURS[TourRole.Academician].steps.at(-1)?.advance).toBe(
      TourAdvance.Click,
    );
  });

  it("uses each step's copy once within a tour", () => {
    for (const tour of Object.values(TOURS)) {
      const keys = tour.steps.map((step) => step.key);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  it("has a welcome picture for every role", () => {
    expect(TOUR_ILLUSTRATIONS[TourRole.Academician].src).toBe(
      "/ia/tour/office-hours-ready.webp",
    );
    expect(TOUR_ILLUSTRATIONS[TourRole.IskurStudent]).toBe(
      TOUR_ILLUSTRATIONS[TourRole.Student],
    );
  });
});

describe("anchorSelector and isOnRoute", () => {
  it("selects by data-tour", () => {
    expect(anchorSelector(TourAnchor.AvailabilityAdd)).toBe(
      '[data-tour="availability-add"]',
    );
  });

  it("matches the exact page, ignoring a trailing slash", () => {
    expect(isOnRoute("/student/", "/student")).toBe(true);
    expect(isOnRoute("/student/appointments", "/student")).toBe(false);
    expect(isOnRoute("/", "/")).toBe(true);
  });
});

describe("isInteractiveElement", () => {
  function element(html: string) {
    const host = document.createElement("div");
    host.innerHTML = html;
    const child = host.firstElementChild;
    if (child === null) throw new Error("no element");
    return child;
  }

  it("accepts links, buttons and form controls", () => {
    expect(isInteractiveElement(element('<a href="/x">x</a>'))).toBe(true);
    expect(isInteractiveElement(element("<button>x</button>"))).toBe(true);
    expect(isInteractiveElement(element("<input />"))).toBe(true);
  });

  it("accepts elements with an interactive role or a tab stop", () => {
    expect(isInteractiveElement(element('<div role="tab">x</div>'))).toBe(true);
    expect(isInteractiveElement(element('<div tabindex="0">x</div>'))).toBe(
      true,
    );
  });

  it("refuses plain blocks and elements taken out of the tab order", () => {
    expect(isInteractiveElement(element("<section>x</section>"))).toBe(false);
    expect(isInteractiveElement(element('<div tabindex="-1">x</div>'))).toBe(
      false,
    );
    expect(isInteractiveElement(element('<div role="region">x</div>'))).toBe(
      false,
    );
  });
});

describe("placeCard", () => {
  it("centres the card when the target is missing", () => {
    expect(placeCard(null, 200, DESKTOP)).toEqual({
      top: 350,
      left: 550,
      width: CARD_WIDTH,
      placement: CardPlacement.Centered,
      arrowOffset: null,
    });
  });

  it("docks the card at the bottom of a phone screen", () => {
    expect(
      placeCard(box(20, 300, 100, 40), 200, { width: 390, height: 800 }),
    ).toEqual({
      top: 584,
      left: 16,
      width: 358,
      placement: CardPlacement.Docked,
      arrowOffset: null,
    });
  });

  it("puts the card under a menu item, with the arrow under its centre", () => {
    const position = placeCard(box(673, 24, 159, 58), 210, DESKTOP);
    expect(position.placement).toBe(CardPlacement.Below);
    expect(position.top).toBe(24 + 58 + 18);
    expect(position.left + (position.arrowOffset ?? 0)).toBeCloseTo(752.5);
  });

  it("puts the card right of a content element when there is room", () => {
    const position = placeCard(box(72, 496, 429, 266), 210, DESKTOP);
    expect(position.placement).toBe(CardPlacement.Right);
    expect(position.left).toBe(72 + 429 + 18);
  });

  it("puts the card left of an element at the right edge", () => {
    const position = placeCard(box(1223, 548, 120, 60), 210, DESKTOP);
    expect(position.placement).toBe(CardPlacement.Left);
    expect(position.left).toBe(1223 - 18 - CARD_WIDTH);
  });

  it("puts the card under a full-width banner, and above one at the bottom", () => {
    expect(placeCard(box(72, 150, 1296, 84), 230, DESKTOP).placement).toBe(
      CardPlacement.Below,
    );
    expect(placeCard(box(72, 700, 1296, 84), 230, DESKTOP).placement).toBe(
      CardPlacement.Above,
    );
  });

  it("never gives the card a negative width on a zero-sized first render", () => {
    expect(placeCard(null, 210, { width: 0, height: 0 }).width).toBe(0);
    expect(
      placeCard(box(0, 0, 10, 10), 210, { width: 20, height: 400 }).width,
    ).toBe(0);
  });

  it("does not put a card taller than the screen beside the element", () => {
    const position = placeCard(box(72, 300, 200, 60), 1000, {
      width: 1440,
      height: 800,
    });
    expect(position.placement).toBe(CardPlacement.Docked);
    expect(position.top).toBe(16);
  });

  it("keeps the card on screen when the element fills it", () => {
    const position = placeCard(box(0, 0, 1440, 900), 210, DESKTOP);
    expect(position.placement).toBe(CardPlacement.Docked);
    expect(position.top).toBe(900 - 210 - 16);
  });

  it("keeps the arrow inside the card when the element sits at the screen edge", () => {
    const position = placeCard(box(1400, 20, 30, 40), 210, DESKTOP);
    expect(position.placement).toBe(CardPlacement.Below);
    expect(position.left).toBe(1440 - CARD_WIDTH - 16);
    expect(position.arrowOffset).toBe(CARD_WIDTH - 24);
  });
});

describe("panesAround and grow", () => {
  it("covers the screen around the box and leaves the box open", () => {
    expect(panesAround(box(100, 50, 200, 40), DESKTOP)).toEqual({
      top: box(0, 0, 1440, 50),
      bottom: box(0, 90, 1440, 810),
      left: box(0, 50, 100, 40),
      right: box(300, 50, 1140, 40),
    });
  });

  it("never gives a pane a negative size for a box scrolled partly off screen", () => {
    const panes = panesAround(box(-20, -30, 100, 60), DESKTOP);
    expect(panes.top.height).toBe(0);
    expect(panes.left.width).toBe(0);
  });

  it("grows a box on every side", () => {
    expect(grow(box(10, 20, 30, 40), 8)).toEqual(box(2, 12, 46, 56));
  });
});
