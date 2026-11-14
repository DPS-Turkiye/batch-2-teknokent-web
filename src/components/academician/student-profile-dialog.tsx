"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId } from "react";

import { StudentProfileBody } from "@/components/academician/student-profile-view";
import { ModalDialog } from "@/components/common/modal-dialog";
import { Button, ButtonVariant } from "@/components/ia/button";
import { useAcademicianStudent } from "@/hooks/use-academician-student";
import { StudentProfileOrigin } from "@/types/academician-office-hours";

/** The student profile over the request drawer; "Kapat" goes back to the request, the full page is a link away. */
export function StudentProfileDialog({
  userId,
  onClose,
}: {
  userId: string;
  onClose: () => void;
}) {
  const t = useTranslations("iaAcademician.student");
  const profile = useAcademicianStudent(
    userId,
    StudentProfileOrigin.Appointments,
  );
  const titleId = useId();
  return (
    <ModalDialog
      labelledBy={titleId}
      onClose={onClose}
      overlayClassName="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-background-inverse/30 px-4 py-8"
      panelClassName="w-full max-w-[880px] space-y-5 rounded-featured bg-background-surface p-6 shadow-modal outline-none"
      dismissOnBackdrop
    >
      <div className="flex items-start justify-between gap-3">
        <h2 id={titleId} className="type-h3 text-text-primary">
          {profile.student?.name ?? t("record")}
        </h2>
        <button
          type="button"
          aria-label={t("close")}
          onClick={onClose}
          className="grid size-8 place-items-center rounded-lg text-icon-default hover:bg-background-subtle focus-visible:outline-2 focus-visible:outline-border-selected"
        >
          <X aria-hidden className="size-4" />
        </button>
      </div>
      <StudentProfileBody profile={profile} withActions={false} />
      <div className="flex justify-end gap-2 border-t border-border-subtle pt-4">
        <Button variant={ButtonVariant.Ghost} onClick={onClose}>
          {t("close")}
        </Button>
        {profile.student ? (
          <Button href={profile.student.fullProfileHref}>
            {t("fullProfile")}
          </Button>
        ) : null}
      </div>
    </ModalDialog>
  );
}
