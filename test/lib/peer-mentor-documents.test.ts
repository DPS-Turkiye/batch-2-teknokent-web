import { describe, expect, it } from "vitest";

import {
  PeerDocumentVisibility,
  PeerEvidenceType,
} from "@/interfaces/peer-mentor-documents";
import { PeerTopicCategory } from "@/interfaces/peer-mentoring";
import {
  cardOf,
  evidenceCards,
  evidenceFileProblem,
  PEER_EVIDENCE_MAX_BYTES,
  requiredEvidence,
  requiringCategory,
  sharedEvidence,
  uploadTypeOf,
} from "@/lib/peer-mentor-documents";
import {
  EvidenceCard,
  EvidenceFileProblem,
} from "@/types/peer-mentor-evidence";
import { itemAt } from "@test/fixtures/list-assertions";
import {
  peerFileFixture,
  peerLinkFixture,
} from "@test/fixtures/peer-mentor-documents";

function card(views: ReturnType<typeof evidenceCards>, which: EvidenceCard) {
  const view = views.find((item) => item.card === which);
  if (!view) throw new Error(`no ${which} card`);
  return view;
}

describe("evidenceCards", () => {
  it("lists the five cards and puts each piece of evidence on its own card", () => {
    const cards = evidenceCards(
      [
        peerFileFixture(),
        peerFileFixture({ id: "award", evidenceType: PeerEvidenceType.Award }),
        peerLinkFixture(),
      ],
      [],
      {},
      false,
    );

    expect(cards.map((view) => view.card)).toEqual([
      EvidenceCard.Transcript,
      EvidenceCard.Cv,
      EvidenceCard.Certificate,
      EvidenceCard.Portfolio,
      EvidenceCard.Other,
    ]);
    expect(card(cards, EvidenceCard.Transcript).documents).toHaveLength(1);
    expect(card(cards, EvidenceCard.Other).documents.map((d) => d.id)).toEqual([
      "award",
    ]);
    expect(card(cards, EvidenceCard.Portfolio).done).toBe(true);
    expect(card(cards, EvidenceCard.Cv).done).toBe(false);
  });

  it("marks a card required only when its category is chosen", () => {
    const cards = evidenceCards(
      [],
      [PeerTopicCategory.CareerInternship, PeerTopicCategory.CampusLife],
      {},
      false,
    );

    expect(card(cards, EvidenceCard.Cv).requiredFor).toBe(
      PeerTopicCategory.CareerInternship,
    );
    expect(card(cards, EvidenceCard.Transcript).requiredFor).toBeNull();
    expect(card(cards, EvidenceCard.Certificate).requiredFor).toBeNull();
  });

  it("shows what a card's evidence is saved as, else the pick for its first upload, else the default", () => {
    const shown = peerFileFixture({
      visibility: PeerDocumentVisibility.Profile,
    });
    const cards = evidenceCards(
      [shown],
      [],
      {
        // A pick that did not save never hides what the server has.
        [EvidenceCard.Transcript]: PeerDocumentVisibility.VerificationOnly,
        [EvidenceCard.Cv]: PeerDocumentVisibility.VerificationOnly,
      },
      false,
    );

    expect(card(cards, EvidenceCard.Transcript).visibility).toBe(
      PeerDocumentVisibility.Profile,
    );
    expect(card(cards, EvidenceCard.Cv).visibility).toBe(
      PeerDocumentVisibility.VerificationOnly,
    );
    expect(card(cards, EvidenceCard.Portfolio).visibility).toBe(
      PeerDocumentVisibility.Profile,
    );
    expect(card(cards, EvidenceCard.Other).visibility).toBe(
      PeerDocumentVisibility.VerificationOnly,
    );
  });

  it("counts a LinkedIn link for the portfolio card", () => {
    const cards = evidenceCards(
      [],
      [PeerTopicCategory.TechnicalDigital],
      {},
      true,
    );

    expect(card(cards, EvidenceCard.Portfolio).done).toBe(true);
  });
});

describe("requiredEvidence", () => {
  it("counts the required cards that are done and names them", () => {
    const required = requiredEvidence(
      evidenceCards(
        [peerFileFixture()],
        [
          PeerTopicCategory.AcademicDevelopment,
          PeerTopicCategory.CareerInternship,
        ],
        {},
        false,
      ),
    );

    expect(required).toEqual({
      done: 1,
      total: 2,
      percent: 50,
      cards: [
        {
          card: EvidenceCard.Transcript,
          category: PeerTopicCategory.AcademicDevelopment,
        },
        { card: EvidenceCard.Cv, category: PeerTopicCategory.CareerInternship },
      ],
    });
  });

  it("is full when nothing is required", () => {
    expect(requiredEvidence(evidenceCards([], [], {}, false))).toEqual({
      done: 0,
      total: 0,
      percent: 100,
      cards: [],
    });
  });
});

describe("evidence types", () => {
  it("maps each type to its card and back", () => {
    expect(cardOf(PeerEvidenceType.Cv)).toBe(EvidenceCard.Cv);
    expect(cardOf(PeerEvidenceType.Volunteering)).toBe(EvidenceCard.Other);
    expect(uploadTypeOf(EvidenceCard.Certificate, PeerEvidenceType.Award)).toBe(
      PeerEvidenceType.Certificate,
    );
    expect(uploadTypeOf(EvidenceCard.Other, PeerEvidenceType.Award)).toBe(
      PeerEvidenceType.Award,
    );
    expect(requiringCategory(EvidenceCard.Portfolio)).toBe(
      PeerTopicCategory.TechnicalDigital,
    );
    expect(requiringCategory(EvidenceCard.Other)).toBeNull();
  });
});

describe("evidenceFileProblem", () => {
  it("takes PDFs up to the limit and nothing else", () => {
    expect(evidenceFileProblem({ name: "cv.PDF", size: 1024 })).toBeNull();
    expect(evidenceFileProblem({ name: "cv.docx", size: 1024 })).toBe(
      EvidenceFileProblem.NotPdf,
    );
    expect(
      evidenceFileProblem({
        name: "cv.pdf",
        size: PEER_EVIDENCE_MAX_BYTES + 1,
      }),
    ).toBe(EvidenceFileProblem.TooLarge);
  });
});

describe("sharedEvidence", () => {
  it("splits files from links and drops a link that is not a web address", () => {
    const shared = sharedEvidence([
      peerFileFixture(),
      peerLinkFixture(),
      peerLinkFixture({ id: "bad", url: "javascript:alert(1)" }),
    ]);

    expect(shared.files.map((file) => file.id)).toEqual([peerFileFixture().id]);
    expect(shared.links).toEqual([
      {
        id: peerLinkFixture().id,
        url: "https://github.com/mertdemir",
        host: "github.com",
      },
    ]);
    expect(itemAt(shared.links, 0).url).toMatch(/^https:/);
  });
});
