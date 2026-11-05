"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRef, useState, type FormEvent } from "react";

import { useToast } from "@/components/providers/toast-provider";
import { ACTION_ITEMS_QUERY_KEY } from "@/hooks/use-action-items";
import {
  assignMentorshipTask,
  getTaskAssignees,
} from "@/lib/client/mentor-task-assignment";
import { assignMentorshipTaskSchema } from "@/lib/mentor-task-assignment";

export function useMentorTaskAssignment(requestId: string) {
  const t = useTranslations("mentorHome.assignTask");
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [isOpen, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState("");
  const submitting = useRef(false);
  const assignees = useQuery({
    queryKey: ["mentor-task-assignees", requestId],
    queryFn: () => getTaskAssignees(requestId),
    enabled: isOpen,
  });
  const mutation = useMutation({
    mutationFn: (input: Parameters<typeof assignMentorshipTask>[1]) =>
      assignMentorshipTask(requestId, input),
  });
  const ownerAvailable = (assignees.data ?? []).some(
    (member) => member.id === ownerId,
  );
  const canSubmit =
    Boolean(title.trim()) &&
    ownerAvailable &&
    !assignees.isError &&
    !mutation.isPending;

  function open() {
    setTitle("");
    setOwnerId("");
    setDescription("");
    setDueDate("");
    setError("");
    mutation.reset();
    setOpen(true);
  }

  function close() {
    if (!submitting.current) setOpen(false);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const parsed = assignMentorshipTaskSchema.safeParse({
      title,
      ownerId,
      description: description.trim() || undefined,
      dueDate: dueDate || undefined,
    });
    if (!parsed.success || !ownerAvailable || assignees.isError) {
      setError(t("validation"));
      return;
    }
    submitting.current = true;
    setError("");
    try {
      await mutation.mutateAsync(parsed.data);
      await queryClient.invalidateQueries({ queryKey: ACTION_ITEMS_QUERY_KEY });
      setOpen(false);
      showToast({ message: t("saved"), tone: "success" });
    } catch {
      setError(t("saveFailed"));
    } finally {
      submitting.current = false;
    }
  }

  return {
    isOpen,
    open,
    close,
    title,
    setTitle,
    ownerId,
    setOwnerId,
    description,
    setDescription,
    dueDate,
    setDueDate,
    assignees: assignees.data ?? [],
    isLoading: assignees.isLoading,
    isLoadError: assignees.isError,
    retry: () => assignees.refetch(),
    isSaving: mutation.isPending,
    canSubmit,
    error,
    submit,
  };
}
