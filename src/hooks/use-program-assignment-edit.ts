"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { PROGRAM_ASSIGNMENTS_QUERY_KEY } from "@/hooks/use-program-assignments";
import type { ProgramAssignment } from "@/interfaces/program-assignment";
import { ToastTone } from "@/interfaces/toast";
import { updateProgramAssignment } from "@/lib/client/program-assignments";
import { isoDay } from "@/lib/coordinator-calendar";
import {
  assignmentDraftProblem,
  editDraftOf,
  editDraftUnchanged,
  editInput,
  MAX_ASSIGNMENT_DESCRIPTION,
  MAX_ASSIGNMENT_TITLE,
  type ProgramAssignmentEditDraft,
} from "@/lib/program-assignments";
import { errorMessage } from "@/lib/utils";
import { useToast } from "@/stores/toast-store";

const LIMITS: Partial<Record<keyof ProgramAssignmentEditDraft, number>> = {
  title: MAX_ASSIGNMENT_TITLE,
  description: MAX_ASSIGNMENT_DESCRIPTION,
};

type Editing = {
  assignment: ProgramAssignment;
  draft: ProgramAssignmentEditDraft;
};

/** Program › Ödevler › "Düzenle": a program Ödev's title, description and due date, for every team's copy. */
export function useProgramAssignmentEdit(programId: string) {
  const t = useTranslations("programAssignments");
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [editing, setEditing] = useState<Editing | null>(null);

  const save = useMutation({
    mutationFn: ({ assignment, draft }: Editing) =>
      updateProgramAssignment(programId, assignment.id, editInput(draft)),
    onSuccess: () => {
      setEditing(null);
      void queryClient.invalidateQueries({
        queryKey: [...PROGRAM_ASSIGNMENTS_QUERY_KEY, programId],
      });
      showToast({ message: t("saved"), tone: ToastTone.Success });
    },
    onError: (error) =>
      showToast({
        message: errorMessage(error, t("saveFailed")),
        tone: ToastTone.Error,
      }),
  });

  const today = isoDay(new Date());
  const problem = editing
    ? assignmentDraftProblem(editing.draft, today, editing.assignment.dueDate)
    : null;
  const unchanged = editing
    ? editDraftUnchanged(editing.draft, editing.assignment)
    : true;
  // The picker may go back to the date already set, but no further.
  const minDueDate =
    editing?.assignment.dueDate && editing.assignment.dueDate < today
      ? editing.assignment.dueDate
      : today;

  return {
    editing: editing?.assignment ?? null,
    draft: editing?.draft ?? null,
    minDueDate,
    start: (assignment: ProgramAssignment) =>
      setEditing({ assignment, draft: editDraftOf(assignment) }),
    cancel: () => {
      if (!save.isPending) setEditing(null);
    },
    setField: (field: keyof ProgramAssignmentEditDraft, value: string) => {
      const limit = LIMITS[field];
      setEditing((current) =>
        current
          ? {
              ...current,
              draft: {
                ...current.draft,
                [field]: limit === undefined ? value : value.slice(0, limit),
              },
            }
          : current,
      );
    },
    problem,
    canSave:
      editing !== null && problem === null && !unchanged && !save.isPending,
    save: () => {
      if (editing && problem === null && !unchanged && !save.isPending) {
        save.mutate(editing);
      }
    },
    saving: save.isPending,
  };
}

export type ProgramAssignmentEdit = ReturnType<typeof useProgramAssignmentEdit>;
