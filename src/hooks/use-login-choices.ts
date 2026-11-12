"use client";

import type { Edition } from "@/interfaces/edition";
import { isOdtuDevLoginEnabled } from "@/lib/const";
import { loginChoices } from "@/lib/login-choices";

/** The sign-in choices of this deployment's /login. */
export function useLoginChoices(edition: Edition) {
  return loginChoices(edition, isOdtuDevLoginEnabled());
}
