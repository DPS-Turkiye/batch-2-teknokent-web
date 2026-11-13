"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

import {
  PeerDocumentVisibility,
  PeerEvidenceType,
} from "@/interfaces/peer-mentor-documents";
import type { PeerTopicCategory } from "@/interfaces/peer-mentoring";
import { ToastTone } from "@/interfaces/toast";
import {
  addPeerMentorLink,
  deletePeerMentorDocument,
  getOwnPeerMentorDocuments,
  getPeerMentorDocuments,
  peerMentorDocumentContentHref,
  updatePeerMentorDocumentVisibility,
  uploadPeerMentorDocument,
} from "@/lib/client/peer-mentor-documents";
import {
  evidenceCards,
  evidenceFileProblem,
  PEER_EVIDENCE_MAX_BYTES,
  requiredEvidence,
  sharedEvidence,
  uploadTypeOf,
} from "@/lib/peer-mentor-documents";
import { errorMessage, formatFileSize, httpUrlOrNull } from "@/lib/utils";
import { useToast } from "@/stores/toast-store";
import {
  EvidenceCard,
  EvidenceFileProblem,
} from "@/types/peer-mentor-evidence";

export const PEER_MENTOR_DOCUMENTS_QUERY_KEY = [
  "peer-mentoring",
  "documents",
] as const;
const OWN_DOCUMENTS_QUERY_KEY = [
  ...PEER_MENTOR_DOCUMENTS_QUERY_KEY,
  "mine",
] as const;

/**
 * The wizard's "Belgeler ve kanıtlar" step. Files and links are saved as soon as they are added (the profile's
 * publish does not carry them); a card's visibility menu changes every piece on it and what the next upload gets.
 */
export function usePeerMentorDocumentsStep({
  topics,
  linkedinUrl,
}: {
  topics: readonly PeerTopicCategory[];
  linkedinUrl: string;
}) {
  const t = useTranslations("iaIskur.wizard.documents");
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const documents = useQuery({
    queryKey: OWN_DOCUMENTS_QUERY_KEY,
    queryFn: getOwnPeerMentorDocuments,
  });
  const [chosen, setChosen] = useState<
    Partial<Record<EvidenceCard, PeerDocumentVisibility>>
  >({});
  const [otherType, setOtherType] = useState(PeerEvidenceType.ReferenceLetter);
  const [linkDraft, setLinkDraft] = useState("");
  const [problem, setProblem] = useState<{
    card: EvidenceCard;
    message: string;
  } | null>(null);

  const cards = evidenceCards(
    documents.data ?? [],
    topics,
    chosen,
    httpUrlOrNull(linkedinUrl) != null,
  );
  const visibilityOf = (card: EvidenceCard) =>
    cards.find((view) => view.card === card)?.visibility ??
    PeerDocumentVisibility.VerificationOnly;
  // The prefix also covers the profile's copy, so a mentor who looks at their own profile sees the change.
  const refresh = () =>
    queryClient.invalidateQueries({
      queryKey: PEER_MENTOR_DOCUMENTS_QUERY_KEY,
    });
  const toastError = (fallback: string) => (error: unknown) => {
    showToast({
      message: errorMessage(error, fallback),
      tone: ToastTone.Error,
    });
  };

  const upload = useMutation({
    mutationFn: (input: {
      card: EvidenceCard;
      file: File;
      type: PeerEvidenceType;
      visibility: PeerDocumentVisibility;
    }) => uploadPeerMentorDocument(input.file, input.type, input.visibility),
    onSuccess: () => refresh(),
    onError: (error, { card }) =>
      setProblem({ card, message: errorMessage(error, t("uploadFailed")) }),
  });

  const link = useMutation({
    mutationFn: (input: { url: string; visibility: PeerDocumentVisibility }) =>
      addPeerMentorLink(input),
    onSuccess: () => {
      setLinkDraft("");
      return refresh();
    },
    onError: (error) =>
      setProblem({
        card: EvidenceCard.Portfolio,
        message: errorMessage(error, t("linkFailed")),
      }),
  });

  const visibility = useMutation({
    mutationFn: async ({
      card,
      value,
    }: {
      card: EvidenceCard;
      value: PeerDocumentVisibility;
    }) => {
      const view = cards.find((item) => item.card === card);
      await Promise.all(
        (view?.documents ?? [])
          .filter((document) => document.visibility !== value)
          .map((document) =>
            updatePeerMentorDocumentVisibility(document.id, value),
          ),
      );
    },
    onSettled: () => refresh(),
    onError: toastError(t("visibilityFailed")),
  });

  const remove = useMutation({
    mutationFn: (documentId: string) => deletePeerMentorDocument(documentId),
    onSuccess: () => refresh(),
    onError: toastError(t("removeFailed")),
  });

  return {
    cards,
    required: requiredEvidence(cards),
    isLoading: documents.isLoading,
    loadError: documents.error,
    otherType,
    linkDraft,
    problemOf: (card: EvidenceCard) =>
      problem?.card === card ? problem.message : null,
    uploadingCard: upload.isPending ? upload.variables.card : null,
    isUploading: upload.isPending,
    isAddingLink: link.isPending,
    isChangingVisibility: visibility.isPending,
    contentHref: peerMentorDocumentContentHref,
    /** A saved link as an href, only when it is a web address. */
    linkHref: (url: string | null) => httpUrlOrNull(url),
    pickOtherType: setOtherType,
    setLinkDraft: (value: string) => {
      setProblem(null);
      setLinkDraft(value);
    },
    /** One upload at a time: a drop or a second pick while one is on its way is ignored. */
    pickFile: (card: EvidenceCard, file: File | undefined) => {
      if (!file || upload.isPending) return;
      const reason = evidenceFileProblem(file);
      if (reason) {
        setProblem({
          card,
          message:
            reason === EvidenceFileProblem.NotPdf
              ? t("notPdf")
              : t("tooLarge", { max: formatFileSize(PEER_EVIDENCE_MAX_BYTES) }),
        });
        return;
      }
      setProblem(null);
      // Type and visibility as the card shows them now, not when the request settles.
      upload.mutate({
        card,
        file,
        type: uploadTypeOf(card, otherType),
        visibility: visibilityOf(card),
      });
    },
    addLink: () => {
      if (link.isPending) return;
      const url = httpUrlOrNull(linkDraft);
      if (!url) {
        setProblem({ card: EvidenceCard.Portfolio, message: t("linkInvalid") });
        return;
      }
      setProblem(null);
      link.mutate({ url, visibility: visibilityOf(EvidenceCard.Portfolio) });
    },
    setVisibility: (card: EvidenceCard, value: PeerDocumentVisibility) => {
      setChosen((current) => ({ ...current, [card]: value }));
      visibility.mutate({ card, value });
    },
    remove: (documentId: string) => remove.mutate(documentId),
  };
}

export type PeerMentorDocumentsStep = ReturnType<
  typeof usePeerMentorDocumentsStep
>;

/** A peer mentor's evidence on their profile, as far as the viewer may see it. */
export function usePeerMentorSharedDocuments(mentorId: string) {
  const tType = useTranslations("iaIskur.wizard.documents.types");
  const documents = useQuery({
    queryKey: [...PEER_MENTOR_DOCUMENTS_QUERY_KEY, "mentor", mentorId],
    queryFn: () => getPeerMentorDocuments(mentorId),
  });
  const { files, links } = sharedEvidence(documents.data ?? []);
  return {
    files: files.map((file) => ({
      id: file.id,
      name: file.originalFilename || tType(file.evidenceType),
      evidenceType: file.evidenceType,
      href: peerMentorDocumentContentHref(file.id),
    })),
    links,
  };
}
