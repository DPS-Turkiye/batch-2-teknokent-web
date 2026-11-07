"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { useToast } from "@/components/providers/toast-provider";
import { useIndividualProgram } from "@/hooks/use-individual-program";
import { useMentorshipRequests } from "@/hooks/use-mentorship-requests";
import { useOrganizationMembers } from "@/hooks/use-organization-members";
import {
  STARTUP_DOCUMENTS_QUERY_KEY,
  useStartupDocuments,
} from "@/hooks/use-startup-documents";
import { useStartupHeader } from "@/hooks/use-startup-header";
import type { DocumentRequestItem } from "@/interfaces/document-request";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import { UserRole } from "@/interfaces/session";
import { DocumentKind } from "@/interfaces/startup-document";
import { attachDocumentRequestUpload } from "@/lib/client/document-requests";
import { uploadDocument } from "@/lib/client/documents";
import {
  deleteDocument,
  getStartupDocumentRequests,
  shareDocument,
  unshareDocument,
} from "@/lib/client/startup-documents";
import {
  buildStartupFileRows,
  countRowsByFilter,
  pendingRequestNotice,
  rowsForFilter,
  StartupFileFilter,
} from "@/lib/startup-files";
import { errorMessage } from "@/lib/utils";

export const STARTUP_DOCUMENT_REQUESTS_QUERY_KEY = [
  "startup-document-requests",
] as const;

export type ShareableMentor = { id: string; name: string };

/** The Dosyalar tab: the file table, its filters, sharing and deleting. */
export function useStartupFiles() {
  const t = useTranslations("startupFiles");
  const locale = useLocale();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const documentsQuery = useStartupDocuments();
  const documentRequestsQuery = useQuery({
    queryKey: STARTUP_DOCUMENT_REQUESTS_QUERY_KEY,
    queryFn: getStartupDocumentRequests,
  });
  const membersQuery = useOrganizationMembers();
  const mentorshipRequestsQuery = useMentorshipRequests(UserRole.Mentee);
  const { programName } = useStartupHeader();
  const { individual } = useIndividualProgram();
  const [filter, setFilter] = useState(StartupFileFilter.All);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const documents = useMemo(
    () => documentsQuery.data ?? [],
    [documentsQuery.data],
  );
  const documentRequests = useMemo(
    () => documentRequestsQuery.data ?? [],
    [documentRequestsQuery.data],
  );
  const allRows = useMemo(
    () =>
      buildStartupFileRows({
        documents,
        requests: documentRequests,
        teamMemberIds: new Set(
          (membersQuery.data ?? []).map((member) => member.id),
        ),
        programName,
        texts: { t, locale },
        student: individual,
      }),
    [
      documents,
      documentRequests,
      membersQuery.data,
      programName,
      t,
      locale,
      individual,
    ],
  );
  const rows = useMemo(() => rowsForFilter(allRows, filter), [allRows, filter]);
  const counts = useMemo(() => countRowsByFilter(allRows), [allRows]);
  const pendingNotice = useMemo(
    () => pendingRequestNotice(documentRequests, { t, locale }),
    [documentRequests, t, locale],
  );
  // Only mentors the startup is working with can be sent a file.
  const mentors = useMemo(() => {
    const accepted = new Map<string, string>();
    for (const request of mentorshipRequestsQuery.data ?? []) {
      if (request.status === MentorshipRequestStatus.Accepted) {
        accepted.set(request.mentorId, request.mentorName);
      }
    }
    return [...accepted.entries()].map(([id, name]): ShareableMentor => ({
      id,
      name,
    }));
  }, [mentorshipRequestsQuery.data]);

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: STARTUP_DOCUMENTS_QUERY_KEY });

  const share = useMutation({
    mutationFn: ({
      documentId,
      mentorId,
    }: {
      documentId: string;
      mentorId: string;
    }) => shareDocument(documentId, mentorId),
    onSuccess: () => {
      void refresh();
      showToast({ message: t("toasts.shared"), tone: "success" });
    },
    onError: (error) =>
      showToast({
        message: errorMessage(error, t("toasts.shareFailed")),
        tone: "error",
      }),
  });

  const unshare = useMutation({
    mutationFn: ({
      documentId,
      mentorId,
    }: {
      documentId: string;
      mentorId: string;
    }) => unshareDocument(documentId, mentorId),
    onSuccess: () => {
      void refresh();
      showToast({ message: t("toasts.unshared"), tone: "success" });
    },
    onError: (error) =>
      showToast({
        message: errorMessage(error, t("toasts.unshareFailed")),
        tone: "error",
      }),
  });

  const answerRequest = useMutation({
    mutationFn: async ({
      item,
      file,
    }: {
      item: DocumentRequestItem;
      file: File;
    }) => {
      const stored = await uploadDocument(
        file,
        DocumentKind.RequestedDoc,
        undefined,
        item.meetingId ?? undefined,
      );
      return attachDocumentRequestUpload(item.id, stored.id);
    },
    onSuccess: () => {
      void refresh();
      void queryClient.invalidateQueries({
        queryKey: STARTUP_DOCUMENT_REQUESTS_QUERY_KEY,
      });
      showToast({ message: t("toasts.uploaded"), tone: "success" });
    },
    onError: (error) =>
      showToast({
        message: errorMessage(error, t("toasts.uploadFailed")),
        tone: "error",
      }),
  });

  const remove = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      setDeletingId(null);
      void refresh();
      showToast({ message: t("toasts.deleted"), tone: "success" });
    },
    onError: (error) =>
      showToast({
        message: errorMessage(error, t("toasts.deleteFailed")),
        tone: "error",
      }),
  });

  const filterLabel = (filter: StartupFileFilter) =>
    individual && filter === StartupFileFilter.Startup
      ? t("filters.studentProject")
      : t(`filters.${filter}`);

  return {
    askDelete: setDeletingId,
    filterLabel,
    cancelDelete: () => setDeletingId(null),
    closeShare: () => setSharingId(null),
    confirmDelete: () => {
      if (deletingId) remove.mutate(deletingId);
    },
    counts,
    deletingDocument:
      documents.find((document) => document.id === deletingId) ?? null,
    // Without the team, the startup's own files would read as a mentor's.
    error:
      documentsQuery.error ?? documentRequestsQuery.error ?? membersQuery.error,
    filter,
    isDeleting: remove.isPending,
    isLoading:
      documentsQuery.isLoading ||
      documentRequestsQuery.isLoading ||
      membersQuery.isLoading,
    isSharing: share.isPending || unshare.isPending,
    mentors,
    openShare: setSharingId,
    pendingNotice,
    rows,
    setFilter,
    shareWith: (mentorId: string) => {
      if (sharingId) share.mutate({ documentId: sharingId, mentorId });
    },
    sharingDocument:
      documents.find((document) => document.id === sharingId) ?? null,
    stopSharing: (mentorId: string) => {
      if (sharingId) unshare.mutate({ documentId: sharingId, mentorId });
    },
    uploadForRequest: (item: DocumentRequestItem, file: File) =>
      answerRequest.mutate({ item, file }),
    uploadingRequestId: answerRequest.isPending
      ? answerRequest.variables?.item.id
      : undefined,
  };
}
