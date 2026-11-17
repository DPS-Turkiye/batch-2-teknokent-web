"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { useOpenDocument } from "@/hooks/use-startup-documents";
import { ToastTone } from "@/interfaces/toast";
import {
  createProgramAssignment,
  getProgramAssignments,
} from "@/lib/client/program-assignments";
import { isoDay } from "@/lib/coordinator-calendar";
import {
  assignmentDraftProblem,
  assignmentInput,
  EMPTY_ASSIGNMENT_DRAFT,
  MAX_ASSIGNMENT_DESCRIPTION,
  MAX_ASSIGNMENT_TITLE,
  phaseNameOf,
  type ProgramAssignmentDraft,
} from "@/lib/program-assignments";
import { errorMessage } from "@/lib/utils";
import { useToast } from "@/stores/toast-store";

export const PROGRAM_ASSIGNMENTS_QUERY_KEY = ["program-assignments"] as const;

const LIMITS: Partial<Record<keyof ProgramAssignmentDraft, number>> = {
  title: MAX_ASSIGNMENT_TITLE,
  description: MAX_ASSIGNMENT_DESCRIPTION,
};

/**
 * Program › Ödevler: the "Ödev ver" form, which gives one Ödev to every team of the program, and the list of
 * Ödevler with who handed each in.
 */
export function useProgramAssignments(programId: string) {
  const t = useTranslations("programAssignments");
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const openDocument = useOpenDocument();
  const [formOpen, setFormOpen] = useState(false);
  const [draft, setDraft] = useState<ProgramAssignmentDraft>(
    EMPTY_ASSIGNMENT_DRAFT,
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const queryKey = [...PROGRAM_ASSIGNMENTS_QUERY_KEY, programId];
  const query = useQuery({
    queryKey,
    queryFn: () => getProgramAssignments(programId),
  });

  const create = useMutation({
    mutationFn: (input: ProgramAssignmentDraft) =>
      createProgramAssignment(programId, assignmentInput(input)),
    onSuccess: (created) => {
      setDraft(EMPTY_ASSIGNMENT_DRAFT);
      setFormOpen(false);
      setExpandedId(created.id);
      void queryClient.invalidateQueries({ queryKey });
      showToast({
        message: t("created", { count: created.teams.length }),
        tone: ToastTone.Success,
      });
    },
    onError: (error) =>
      showToast({
        message: errorMessage(error, t("createFailed")),
        tone: ToastTone.Error,
      }),
  });

  const today = isoDay(new Date());
  const problem = assignmentDraftProblem(draft, today);

  return {
    assignments: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    today,
    formOpen,
    openForm: () => setFormOpen(true),
    closeForm: () => {
      setFormOpen(false);
      setDraft(EMPTY_ASSIGNMENT_DRAFT);
    },
    draft,
    setField: <K extends keyof ProgramAssignmentDraft>(
      field: K,
      value: ProgramAssignmentDraft[K],
    ) => {
      const limit = LIMITS[field];
      setDraft((current) => ({
        ...current,
        [field]:
          limit !== undefined && typeof value === "string"
            ? value.slice(0, limit)
            : value,
      }));
    },
    // A blank title is only reported once someone typed; the button stays off either way.
    problem: draft.title ? problem : null,
    canSubmit: problem === null && !create.isPending,
    submit: () => {
      if (problem === null && !create.isPending) create.mutate(draft);
    },
    submitting: create.isPending,
    expandedId,
    toggle: (assignmentId: string) =>
      setExpandedId((current) =>
        current === assignmentId ? null : assignmentId,
      ),
    openSubmission: (documentId: string) => void openDocument(documentId),
    phaseName: phaseNameOf,
  };
}

export type ProgramAssignments = ReturnType<typeof useProgramAssignments>;
