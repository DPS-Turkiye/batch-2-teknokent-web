"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { coordinatorProgramQueryKey } from "@/hooks/use-coordinator-program";
import type {
  MentorLabel,
  MentorLabelBoard,
  MentorLabelBoardLabel,
  MentorLabelColor,
  MentorLabelInput,
} from "@/interfaces/mentor-label";
import { MentorPoolStatus, type MentorPoolRow } from "@/interfaces/mentor-pool";
import { ToastTone } from "@/interfaces/toast";
import {
  createMentorLabel,
  deleteMentorLabel,
  getMentorLabelBoard,
  getMentorLabelDirectory,
  getMentorProgramLabels,
  setMentorLabels,
  updateMentorLabel,
} from "@/lib/client/mentor-labels";
import {
  DEFAULT_MENTOR_LABEL_COLOR,
  MENTOR_LABEL_NAME_MAX_LENGTH,
  MENTOR_LABELS_PER_MENTOR,
} from "@/lib/const/mentor-labels";
import {
  carriedLabels,
  knownLabelIds,
  labelsOfMentor,
  mentorLabelIds,
  mentorLabelNameLength,
  mentorLabelNameProblem,
  normalizeMentorLabelName,
  toggleMentorLabel,
  withAllLabels,
} from "@/lib/mentor-labels";
import { errorMessage } from "@/lib/utils";
import { useToast } from "@/stores/toast-store";

export const MENTOR_LABELS_QUERY_KEY = ["mentor-labels"] as const;

/** Keyed by the switch too, so turning it on in Program Ayarları loads the labels again here. */
export const mentorLabelBoardQueryKey = (programId: string, enabled: boolean) =>
  [...coordinatorProgramQueryKey(programId), "mentor-labels", enabled] as const;

export const MENTOR_LABEL_DIRECTORY_QUERY_KEY = [
  ...MENTOR_LABELS_QUERY_KEY,
  "directory",
] as const;

export const mentorProgramLabelsQueryKey = (mentorId: string) =>
  [...MENTOR_LABELS_QUERY_KEY, "mentor", mentorId] as const;

const EMPTY_BOARD: MentorLabelBoard = {
  enabled: false,
  editable: false,
  labels: [],
  mentors: [],
};

/** Only active pool mentors (Aktif or Dolu) carry labels; invitations and requests to join do not. */
function canCarryLabels(row: MentorPoolRow) {
  return (
    row.mentorId !== null &&
    (row.status === MentorPoolStatus.Active ||
      row.status === MentorPoolStatus.Full)
  );
}

/** Mentor Havuzu's labels: the chips on each row, the "Etiket" filter and which row's editor is open. */
export function useMentorPoolLabels(
  programId: string,
  labelsEnabled: boolean,
  rows: readonly MentorPoolRow[],
) {
  const query = useQuery({
    queryKey: mentorLabelBoardQueryKey(programId, labelsEnabled),
    queryFn: () => getMentorLabelBoard(programId),
    enabled: labelsEnabled,
  });
  const board = labelsEnabled ? (query.data ?? EMPTY_BOARD) : EMPTY_BOARD;
  const [filter, setFilter] = useState<string[]>([]);
  const [editing, setEditing] = useState<MentorPoolRow | null>(null);
  const options = carriedLabels(board.labels, board.mentors);
  // A label nobody carries any more drops out of the selection too, or it would hide every row with no way back.
  const selected = knownLabelIds(filter, options);

  return {
    enabled: board.enabled,
    board,
    error: labelsEnabled ? query.error : null,
    filterOptions: options,
    filter: selected,
    toggleFilter: (labelId: string) =>
      setFilter((current) =>
        toggleMentorLabel(current, labelId, Number.POSITIVE_INFINITY),
      ),
    clearFilter: () => setFilter([]),
    visible: withAllLabels(
      rows,
      (row) => row.mentorId,
      board.mentors,
      selected,
    ),
    labelsOf: (row: MentorPoolRow): MentorLabel[] =>
      row.mentorId
        ? labelsOfMentor(board.labels, board.mentors, row.mentorId)
        : [],
    canEdit: (row: MentorPoolRow) => board.editable && canCarryLabels(row),
    editing,
    openEditor: (row: MentorPoolRow) => setEditing(row),
    closeEditor: () => setEditing(null),
  };
}

type LabelForm = { id: string | null; name: string; color: MentorLabelColor };

const NEW_LABEL: LabelForm = {
  id: null,
  name: "",
  color: DEFAULT_MENTOR_LABEL_COLOR,
};

/**
 * The "Etiket ekle" pop-up for one mentor: pick up to five of the program's labels, create a new one, rename or
 * recolor one, or delete one after a confirmation. Every change answers with the whole board, which replaces the
 * cached one.
 */
export function useMentorLabelEditor({
  programId,
  mentorId,
  board,
  onClose,
}: {
  programId: string;
  mentorId: string;
  board: MentorLabelBoard;
  onClose: () => void;
}) {
  const t = useTranslations("mentorLabels");
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [selected, setSelected] = useState(() =>
    mentorLabelIds(board.mentors, mentorId),
  );
  const [form, setForm] = useState<LabelForm>(NEW_LABEL);
  const [formTouched, setFormTouched] = useState(false);
  const [confirmingDelete, setConfirmingDelete] =
    useState<MentorLabelBoardLabel | null>(null);

  const store = (next: MentorLabelBoard) => {
    queryClient.setQueryData(mentorLabelBoardQueryKey(programId, true), next);
    // Profiles opened from the pool read the same labels through their own query.
    void queryClient.invalidateQueries({ queryKey: MENTOR_LABELS_QUERY_KEY });
  };
  const failed = (fallback: string) => (failure: Error) => {
    showToast({
      message: errorMessage(failure, fallback),
      tone: ToastTone.Error,
    });
  };
  const resetForm = () => {
    setForm(NEW_LABEL);
    setFormTouched(false);
  };

  const save = useMutation({
    mutationFn: (labelIds: string[]) =>
      setMentorLabels(programId, mentorId, labelIds),
    onSuccess: (next) => {
      store(next);
      showToast({ message: t("saved"), tone: ToastTone.Success });
      onClose();
    },
    onError: failed(t("saveFailed")),
  });
  const create = useMutation({
    mutationFn: (input: MentorLabelInput) =>
      createMentorLabel(programId, input),
    onSuccess: (next, input) => {
      store(next);
      const key = input.name.toLowerCase();
      const created = next.labels.find(
        (label) => label.name.toLowerCase() === key,
      );
      if (created) {
        setSelected((current) => toggleMentorLabel(current, created.id));
      }
      resetForm();
      showToast({
        message: t("created", { name: input.name }),
        tone: ToastTone.Success,
      });
    },
    onError: failed(t("saveFailed")),
  });
  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: MentorLabelInput }) =>
      updateMentorLabel(programId, id, input),
    onSuccess: (next) => {
      store(next);
      resetForm();
      showToast({ message: t("updated"), tone: ToastTone.Success });
    },
    onError: failed(t("saveFailed")),
  });
  const remove = useMutation({
    mutationFn: (labelId: string) => deleteMentorLabel(programId, labelId),
    onSuccess: (next, labelId) => {
      store(next);
      setSelected((current) => current.filter((id) => id !== labelId));
      if (form.id === labelId) resetForm();
      setConfirmingDelete(null);
      showToast({ message: t("deleted"), tone: ToastTone.Success });
    },
    onError: failed(t("deleteFailed")),
  });

  const problem = mentorLabelNameProblem(form.name, board.labels, form.id);
  const chosen = knownLabelIds(selected, board.labels);

  return {
    labels: board.labels,
    selected: chosen,
    isSelected: (labelId: string) => chosen.includes(labelId),
    toggle: (labelId: string) => {
      setSelected((current) => toggleMentorLabel(current, labelId));
    },
    limitReached: chosen.length >= MENTOR_LABELS_PER_MENTOR,
    maxLabels: MENTOR_LABELS_PER_MENTOR,
    save: () => {
      save.mutate(chosen);
    },
    saving: save.isPending,

    form,
    editingLabel: form.id !== null,
    nameLength: mentorLabelNameLength(form.name),
    nameMax: MENTOR_LABEL_NAME_MAX_LENGTH,
    setName: (name: string) => {
      setFormTouched(true);
      setForm((current) => ({ ...current, name }));
    },
    setColor: (color: MentorLabelColor) => {
      setForm((current) => ({ ...current, color }));
    },
    problem: formTouched ? problem : null,
    startEdit: (label: MentorLabel) => {
      setFormTouched(false);
      setForm({ id: label.id, name: label.name, color: label.color });
    },
    cancelEdit: resetForm,
    submitForm: () => {
      setFormTouched(true);
      if (problem) return;
      const input = {
        name: normalizeMentorLabelName(form.name),
        color: form.color,
      };
      if (form.id) update.mutate({ id: form.id, input });
      else create.mutate(input);
    },
    submitting: create.isPending || update.isPending,

    confirmingDelete,
    askDelete: (label: MentorLabelBoardLabel) => {
      setConfirmingDelete(label);
    },
    cancelDelete: () => {
      setConfirmingDelete(null);
    },
    confirmDelete: () => {
      if (confirmingDelete) remove.mutate(confirmingDelete.id);
    },
    deleting: remove.isPending,
  };
}

/** The labels on the mentors a mentee can request, from the mentee's own program; nothing for anyone else. */
export function useMentorLabelDirectory() {
  const query = useQuery({
    queryKey: MENTOR_LABEL_DIRECTORY_QUERY_KEY,
    queryFn: getMentorLabelDirectory,
  });
  const labels = useMemo(() => query.data?.labels ?? [], [query.data]);
  const mentors = useMemo(() => query.data?.mentors ?? [], [query.data]);
  return {
    labels,
    mentors,
    labelsOf: (mentorId: string) => labelsOfMentor(labels, mentors, mentorId),
    filterOptions: carriedLabels(labels, mentors),
  };
}

/** The mentee directory's "Etiket" filter: mentors who carry every selected label. */
export function useMentorLabelFilter<T>(
  items: readonly T[],
  mentorIdOf: (item: T) => string,
) {
  const directory = useMentorLabelDirectory();
  const [filter, setFilter] = useState<string[]>([]);
  const selected = knownLabelIds(filter, directory.filterOptions);
  return {
    labelsOf: directory.labelsOf,
    options: directory.filterOptions,
    selected,
    toggle: (labelId: string) => {
      setFilter((current) =>
        toggleMentorLabel(current, labelId, Number.POSITIVE_INFINITY),
      );
    },
    clear: () => {
      setFilter([]);
    },
    visible: withAllLabels(items, mentorIdOf, directory.mentors, selected),
  };
}

/**
 * One mentor's labels per program, as the viewer may see them. The backend leaves out programs whose switch is off
 * and programs where the mentor carries nothing; the picker shows only when two or more programs remain.
 */
export function useMentorProgramLabels(mentorId: string) {
  const query = useQuery({
    queryKey: mentorProgramLabelsQueryKey(mentorId),
    queryFn: () => getMentorProgramLabels(mentorId),
    enabled: Boolean(mentorId),
  });
  const programs = useMemo(() => query.data ?? [], [query.data]);
  const [picked, setPicked] = useState<string | null>(null);
  const current =
    programs.find((program) => program.programId === picked) ?? programs[0];
  return {
    visible: current !== undefined && current.labels.length > 0,
    programs,
    showPicker: programs.length > 1,
    current: current ?? null,
    pick: (programId: string) => {
      setPicked(programId);
    },
  };
}
