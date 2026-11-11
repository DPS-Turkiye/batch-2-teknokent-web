"use client";

import { useCallback, useMemo, useState, type SubmitEvent } from "react";

import type { RegisterForm } from "@/interfaces/auth";
import { ClientApiError } from "@/lib/client/api";
import { ALLOWED_EMAIL_DOMAINS } from "@/lib/const";
import {
  EMAIL_PATTERN,
  emailCharacterError,
  formatEmailDomains,
  isAllowedEmailDomain,
} from "@/lib/email";
import { describeAuthError } from "@/lib/firebase/auth";
import { passwordStrengthError } from "@/lib/password";
import { normalizePhoneInput, phoneNumberError } from "@/lib/phone";

const EMPTY_FORM: RegisterForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  passwordConfirm: "",
};

export function useRegisterForm(
  onSubmit?: (form: RegisterForm) => Promise<void>,
  allowedDomains: readonly string[] = ALLOWED_EMAIL_DOMAINS,
) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<RegisterForm>(EMPTY_FORM);

  const update = useCallback(
    <K extends keyof RegisterForm>(key: K, value: RegisterForm[K]) =>
      setForm((current) => ({ ...current, [key]: value })),
    [],
  );

  /** Fills only fields that are still empty, so a value that arrives late never overwrites what was typed. */
  const prefill = useCallback((values: Partial<RegisterForm>) => {
    setForm((current) => {
      const next = { ...current };
      for (const [key, value] of Object.entries(values) as [
        keyof RegisterForm,
        string,
      ][]) {
        if (value && !current[key].trim()) next[key] = value;
      }
      return next;
    });
  }, []);

  const reset = useCallback(() => setForm(EMPTY_FORM), []);

  const passwordStrengthErrorMessage = passwordStrengthError(form.password);
  const phoneErrorMessage = phoneNumberError(form.phone);

  const updatePhone = useCallback((value: string) => {
    setForm((current) => ({
      ...current,
      phone: normalizePhoneInput(value),
    }));
  }, []);

  const passwordsMismatch =
    form.passwordConfirm.length > 0 && form.password !== form.passwordConfirm;

  const emailCharacterErrorMessage = emailCharacterError(form.email);
  const emailDomainAllowed = isAllowedEmailDomain(form.email, allowedDomains);
  // Only once the address looks finished, so the error does not flash while typing.
  const emailDomainNotAllowed =
    !emailDomainAllowed && EMAIL_PATTERN.test(form.email.trim());

  const canSubmit = useMemo(
    () =>
      Boolean(
        form.firstName.trim() &&
        form.lastName.trim() &&
        form.email.trim() &&
        !emailCharacterErrorMessage &&
        emailDomainAllowed &&
        form.phone.trim() &&
        !phoneErrorMessage &&
        form.password.trim() &&
        !passwordStrengthErrorMessage &&
        form.password === form.passwordConfirm,
      ),
    [
      form,
      emailCharacterErrorMessage,
      emailDomainAllowed,
      passwordStrengthErrorMessage,
      phoneErrorMessage,
    ],
  );

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!onSubmit || !canSubmit || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      await onSubmit(form);
    } catch (caught) {
      setError(
        caught instanceof ClientApiError
          ? caught.message
          : describeAuthError(caught),
      );
      setSubmitting(false);
    }
  }

  return {
    form,
    update,
    prefill,
    reset,
    updatePhone,
    canSubmit,
    passwordStrengthErrorMessage,
    passwordsMismatch,
    emailCharacterErrorMessage,
    allowedEmailDomains: formatEmailDomains(allowedDomains),
    emailDomainNotAllowed,
    phoneErrorMessage,
    submitting,
    error,
    submit,
  };
}
