"use client";

import { useTranslations } from "next-intl";

import { DangerButton } from "@/components/common/danger-button";
import { fieldClass, labelClass } from "@/components/common/form-field";
import { ModalDialog } from "@/components/common/modal-dialog";
import { PrimaryButton } from "@/components/common/primary-button";
import { SecondaryButton } from "@/components/common/secondary-button";
import type { useFileUploadForm } from "@/hooks/use-file-upload-form";
import type { ShareableMentor } from "@/hooks/use-startup-files";
import {
  DocumentKind,
  type StartupDocument,
} from "@/interfaces/startup-document";
import { DOCUMENT_UPLOAD_ACCEPT } from "@/lib/const";
import { isEnumValue } from "@/lib/enum";
import { UPLOADABLE_KINDS } from "@/lib/startup-files";

type UploadForm = ReturnType<typeof useFileUploadForm>;

export function FileUploadDialog({ form }: { form: UploadForm }) {
  const t = useTranslations("startupFiles");
  const tKinds = useTranslations("documentKinds");
  if (!form.isOpen) return null;
  return (
    <ModalDialog labelledBy="file-upload-title" onClose={form.close}>
      <h2 id="file-upload-title" className="text-base font-semibold">
        {t("uploadFile")}
      </h2>
      <label className="block">
        <span className={labelClass}>{t("uploadDialog.kind")}</span>
        <select
          className={fieldClass}
          value={form.kind}
          onChange={(event) => {
            const { value } = event.target;
            if (isEnumValue(DocumentKind, value)) form.setKind(value);
          }}
        >
          {UPLOADABLE_KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {tKinds(kind)}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className={labelClass}>{t("uploadDialog.file")}</span>
        <input
          type="file"
          accept={DOCUMENT_UPLOAD_ACCEPT}
          className="block w-full text-sm text-[#676e78]"
          onChange={(event) => form.setFile(event.target.files?.[0] ?? null)}
        />
      </label>
      <p className="-mt-2 text-xs text-[#858c96]">{t("uploadDialog.hint")}</p>
      <div className="flex justify-end gap-2">
        <SecondaryButton onClick={form.close}>
          {t("uploadDialog.cancel")}
        </SecondaryButton>
        <PrimaryButton onClick={form.submit} disabled={!form.canSubmit}>
          {form.isUploading ? t("uploading") : t("upload")}
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
  const t = useTranslations("startupFiles");
  if (!document) return null;
  const sharedWith = new Set(document.shares.map((share) => share.mentorId));
  return (
    <ModalDialog labelledBy="file-share-title" onClose={onClose}>
      <div>
        <h2 id="file-share-title" className="text-base font-semibold">
          {t("share")}
        </h2>
        <p className="mt-1 truncate text-xs text-[#858c96]">
          {document.originalFilename}
        </p>
      </div>
      {mentors.length === 0 ? (
        <p className="text-sm text-[#676e78]">{t("shareDialog.noMentors")}</p>
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
                  {t("shareDialog.stop")}
                </SecondaryButton>
              ) : (
                <PrimaryButton
                  disabled={isBusy}
                  onClick={() => onShare(mentor.id)}
                >
                  {t("shareDialog.share")}
                </PrimaryButton>
              )}
            </li>
          ))}
        </ul>
      )}
      <div className="flex justify-end">
        <SecondaryButton onClick={onClose}>
          {t("shareDialog.close")}
        </SecondaryButton>
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
  const t = useTranslations("startupFiles.deleteDialog");
  if (!document) return null;
  return (
    <ModalDialog labelledBy="file-delete-title" onClose={onCancel}>
      <h2 id="file-delete-title" className="text-base font-semibold">
        {t("title")}
      </h2>
      <p className="text-sm text-[#676e78]">
        {t("body", { name: document.originalFilename })}
      </p>
      <div className="flex justify-end gap-2">
        <SecondaryButton onClick={onCancel}>{t("cancel")}</SecondaryButton>
        <DangerButton disabled={isDeleting} onClick={onConfirm}>
          {isDeleting ? t("deleting") : t("delete")}
        </DangerButton>
      </div>
    </ModalDialog>
  );
}
