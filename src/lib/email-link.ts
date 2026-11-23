import { EmailLinkProblem } from "@/types/email-center";

export type EmailLink =
  { href: string; problem: null } | { href: null; problem: EmailLinkProblem };

const WITH_SCHEME = /^([a-z][a-z0-9+.-]*):\/\//i;
const HOSTNAME = /^(?:[a-z0-9-]+\.)+[a-z0-9-]{2,}$/i;
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
  if (!scheme && /^[^/?#]*@/.test(value))
    return refused(EmailLinkProblem.Email);
  const rest = value.replace(WITH_SCHEME, "");
  const href = `https://${rest}`;
  if (/^\/|\s/.test(rest) || !URL.canParse(href))
    return refused(EmailLinkProblem.Invalid);
  const { hostname, username, password } = new URL(href);
  return HOSTNAME.test(hostname) && username === "" && password === ""
    ? { href, problem: null }
    : refused(EmailLinkProblem.Invalid);
}

export function isEmailLink(typed: string) {
  return emailLink(typed).problem === null;
}

/** A link's own address, as pasted or saved: unlike a typed one it must already be https. */
export function isEmailHref(href: string) {
  return /^https:\/\//i.test(href) && isEmailLink(href);
}

/** An http:// address written in the text: it looks like a link to its writer and is none to its readers. */
export function hasHttpAddress(html: string) {
  return /(?:^|[\s>(;])http:\/\/[^\s<]/i.test(html);
}

const PASTED_HREF =
  /(<a\b[^>]*?)\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]*))/gi;

/** Pasted HTML without the links a mail cannot have; their words stay. */
export function withoutLostLinks(html: string) {
  let lost = false;
  const cleaned = html.replace(
    PASTED_HREF,
    (link: string, before: string, ...hrefs: (string | undefined)[]) => {
      if (isEmailHref(hrefs.slice(0, 3).find(Boolean) ?? "")) return link;
      lost = true;
      return before;
    },
  );
  return { cleaned, lost };
}
