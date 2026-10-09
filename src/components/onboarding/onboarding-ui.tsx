"use client";

import Image from "next/image";
import { ChangeEvent, type ReactNode, useRef, useState } from "react";

import {
  ONBOARDING_TONES,
  OnboardingTone,
} from "@/components/onboarding/onboarding-tone";
import { useObjectUrl } from "@/hooks/use-object-url";
import type { UploadedFile } from "@/interfaces/signup";
import { DOCUMENT_MAX_BYTES } from "@/lib/const";
import { formatFileSize } from "@/lib/utils";
import { useLocale } from "@/components/providers/locale-provider";

export const onboardingInputClass =
  "w-full rounded-lg border border-[#d4d8dd] bg-white px-3.5 py-[11px] text-[13px] leading-5 text-[#22262b] outline-none placeholder:text-[#858c96]";

export function OnboardingCard({
  title,
  subtitle,
  action,
  children,
  rounded = "rounded-3xl",
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children?: ReactNode;
  rounded?: string;
}) {
  return (
    <section
      className={`flex w-full flex-col gap-4 border border-[#e4e7ea] bg-white px-[22px] py-5 ${rounded}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-[15px] font-semibold leading-[23px] text-[#22262b]">
            {title}
          </h2>
          {subtitle ? (
            <p className="max-w-[470px] text-[12.5px] leading-[19px] text-[#676e78]">
              {subtitle}
            </p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function OnboardingTextAction({
  tone,
  onClick,
  children,
}: {
  tone: OnboardingTone;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 text-[12.5px] font-medium leading-[19px] hover:underline ${ONBOARDING_TONES[tone].text}`}
    >
      {children}
    </button>
  );
}

export function OnboardingField({
  id,
  label,
  required = false,
  tone,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  tone: OnboardingTone;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-[7px]">
      <label
        htmlFor={id}
        className="flex gap-1 text-[12.5px] font-medium leading-[19px] text-[#4a5059]"
      >
        {label}
        {required ? (
          <span aria-hidden className={ONBOARDING_TONES[tone].text}>
            *
          </span>
        ) : null}
      </label>
      {children}
    </div>
  );
}

export function OnboardingCounter({
  hint,
  length,
  max,
}: {
  hint: string;
  length: number;
  max: number;
}) {
  return (
    <div className="flex items-start justify-between gap-3 text-[11.5px] leading-[17px] text-[#858c96]">
      <p>{hint}</p>
      <p>
        {length} / {max}
      </p>
    </div>
  );
}

export function OnboardingChips<T extends string>({
  tone,
  label,
  options,
  selected,
  onToggle,
  labelFor = (value) => value,
}: {
  tone: OnboardingTone;
  label: string;
  options: readonly T[];
  selected: readonly T[];
  onToggle: (value: T) => void;
  labelFor?: (value: T) => string;
}) {
  const theme = ONBOARDING_TONES[tone];
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const on = selected.includes(option);
        return (
          <button
            key={option}
            type="button"
            aria-pressed={on}
            onClick={() => onToggle(option)}
            className={`flex items-center gap-1.5 rounded-full border px-[13px] py-[7px] text-[12.5px] font-medium leading-[19px] ${
              on
                ? `${theme.soft} ${theme.border} ${theme.text}`
                : "border-[#d4d8dd] bg-white text-[#4a5059] hover:bg-[#f8f9fa]"
            }`}
          >
            {on ? (
              <span
                aria-hidden
                className={`size-1.5 rounded-full ${theme.bg}`}
              />
            ) : null}
            {labelFor(option)}
          </button>
        );
      })}
    </div>
  );
}

export function OnboardingNote({
  tone,
  title,
  children,
  icon,
}: {
  tone?: OnboardingTone;
  title?: string;
  children: ReactNode;
  icon?: string;
}) {
  const background =
    tone === OnboardingTone.Mentor
      ? "border border-[#e6f1f8] bg-[#f2f8fc]"
      : tone === OnboardingTone.Mentee
        ? "bg-[#fff4ec]"
        : "border border-[#e4e7ea] bg-[#f8f9fa]";
  return (
    <div
      className={`flex w-full items-start gap-3 rounded-[10px] px-4 py-3.5 ${background}`}
    >
      {icon ? (
        <Image
          src={icon}
          alt=""
          width={17}
          height={17}
          className="mt-0.5 size-[17px] shrink-0"
        />
      ) : null}
      <div className="flex flex-col gap-[3px]">
        {title ? (
          <p className="text-[12.5px] font-medium leading-[19px] text-[#22262b]">
            {title}
          </p>
        ) : null}
        <div className="text-xs leading-[18px] text-[#4a5059]">{children}</div>
      </div>
    </div>
  );
}

/** The dashed drop area from the designs, or the chosen file with its status. */
export function OnboardingFileField({
  label,
  file,
  onChange,
  accept,
  helpText,
  maxBytes = DOCUMENT_MAX_BYTES,
  storedName,
}: {
  label: string;
  file: UploadedFile | null;
  onChange: (file: UploadedFile | null) => void;
  accept: string;
  helpText?: string;
  maxBytes?: number;
  storedName?: string | null;
}) {
  const { messages } = useLocale();
  const copy = messages.onboarding;
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  function takeFile(selected: File | undefined) {
    if (!selected) return;
    if (selected.size > maxBytes) {
      setError(copy.fileTooBig(formatFileSize(maxBytes)));
      return;
    }
    setError("");
    onChange({ name: selected.name, size: selected.size, file: selected });
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    takeFile(event.target.files?.[0]);
    event.target.value = "";
  }

  const shownName = file?.name ?? storedName ?? null;

  return (
    <div className="flex flex-col gap-2">
      {shownName ? (
        <div className="flex items-center justify-between gap-3 rounded-[10px] border border-[#e4e7ea] bg-white px-3.5 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <Image
              src="/onboarding/paper.svg"
              alt=""
              width={17}
              height={17}
              className="size-[17px] shrink-0"
            />
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="truncate text-[13px] font-medium leading-5 text-[#22262b]">
                {shownName}
              </p>
              <p className="text-[11.5px] leading-[17px] text-[#676e78]">
                {file ? formatFileSize(file.size) : copy.uploadedBefore}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2.5">
            <span className="rounded-full border border-[#cbebda] bg-[#eefaf3] px-2.5 py-1 text-[11.5px] font-medium leading-[17px] text-[#0f7a4d]">
              {file ? copy.selected : copy.uploaded}
            </span>
            <button
              type="button"
              onClick={() =>
                file ? onChange(null) : inputRef.current?.click()
              }
              className="text-xs font-medium leading-[18px] text-[#676e78] hover:underline"
              aria-label={
                file ? copy.removeFile(shownName) : copy.change(label)
              }
            >
              {file ? copy.remove : copy.changeShort}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            takeFile(event.dataTransfer.files?.[0]);
          }}
          className={`flex w-full flex-col items-center justify-center gap-1.5 rounded-[10px] border border-dashed px-[18px] py-6 ${
            dragging
              ? "border-[#858c96] bg-[#eef0f2]"
              : "border-[#d4d8dd] bg-[#f8f9fa]"
          }`}
        >
          <Image
            src="/onboarding/upload.svg"
            alt=""
            width={22}
            height={22}
            className="size-[22px]"
          />
          <span className="text-[13px] font-medium leading-5 text-[#22262b]">
            {copy.drop}
          </span>
          <span className="text-xs leading-[18px] text-[#676e78]">
            {helpText ?? copy.orPick}
          </span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        aria-label={label}
        className="hidden"
        onChange={handleChange}
      />
      {error ? (
        <p role="alert" className="text-[11.5px] text-[#b42318]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function OnboardingReviewCard({
  tone,
  title,
  onEdit,
  rows,
  rounded = "rounded-3xl",
}: {
  tone: OnboardingTone;
  title: string;
  onEdit: () => void;
  rows: { label: string; value: string }[];
  rounded?: string;
}) {
  return (
    <section
      className={`flex w-full flex-col gap-3.5 border border-[#e4e7ea] bg-white px-[22px] py-5 ${rounded}`}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold leading-[23px] text-[#22262b]">
          {title}
        </h2>
        <OnboardingTextAction tone={tone} onClick={onEdit}>
          Düzenle
        </OnboardingTextAction>
      </div>
      <dl className="flex flex-col gap-3.5">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-start gap-4 text-[12.5px] leading-[19px]"
          >
            <dt className="w-[180px] shrink-0 text-[#676e78]">{row.label}</dt>
            <dd className="min-w-0 flex-1 font-medium text-[#4a5059]">
              {row.value || "Belirtilmedi"}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function OnboardingConsent({
  tone,
  checked,
  onChange,
  children,
}: {
  tone: OnboardingTone;
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
}) {
  const theme = ONBOARDING_TONES[tone];
  return (
    <label className="flex w-full cursor-pointer items-start gap-3 rounded-[10px] border border-[#e4e7ea] bg-white px-4 py-3.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={`mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-[5px] border peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 ${
          checked ? `${theme.bg} ${theme.border}` : "border-[#d4d8dd] bg-white"
        }`}
      >
        {checked ? (
          <Image
            src="/onboarding/check.svg"
            alt=""
            width={14}
            height={14}
            className="size-3.5"
          />
        ) : null}
      </span>
      <span className="text-[12.5px] leading-[19px] text-[#4a5059]">
        {children}
      </span>
    </label>
  );
}

/** The logo square / photo circle: a dashed placeholder, or the picked image. */
export function OnboardingImagePicker({
  label,
  placeholder,
  file,
  onChange,
  round = false,
  size = 64,
}: {
  label: string;
  placeholder: string;
  file: UploadedFile | null;
  onChange: (file: UploadedFile | null) => void;
  round?: boolean;
  size?: number;
}) {
  const { messages } = useLocale();
  const copy = messages.onboarding;
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const preview = useObjectUrl(file?.file);
  const shape = round ? "rounded-full" : "rounded-xl";

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    event.target.value = "";
    if (!selected) return;
    if (selected.size > 5 * 1024 * 1024) {
      setError(copy.imageTooBig);
      return;
    }
    setError("");
    onChange({ name: selected.name, size: selected.size, file: selected });
  }

  return (
    <div className="flex shrink-0 flex-col items-start gap-1">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        aria-label={file ? copy.change(label) : copy.pick(label)}
        className="relative"
        style={{ width: size, height: size }}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- a local blob preview, not an optimisable asset
          <img
            src={preview}
            alt=""
            className={`size-full object-cover ${shape}`}
          />
        ) : (
          <span
            className={`grid size-full place-items-center border border-dashed border-[#d4d8dd] bg-[#f8f9fa] text-[11px] font-medium leading-[17px] text-[#858c96] ${shape}`}
          >
            {file ? file.name.slice(0, 1).toUpperCase() : placeholder}
          </span>
        )}
        {round ? null : (
          <Image
            src="/onboarding/logo-add.svg"
            alt=""
            width={24}
            height={24}
            className="absolute -bottom-1.5 -right-2 size-6"
          />
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.webp"
        aria-label={label}
        className="hidden"
        onChange={handleChange}
      />
      {error ? (
        <p role="alert" className="text-[11px] text-[#b42318]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function OnboardingListRow({
  children,
  actionLabel,
  onAction,
  actionAriaLabel,
}: {
  children: ReactNode;
  actionLabel: string;
  onAction?: () => void;
  actionAriaLabel?: string;
}) {
  return (
    <div className="flex w-full items-center justify-between gap-3 rounded-lg border border-[#e4e7ea] bg-white px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-2.5">{children}</div>
      {onAction ? (
        <button
          type="button"
          onClick={onAction}
          aria-label={actionAriaLabel}
          className="shrink-0 text-xs font-medium leading-[18px] text-[#676e78] hover:underline"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
