"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { useToast } from "@/components/providers/toast-provider";
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
      }),
    [documents, documentRequests, membersQuery.data, programName],
  );
  const rows = useMemo(() => rowsForFilter(allRows, filter), [allRows, filter]);
  const counts = useMemo(() => countRowsByFilter(allRows), [allRows]);
  const pendingNotice = useMemo(
    () => pendingRequestNotice(documentRequests),
    [documentRequests],
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
      showToast({ message: "Dosya mentorla paylaşıldı.", tone: "success" });
    },
    onError: (error) =>
      showToast({
        message: errorMessage(error, "Dosya paylaşılamadı."),
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
      showToast({ message: "Paylaşım kaldırıldı.", tone: "success" });
    },
    onError: (error) =>
      showToast({
        message: errorMessage(error, "Paylaşım kaldırılamadı."),
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
      showToast({ message: "Dosya yüklendi.", tone: "success" });
    },
    onError: (error) =>
      showToast({
        message: errorMessage(error, "Dosya yüklenemedi."),
        tone: "error",
      }),
  });

  const remove = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      setDeletingId(null);
      void refresh();
      showToast({ message: "Dosya silindi.", tone: "success" });
    },
    onError: (error) =>
      showToast({
        message: errorMessage(error, "Dosya silinemedi."),
        tone: "error",
      }),
  });

  return {
    askDelete: setDeletingId,
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
