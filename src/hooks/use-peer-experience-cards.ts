"use client";

import { useState } from "react";

import type { PeerExperienceCard } from "@/interfaces/peer-mentoring";
import {
  EMPTY_EXPERIENCE_FORM,
  experienceCardProblem,
  PEER_EXPERIENCE_CARDS_MAX,
  toExperienceCard,
  toExperienceForm,
} from "@/lib/peer-mentoring";
import type {
  ExperienceCardForm,
  ExperienceCardProblem,
} from "@/types/iskur-student";

/** The card the form is filling in: a new one (no index) or the one at an index. */
type Editing = { index: number | null; form: ExperienceCardForm };

/**
 * The wizard's experience cards (Figma 110:330): the saved list, and one card at a time in the "Yeni deneyim" form.
 * The list lives in the wizard's draft; this hook only owns the open form.
 */
export function usePeerExperienceCards(
  cards: readonly PeerExperienceCard[],
  onChange: (next: PeerExperienceCard[]) => void,
) {
  const [editing, setEditing] = useState<Editing | null>(null);
  const [problem, setProblem] = useState<ExperienceCardProblem | null>(null);

  const open = (next: Editing) => {
    setProblem(null);
    setEditing(next);
  };

  return {
    cards,
    form: editing?.form ?? null,
    /** Null while adding a new card. */
    editingIndex: editing?.index ?? null,
    problem,
    canAdd: editing === null && cards.length < PEER_EXPERIENCE_CARDS_MAX,
    startNew: () => open({ index: null, form: EMPTY_EXPERIENCE_FORM }),
    edit: (index: number) => {
      const card = cards[index];
      if (card) open({ index, form: toExperienceForm(card) });
    },
    remove: (index: number) => {
      onChange(cards.filter((_, position) => position !== index));
      if (editing?.index == null) return;
      if (editing.index === index) setEditing(null);
      else if (editing.index > index) {
        setEditing({ ...editing, index: editing.index - 1 });
      }
    },
    setField: (field: keyof ExperienceCardForm, value: string) => {
      setProblem(null);
      setEditing((current) =>
        current
          ? { ...current, form: { ...current.form, [field]: value } }
          : current,
      );
    },
    save: () => {
      if (!editing) return;
      const found = experienceCardProblem(editing.form);
      if (found) {
        setProblem(found);
        return;
      }
      const card = toExperienceCard(editing.form);
      const { index } = editing;
      onChange(
        index === null
          ? [...cards, card]
          : cards.map((current, position) =>
              // The form has no kind field, so an edited card keeps its own.
              position === index ? { ...card, kind: current.kind } : current,
            ),
      );
      setEditing(null);
    },
    cancel: () => {
      setProblem(null);
      setEditing(null);
    },
  };
}
