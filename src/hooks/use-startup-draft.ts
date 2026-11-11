"use client";

import { useCallback, type Dispatch, type SetStateAction } from "react";

import type { CreateStartupInput } from "@/interfaces/organization";
import {
  MAX_SUPPORT_AREAS,
  type SignupDraft,
  type StartupDocumentKind,
  type StartupProfileDraft,
  type TeamMemberDraft,
  type UploadedFile,
} from "@/interfaces/signup";
import { withKey } from "@/lib/keyed-list";

export function emptySignupDraft(): SignupDraft {
  return {
    personal: {
      firstName: "",
      lastName: "",
      role: "",
      bio: "",
      linkedin: "",
      contactPreferences: [],
      cv: null,
    },
    startup: {
      name: "",
      tagline: "",
      website: "",
      foundedYear: "",
      programId: null,
      startupLater: false,
      maturity: "",
      teamMembers: [],
      supportAreas: [],
      logo: null,
    },
    documents: {},
    mvpUrl: "",
    consent: false,
  };
}

/** The startup part of the draft as the backend takes it, at signup and on /startup. */
export function startupRequestFields(draft: SignupDraft): CreateStartupInput {
  const { startup } = draft;
  const year = Number(startup.foundedYear);
  return {
    name: startup.name.trim(),
    description: startup.tagline.trim() || undefined,
    website: startup.website.trim() || undefined,
    mvpUrl: draft.mvpUrl.trim() || undefined,
    foundedYear: year >= 1900 && year <= 2100 ? year : undefined,
    maturity: startup.maturity || undefined,
    supportAreas: startup.supportAreas,
    teamMembers: startup.teamMembers.map((member) => ({
      fullName: member.fullName,
      jobTitle: member.jobTitle || undefined,
      email: member.email || undefined,
    })),
  };
}

export function toggle<T>(list: T[], value: T) {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

/**
 * The startup-step and documents-step editors, shared by the signup wizard and
 * the "Startup'ımı oluştur" form on /startup.
 */
export function useStartupDraftEditors(
  setDraft: Dispatch<SetStateAction<SignupDraft>>,
) {
  const updateStartup = useCallback(
    <K extends keyof StartupProfileDraft>(
      key: K,
      value: StartupProfileDraft[K],
    ) => {
      setDraft((current) => ({
        ...current,
        startup: { ...current.startup, [key]: value },
      }));
    },
    [setDraft],
  );

  const toggleSupportArea = useCallback(
    (value: string) => {
      setDraft((current) => {
        const selected = current.startup.supportAreas;
        if (!selected.includes(value) && selected.length >= MAX_SUPPORT_AREAS) {
          return current;
        }
        return {
          ...current,
          startup: {
            ...current.startup,
            supportAreas: toggle(selected, value),
          },
        };
      });
    },
    [setDraft],
  );

  const addTeamMember = useCallback(
    (member: TeamMemberDraft) => {
      setDraft((current) => ({
        ...current,
        startup: {
          ...current.startup,
          teamMembers: [...current.startup.teamMembers, withKey(member)],
        },
      }));
    },
    [setDraft],
  );

  const removeTeamMember = useCallback(
    (index: number) => {
      setDraft((current) => ({
        ...current,
        startup: {
          ...current.startup,
          teamMembers: current.startup.teamMembers.filter(
            (_, i) => i !== index,
          ),
        },
      }));
    },
    [setDraft],
  );

  const setMvpUrl = useCallback(
    (mvpUrl: string) => {
      setDraft((current) => ({ ...current, mvpUrl }));
    },
    [setDraft],
  );

  const setDocument = useCallback(
    (kind: StartupDocumentKind, file: UploadedFile | null) => {
      setDraft((current) => {
        const documents = { ...current.documents };
        if (file) documents[kind] = file;
        else delete documents[kind];
        return { ...current, documents };
      });
    },
    [setDraft],
  );

  return {
    updateStartup,
    toggleSupportArea,
    addTeamMember,
    removeTeamMember,
    setMvpUrl,
    setDocument,
  };
}

/** What the startup fields and the documents step need from their form. */
export type StartupDraftForm = ReturnType<typeof useStartupDraftEditors> & {
  draft: SignupDraft;
  supportAreaLimitReached: boolean;
};
