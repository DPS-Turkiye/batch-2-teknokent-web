"use client";

import { Check, ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import type { ReactNode } from "react";

import { CoordinatorPicker } from "@/components/admin/coordinator-picker";
import { ProgramTypeChip } from "@/components/coordinator/program-type-chip";
import { useAdminProgramWizard } from "@/hooks/use-admin-program-wizard";
import { ProgramType } from "@/interfaces/program";
import { WIZARD_STEPS, WizardStep } from "@/lib/admin-program-wizard";
import { choiceKey, CoordinatorChoiceKind } from "@/lib/coordinator-picker";
import { formatLongDate } from "@/lib/utils";

// TEST UI: placeholder until the design team's screen; replace when it arrives.

const FIELD =
  "mt-1.5 h-11 w-full rounded-2xl border border-[#e9ecef] px-4 text-[13.5px] text-[#22262b] outline-none focus:border-[#22262b]";

type Wizard = ReturnType<typeof useAdminProgramWizard>;

export function ProgramWizardView() {
  const t = useTranslations("adminProgramWizard");
  const wizard = useAdminProgramWizard();
  const nextStep = WIZARD_STEPS[wizard.stepIndex + 1];
  const nextStepLabel = nextStep ? t(`steps.${nextStep}.label`) : "";

  return (
    <div className="space-y-6">
      <nav
        aria-label={t("breadcrumb")}
        className="flex items-center gap-1.5 text-[13px] text-[#858c96]"
      >
        <Link href="/admin/programs">{t("breadcrumb")}</Link>
        <ChevronRight aria-hidden className="size-3.5" />
        <span className="text-[#22262b]">{t("newProgram")}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="rounded-[28px] bg-[#f7f8f9] p-5 lg:self-start">
          <p className="mb-3 text-[12px] font-medium tracking-wide text-[#858c96] uppercase">
            {t("newProgram")}
          </p>
          <ol className="space-y-1">
            {WIZARD_STEPS.map((item, index) => {
              const current = index === wizard.stepIndex;
              const done = index < wizard.stepIndex;
              return (
                <li
                  key={item}
                  aria-current={current ? "step" : undefined}
                  className={`flex items-center gap-3 rounded-2xl px-3 py-3 ${
                    current
                      ? "bg-white shadow-[0_1px_2px_rgba(33,38,43,0.06)]"
                      : ""
                  }`}
                >
                  <span
                    aria-hidden
                    className={`grid size-7 shrink-0 place-items-center rounded-full text-[12px] ${
                      current || done
                        ? "bg-[#22262b] text-white"
                        : "border border-[#e0e3e7] bg-white text-[#858c96]"
                    }`}
                  >
                    {done ? <Check className="size-3.5" /> : index + 1}
                  </span>
                  <span>
                    <span
                      className={`block text-[14px] ${
                        current || done ? "text-[#22262b]" : "text-[#858c96]"
                      } ${current ? "font-medium" : ""}`}
                    >
                      {t(`steps.${item}.label`)}
                    </span>
                    <span className="block text-[12px] text-[#858c96]">
                      {t(`steps.${item}.hint`)}
                    </span>
                  </span>
                </li>
              );
            })}
          </ol>
        </aside>

        <div className="min-w-0 space-y-5">
          <header>
            <p className="text-[13px] text-[#858c96]">
              {t("stepOf", {
                current: wizard.stepIndex + 1,
                total: WIZARD_STEPS.length,
              })}
            </p>
            <h1 className="mt-1 text-[28px] font-semibold tracking-[-0.03em] text-[#22262b]">
              {t(`steps.${wizard.step}.title`)}
            </h1>
            <p className="mt-1 text-[13.5px] text-[#676e78]">
              {t(`steps.${wizard.step}.note`)}
            </p>
          </header>

          <section className="rounded-[28px] border border-[#e9ecef] bg-white p-6">
            {wizard.step === WizardStep.Type ? (
              <TypeStep wizard={wizard} />
            ) : wizard.step === WizardStep.Info ? (
              <InfoStep wizard={wizard} />
            ) : wizard.step === WizardStep.Coordinators ? (
              <CoordinatorsStep wizard={wizard} />
            ) : (
              <SummaryStep wizard={wizard} />
            )}
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3">
            {wizard.stepIndex === 0 ? (
              <Link
                href="/admin/programs"
                className="px-5 py-[11px] text-[13.5px] text-[#22262b]"
              >
                {t("cancel")}
              </Link>
            ) : (
              <button
                type="button"
                onClick={wizard.back}
                className="px-5 py-[11px] text-[13.5px] text-[#22262b]"
              >
                {t("back")}
              </button>
            )}
            <div className="flex items-center gap-3">
              {wizard.error ? (
                <p role="alert" className="text-[13px] text-[#d9464b]">
                  {wizard.error}
                </p>
              ) : null}
              {wizard.last ? (
                <button
                  type="button"
                  onClick={wizard.submit}
                  disabled={wizard.creating}
                  className="rounded-full bg-[#22262b] px-5 py-[11px] text-[13.5px] font-medium text-white disabled:bg-[#aeb4bc]"
                >
                  {wizard.creating ? t("creating") : t("create")}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={wizard.next}
                  className="rounded-full bg-[#22262b] px-5 py-[11px] text-[13.5px] font-medium text-white"
                >
                  {t("continue", { step: nextStepLabel })}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TypeStep({ wizard }: { wizard: Wizard }) {
  const t = useTranslations("adminProgramWizard");
  const tType = useTranslations("programTypes");
  return (
    <fieldset className="grid gap-3">
      <legend className="sr-only">{tType("label")}</legend>
      {Object.values(ProgramType).map((type) => {
        const chosen = wizard.draft.type === type;
        return (
          <label
            key={type}
            className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3.5 ${
              chosen ? "border-[#22262b] bg-[#f7f8f9]" : "border-[#e9ecef]"
            }`}
          >
            <input
              type="radio"
              name="program-type"
              value={type}
              checked={chosen}
              onChange={() => wizard.update({ type })}
              className="mt-1"
            />
            <span>
              <span className="block text-[14.5px] font-medium text-[#22262b]">
                {tType(type)}
              </span>
              <span className="mt-0.5 block text-[12.5px] text-[#676e78]">
                {t(`typeNotes.${type}`)}
              </span>
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}

function Label({
  htmlFor,
  optional,
  children,
}: {
  htmlFor: string;
  optional?: string;
  children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="text-[13px] font-medium text-[#22262b]">
      {children}
      {optional ? (
        <span className="ml-1.5 text-[12px] font-normal text-[#858c96]">
          {optional}
        </span>
      ) : null}
    </label>
  );
}

function InfoStep({ wizard }: { wizard: Wizard }) {
  const t = useTranslations("adminProgramWizard");
  const draft = wizard.draft;
  return (
    <div className="space-y-5">
      <div>
        <Label htmlFor="program-name">{t("name")}</Label>
        <input
          id="program-name"
          value={draft.name}
          onChange={(event) => wizard.update({ name: event.target.value })}
          placeholder={t("namePlaceholder")}
          maxLength={255}
          className={FIELD}
        />
      </div>
      <div>
        <Label htmlFor="program-description" optional={t("optional")}>
          {t("description")}
        </Label>
        <textarea
          id="program-description"
          value={draft.description}
          onChange={(event) =>
            wizard.update({ description: event.target.value })
          }
          maxLength={2000}
          rows={3}
          className="mt-1.5 w-full rounded-2xl border border-[#e9ecef] px-4 py-3 text-[13.5px] text-[#22262b] outline-none focus:border-[#22262b]"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="program-start" optional={t("optional")}>
            {t("start")}
          </Label>
          <input
            id="program-start"
            type="date"
            value={draft.startDate}
            onChange={(event) =>
              wizard.update({ startDate: event.target.value })
            }
            className={FIELD}
          />
        </div>
        <div>
          <Label htmlFor="program-end" optional={t("optional")}>
            {t("end")}
          </Label>
          <input
            id="program-end"
            type="date"
            value={draft.endDate}
            onChange={(event) => wizard.update({ endDate: event.target.value })}
            className={FIELD}
          />
        </div>
      </div>
    </div>
  );
}

function CoordinatorsStep({ wizard }: { wizard: Wizard }) {
  return (
    <CoordinatorPicker
      chosen={wizard.draft.coordinators}
      onChange={wizard.setCoordinators}
    />
  );
}

function SummaryStep({ wizard }: { wizard: Wizard }) {
  const t = useTranslations("adminProgramWizard");
  const locale = useLocale();
  const draft = wizard.draft;
  const dates = [draft.startDate, draft.endDate]
    .filter(Boolean)
    .map((date) => formatLongDate(date, locale))
    .join(" – ");
  return (
    <dl className="grid gap-4 text-[13.5px] sm:grid-cols-[160px_minmax(0,1fr)]">
      <dt className="text-[#858c96]">{t("summaryType")}</dt>
      <dd>{draft.type ? <ProgramTypeChip type={draft.type} /> : null}</dd>
      <dt className="text-[#858c96]">{t("summaryName")}</dt>
      <dd className="text-[#22262b]">{draft.name.trim()}</dd>
      <dt className="text-[#858c96]">{t("summaryDates")}</dt>
      <dd className="text-[#22262b]">{dates || t("noDates")}</dd>
      <dt className="text-[#858c96]">{t("summaryCoordinators")}</dt>
      <dd className="text-[#22262b]">
        <ul className="space-y-1">
          {draft.coordinators.map((choice) => (
            <li key={choiceKey(choice)}>
              {choice.fullName}{" "}
              <span className="text-[#858c96]">{choice.email}</span>
              {choice.kind === CoordinatorChoiceKind.Invited ? (
                <span className="ml-2 rounded-full bg-[#fff4e0] px-2 py-0.5 text-[11.5px] text-[#b7791f]">
                  {t("invitedTag")}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </dd>
      <dt className="text-[#858c96]">{t("summaryStatus")}</dt>
      <dd className="text-[#22262b]">{t("draft")}</dd>
    </dl>
  );
}
