import type { IdentityKind } from "@/interfaces/session";

/** Institutions Menton can sign people in through; the value is the backend's provider id. */
export enum InstitutionProvider {
  Odtu = "odtu",
  Otg = "otg",
}

export type InstitutionLoginStart = {
  /** Where the browser goes next: the institution's login, or the dev persona page. */
  redirectUrl: string;
  state: string;
};

export type InstitutionLoginCompletion = {
  customToken: string;
  /** The in-app path the login was started for, if any. */
  next?: string | null;
};

/** A test person of the backend's dev stub. */
export type DevPersona = {
  id: string;
  label: string;
  fullName: string;
  kinds: IdentityKind[];
};
