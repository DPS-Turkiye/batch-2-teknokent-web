"use client";

import { DangerButton } from "@/components/common/danger-button";
import { fieldClass, labelClass } from "@/components/common/form-field";
import { ModalDialog } from "@/components/common/modal-dialog";
import { PrimaryButton } from "@/components/common/primary-button";
import { SecondaryButton } from "@/components/common/secondary-button";
import type { useFileUploadForm } from "@/hooks/use-file-upload-form";
import type { ShareableMentor } from "@/hooks/use-startup-files";
import type {
  DocumentKind,
  StartupDocument,
} from "@/interfaces/startup-document";
import { DOCUMENT_KIND_LABELS, UPLOADABLE_KINDS } from "@/lib/startup-files";

type UploadForm = ReturnType<typeof useFileUploadForm>;

export function FileUploadDialog({ form }: { form: UploadForm }) {
  if (!form.isOpen) return null;
  return (
    <ModalDialog labelledBy="file-upload-title" onClose={form.close}>
      <h2 id="file-upload-title" className="text-base font-semibold">
        Dosya yükle
      </h2>
      <label className="block">
        <span className={labelClass}>Dosya türü</span>
        <select
          className={fieldClass}
          value={form.kind}
          onChange={(event) => form.setKind(event.target.value as DocumentKind)}
        >
          {UPLOADABLE_KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {DOCUMENT_KIND_LABELS[kind]}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className={labelClass}>Dosya</span>
        <input
          type="file"
          accept=".pdf,.docx,.xlsx"
          className="block w-full text-sm text-[#676e78]"
          onChange={(event) => form.setFile(event.target.files?.[0] ?? null)}
        />
      </label>
      <div className="flex justify-end gap-2">
        <SecondaryButton onClick={form.close}>Vazgeç</SecondaryButton>
        <PrimaryButton onClick={form.submit} disabled={!form.canSubmit}>
          {form.isUploading ? "Yükleniyor…" : "Yükle"}
        </PrimaryButton>
      </div>
    </ModalDialog>
  );
}

export function ShareDocumentDialog({
  document,
  isBusy,
  mentors,
  onClose,
  onShare,
  onStopSharing,
}: {
  document: StartupDocument | null;
  isBusy: boolean;
  mentors: ShareableMentor[];
  onClose: () => void;
  onShare: (mentorId: string) => void;
  onStopSharing: (mentorId: string) => void;
}) {
  if (!document) return null;
  const sharedWith = new Set(document.shares.map((share) => share.mentorId));
  return (
    <ModalDialog labelledBy="file-share-title" onClose={onClose}>
      <div>
        <h2 id="file-share-title" className="text-base font-semibold">
          Mentorla paylaş
        </h2>
        <p className="mt-1 truncate text-xs text-[#858c96]">
          {document.originalFilename}
        </p>
      </div>
      {mentors.length === 0 ? (
        <p className="text-sm text-[#676e78]">
          Dosya paylaşabileceğin bir mentor yok. Kabul edilmiş bir mentorluk
          başlattığında burada görünür.
        </p>
      ) : (
        <ul className="divide-y divide-[#e4e7ea]">
          {mentors.map((mentor) => (
            <li
              key={mentor.id}
              className="flex items-center justify-between gap-3 py-2.5"
            >
              <span className="text-sm text-[#22262b]">{mentor.name}</span>
              {sharedWith.has(mentor.id) ? (
                <SecondaryButton
                  disabled={isBusy}
                  onClick={() => onStopSharing(mentor.id)}
                >
                  Paylaşımı kaldır
                </SecondaryButton>
              ) : (
                <PrimaryButton
                  disabled={isBusy}
                  onClick={() => onShare(mentor.id)}
                >
                  Paylaş
                </PrimaryButton>
              )}
            </li>
          ))}
        </ul>
      )}
      <div className="flex justify-end">
        <SecondaryButton onClick={onClose}>Kapat</SecondaryButton>
      </div>
    </ModalDialog>
  );
}

export function DeleteDocumentDialog({
  document,
  isDeleting,
  onCancel,
  onConfirm,
}: {
  document: StartupDocument | null;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!document) return null;
  return (
    <ModalDialog labelledBy="file-delete-title" onClose={onCancel}>
      <h2 id="file-delete-title" className="text-base font-semibold">
        Dosyayı silmek istiyor musun?
      </h2>
      <p className="text-sm text-[#676e78]">
        {document.originalFilename} kalıcı olarak silinir ve paylaşıldığı
        mentorlar da artık göremez.
      </p>
      <div className="flex justify-end gap-2">
        <SecondaryButton onClick={onCancel}>Vazgeç</SecondaryButton>
        <DangerButton disabled={isDeleting} onClick={onConfirm}>
          {isDeleting ? "Siliniyor…" : "Sil"}
        </DangerButton>
      </div>
    </ModalDialog>
  );
}
