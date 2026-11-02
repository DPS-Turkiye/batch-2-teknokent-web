"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { useAppSession } from "@/components/providers/session-provider";
import { useToast } from "@/components/providers/toast-provider";
import { coordinatorProgramQueryKey } from "@/hooks/use-coordinator-program";
import { COORDINATOR_PROGRAMS_QUERY_KEY } from "@/hooks/use-coordinator-programs";
import { DocumentKind } from "@/interfaces/startup-document";
import {
  createCoordinatorProgram,
  extractSyllabusPhases,
} from "@/lib/client/coordinator-programs";
import { uploadDocument } from "@/lib/client/documents";
import {
  MAX_PHASES,
  RULE_LIMITS,
  stepDays,
} from "@/lib/coordinator-program-detail";
import {
  basicsError,
  createProgramInput,
  emptyLaunchDraft,
  emptyTeamRow,
  filledTeamRows,
  LAUNCH_STEPS,
  type LaunchDraft,
  type LaunchRules,
  LaunchStep,
  MAX_LAUNCH_TEAMS,
  parseTeamsCsv,
  type TeamRowDraft,
  teamRowProblems,
} from "@/lib/program-launch";
import {
  blankWizardPhase,
  curriculumError,
  PhaseSource,
  proposedPhases,
  reorderPhases,
  SYLLABUS_MAX_BYTES,
  type WizardPhase,
} from "@/lib/program-phases";
import { errorMessage } from "@/lib/utils";

/** The four-step "Yeni program" wizard; the program, its phases and team codes are created in one request at the end. */
export function useProgramLaunch() {
  const t = useTranslations("programLaunch");
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const session = useAppSession();
  const [step, setStep] = useState(LaunchStep.Basics);
  const [draft, setDraft] = useState<LaunchDraft>(emptyLaunchDraft);
  const [error, setError] = useState<string | null>(null);
  const [openPhase, setOpenPhase] = useState<string | null>(null);

  const problems = teamRowProblems(draft.teams);
  const stepIndex = LAUNCH_STEPS.indexOf(step);

  const create = useMutation({
    mutationFn: () => createCoordinatorProgram(createProgramInput(draft)),
    onSuccess: (detail) => {
      queryClient.setQueryData(
        coordinatorProgramQueryKey(detail.program.id),
        detail,
      );
      void queryClient.invalidateQueries({
        queryKey: COORDINATOR_PROGRAMS_QUERY_KEY,
      });
      const teams = filledTeamRows(draft.teams).length;
      showToast({
        message:
          teams > 0
            ? t("createdWithTeams", {
                name: detail.program.name,
                count: teams,
              })
            : t("created", { name: detail.program.name }),
        tone: "success",
      });
      router.push(
        `/coordinator/programs/${encodeURIComponent(detail.program.id)}`,
      );
    },
    onError: (failure) => setError(errorMessage(failure, t("createFailed"))),
  });

  const extract = useMutation({
    mutationFn: (documentId: string) =>
      extractSyllabusPhases({
        documentId,
        startDate: draft.startDate || null,
        endDate: draft.endDate || null,
      }),
    onSuccess: (result, documentId) => {
      setOpenPhase(null);
      setDraft((current) =>
        current.syllabus?.documentId === documentId
          ? {
              ...current,
              phases: proposedPhases(result.phases),
              syllabus: { ...current.syllabus, pageCount: result.pageCount },
            }
          : current,
      );
    },
  });

  const upload = useMutation({
    mutationFn: (file: File) => uploadDocument(file, DocumentKind.Syllabus),
    onSuccess: (stored, file) => {
      update({
        phaseSource: PhaseSource.File,
        syllabus: {
          documentId: stored.id,
          filename: file.name,
          sizeBytes: file.size,
          pageCount: null,
        },
        phases: [],
      });
      if (step === LaunchStep.Curriculum) extract.mutate(stored.id);
    },
    onError: (failure) => setError(errorMessage(failure, t("uploadFailed"))),
  });

  const update = (patch: Partial<LaunchDraft>) => {
    setError(null);
    setDraft((current) => ({ ...current, ...patch }));
  };
  const setTeams = (teams: TeamRowDraft[]) =>
    update({ teams: teams.slice(0, MAX_LAUNCH_TEAMS) });
  const setPhases = (phases: WizardPhase[]) =>
    update({ phases: phases.slice(0, MAX_PHASES) });

  /** Step 2 reads the syllabus on arrival, once per file. */
  const enterCurriculum = () => {
    setStep(LaunchStep.Curriculum);
    const syllabus = draft.syllabus;
    if (
      draft.phaseSource === PhaseSource.File &&
      syllabus &&
      syllabus.pageCount === null &&
      !extract.isPending
    ) {
      extract.mutate(syllabus.documentId);
    }
  };

  const goNext = () => {
    const next = LAUNCH_STEPS[stepIndex + 1];
    if (next === LaunchStep.Curriculum) enterCurriculum();
    else if (next) setStep(next);
  };

  const stepError = () => {
    if (step === LaunchStep.Basics) return basicsError(draft);
    if (step === LaunchStep.Curriculum) {
      if (upload.isPending || extract.isPending) return t("waitForSyllabus");
      return curriculumError(draft.phases);
    }
    return null;
  };

  return {
    ownerName: session?.fullName ?? t("youFallback"),
    step,
    stepIndex,
    draft,
    update,
    stepRule: (rule: keyof LaunchRules, delta: number) =>
      update({
        rules: {
          ...draft.rules,
          [rule]: stepDays(draft.rules[rule], delta, RULE_LIMITS[rule]),
        },
      }),

    uploading: upload.isPending,
    chooseSyllabus: (file: File) => {
      const pdf =
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf");
      if (!pdf) return setError(t("pdfOnly"));
      if (file.size > SYLLABUS_MAX_BYTES) return setError(t("tooLarge"));
      setError(null);
      upload.mutate(file);
    },
    extracting: extract.isPending,
    extractFailed: extract.isError,
    retryExtract: () => {
      if (draft.syllabus) extract.mutate(draft.syllabus.documentId);
    },
    setPhaseSource: (phaseSource: PhaseSource) => {
      update({ phaseSource });
      if (phaseSource === PhaseSource.File) enterCurriculum();
    },
    /** "Manuel gir" on step 1 skips the upload and goes straight to the phases. */
    enterManually: () => {
      const problem = basicsError(draft);
      setError(problem);
      if (problem) return;
      setDraft((current) => ({
        ...current,
        phaseSource: PhaseSource.Manual,
        phases: current.phases.length ? current.phases : [blankWizardPhase()],
      }));
      setStep(LaunchStep.Curriculum);
    },
    openPhase,
    togglePhase: (key: string) =>
      setOpenPhase((current) => (current === key ? null : key)),
    updatePhase: (key: string, patch: Partial<WizardPhase>) =>
      setPhases(
        draft.phases.map((phase) =>
          phase.key === key ? { ...phase, ...patch } : phase,
        ),
      ),
    addPhase: () => {
      const phase = blankWizardPhase();
      setPhases([...draft.phases, phase]);
      setOpenPhase(phase.key);
    },
    removePhase: (key: string) =>
      setPhases(draft.phases.filter((phase) => phase.key !== key)),
    movePhase: (from: number, to: number) =>
      setPhases(reorderPhases(draft.phases, from, to)),
    canAddPhase: draft.phases.length < MAX_PHASES,

    updateTeam: (key: string, patch: Partial<TeamRowDraft>) =>
      setTeams(
        draft.teams.map((row) =>
          row.key === key ? { ...row, ...patch } : row,
        ),
      ),
    addTeam: () => setTeams([...draft.teams, emptyTeamRow()]),
    removeTeam: (key: string) => {
      const rest = draft.teams.filter((row) => row.key !== key);
      setTeams(rest.length > 0 ? rest : [emptyTeamRow()]);
    },
    importCsv: async (file: File) => {
      const rows = parseTeamsCsv(await file.text());
      if (rows.length === 0) {
        setError(t("csvEmpty"));
        return;
      }
      setTeams([...filledTeamRows(draft.teams), ...rows]);
    },
    problems,
    teamCount: filledTeamRows(draft.teams).length,
    error,
    creating: create.isPending,
    back: () => {
      setError(null);
      if (stepIndex > 0) setStep(LAUNCH_STEPS[stepIndex - 1]);
    },
    next: () => {
      const problem = stepError();
      setError(problem);
      if (!problem) goNext();
    },
    submit: () => {
      const problem =
        basicsError(draft) ??
        curriculumError(draft.phases) ??
        (problems.size > 0 ? t("rowErrors", { count: problems.size }) : null);
      setError(problem);
      if (!problem) create.mutate();
    },
  };
}
