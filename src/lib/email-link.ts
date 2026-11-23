import { EmailLinkProblem } from "@/types/email-center";

export type EmailLink =
  { href: string; problem: null } | { href: null; problem: EmailLinkProblem };

const WITH_SCHEME = /^([a-z][a-z0-9+.-]*):\/\//i;
const OTHER_SCHEME =
  /^(?:mailto|tel|sms|javascript|data|vbscript|file|blob|about):/i;

function refused(problem: EmailLinkProblem): EmailLink {
  return { href: null, problem };
}

/**
 * What a typed address becomes in a mail: only https links survive the backend's cleaning, so nothing else is
 * offered as a link here. An address without a scheme is taken as https.
 */
export function emailLink(typed: string): EmailLink {
  const value = typed.trim();
  if (value === "") return refused(EmailLinkProblem.Empty);
  const scheme = WITH_SCHEME.exec(value)?.[1]?.toLowerCase();
  if (scheme === "http") return refused(EmailLinkProblem.Http);
  if ((scheme && scheme !== "https") || OTHER_SCHEME.test(value))
    return refused(EmailLinkProblem.Other);
  if (!scheme && value.includes("@")) return refused(EmailLinkProblem.Email);
  const href = scheme ? value : `https://${value}`;
  if (/\s/.test(href) || !URL.canParse(href))
    return refused(EmailLinkProblem.Invalid);
  const { hostname, username, password } = new URL(href);
  return hostname.includes(".") && username === "" && password === ""
    ? { href, problem: null }
    : refused(EmailLinkProblem.Invalid);
}

export function isEmailLink(typed: string) {
  return emailLink(typed).problem === null;
}

/** An http:// address in the text: it looks like a link to its writer and is none to its readers. */
export function hasHttpAddress(text: string) {
  return /\bhttp:\/\/\S/i.test(text);
}

/** A link in pasted HTML that will lose its address. */
export function hasHttpLink(html: string) {
  return /<a\b[^>]*\bhref\s*=\s*["']?\s*http:\/\//i.test(html);
}
