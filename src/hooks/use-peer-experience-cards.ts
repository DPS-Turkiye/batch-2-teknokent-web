"use client";

import { useState } from "react";

import type { PeerExperienceCard } from "@/interfaces/peer-mentoring";
import { withKey, type Keyed } from "@/lib/keyed-list";
import {
  EMPTY_EXPERIENCE_FORM,
  experienceCardProblem,
  experienceProblemField,
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
 * The wizard's experience cards (Figma 110:330): the saved list, and one card at a time in the "Yeni deneyim" form,
 * so typed text is never replaced without a word. The list lives in the wizard's draft; this hook owns the form.
 */
export function usePeerExperienceCards(
  cards: readonly Keyed<PeerExperienceCard>[],
  onChange: (next: Keyed<PeerExperienceCard>[]) => void,
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
    /** The field the problem is about, for aria-invalid. */
    invalidField:
      problem && editing ? experienceProblemField(problem, editing.form) : null,
    canAdd: editing === null && cards.length < PEER_EXPERIENCE_CARDS_MAX,
    startNew: () => open({ index: null, form: EMPTY_EXPERIENCE_FORM }),
    /** One card at a time: while a form is open, the list's own buttons wait. */
    edit: (index: number) => {
      const card = cards[index];
      if (card && editing === null)
        open({ index, form: toExperienceForm(card) });
    },
    remove: (index: number) => {
      if (editing === null) {
        onChange(cards.filter((_, position) => position !== index));
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
          ? [...cards, withKey(card)]
          : cards.map((current, position) =>
              // The form has no kind field, so an edited card keeps its own kind, and its key.
              position === index
                ? { ...card, kind: current.kind, key: current.key }
                : current,
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
