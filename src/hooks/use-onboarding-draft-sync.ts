"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type {
  OnboardingDraftKind,
  OnboardingDraftRecord,
} from "@/interfaces/onboarding-draft";
import {
  clearOnboardingDraft,
  fetchOnboardingDraft,
  saveOnboardingDraft,
} from "@/lib/client/onboarding-draft";
import { stripFileHandles } from "@/lib/draft-storage";
import { currentIdToken } from "@/lib/firebase/auth";

const DEBOUNCE_MS = 500;

function fingerprint(step: string, payload: unknown) {
  return JSON.stringify({ step, payload: stripFileHandles(payload) });
}

/**
 * Loads the in-progress wizard from the server once a Firebase session exists,
 * then writes back on a short debounce (and on unmount). Local typing that
 * happens before the GET returns wins, so a slow restore cannot clobber what
 * the user just entered.
 */
export function useOnboardingDraftSync(options: {
  kind: OnboardingDraftKind;
  step: string | number;
  payload: unknown;
  onRestore: (saved: OnboardingDraftRecord) => void;
}) {
  const { kind, onRestore } = options;
  const step = String(options.step);
  const [ready, setReady] = useState(false);
  const payloadRef = useRef(options.payload);
  payloadRef.current = options.payload;
  const stepRef = useRef(step);
  stepRef.current = step;
  const onRestoreRef = useRef(onRestore);
  onRestoreRef.current = onRestore;
  const clearedRef = useRef(false);
  const baselineRef = useRef<string | null>(null);
  if (baselineRef.current === null) {
    baselineRef.current = fingerprint(step, options.payload);
  }

  const persist = useCallback(async () => {
    if (clearedRef.current) return;
    try {
      const idToken = await currentIdToken();
      if (!idToken) return;
      await saveOnboardingDraft(idToken, {
        kind,
        step: stepRef.current,
        payload: stripFileHandles(payloadRef.current),
      });
    } catch {
      // A draft that cannot be saved must not break the wizard.
    }
  }, [kind]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const idToken = await currentIdToken();
        if (!idToken || cancelled) return;
        const saved = await fetchOnboardingDraft(idToken);
        if (cancelled || !saved || saved.kind !== kind) return;
        const dirty =
          fingerprint(stepRef.current, payloadRef.current) !==
          baselineRef.current;
        if (dirty) return;
        onRestoreRef.current(saved);
      } catch {
        // Stay on the empty local draft; the next save creates the row.
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [kind]);

  useEffect(() => {
    if (!ready) return;
    const timer = window.setTimeout(() => {
      void persist();
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [ready, step, options.payload, persist]);

  useEffect(() => {
    if (!ready) return;
    return () => {
      void persist();
    };
  }, [ready, persist]);

  const saveNow = useCallback(async () => {
    await persist();
  }, [persist]);

  const clearRemote = useCallback(async () => {
    clearedRef.current = true;
    try {
      const idToken = await currentIdToken();
      if (!idToken) return;
      await clearOnboardingDraft(idToken);
    } catch {
      // Submit already succeeded; a leftover draft is cleared next time.
    }
  }, []);

  return { ready, saveNow, clearRemote };
}
