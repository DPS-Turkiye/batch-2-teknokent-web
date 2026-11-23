import { describe, expect, it } from "vitest";

import {
  emailLink,
  hasHttpAddress,
  hasHttpLink,
  isEmailLink,
} from "@/lib/email-link";
import { EmailLinkProblem } from "@/types/email-center";

describe("addresses in a mail", () => {
  it.each([
    ["https://menton.com.tr/invite?a=1", "https://menton.com.tr/invite?a=1"],
    [" HTTPS://Menton.com.tr ", "HTTPS://Menton.com.tr"],
    ["menton.com.tr", "https://menton.com.tr"],
    ["menton.com.tr:8443/yol", "https://menton.com.tr:8443/yol"],
    ["https://site.test/@kisi", "https://site.test/@kisi"],
  ])("takes %s", (typed, href) => {
    expect(emailLink(typed)).toEqual({ href, problem: null });
    expect(isEmailLink(typed)).toBe(true);
  });

  it.each([
    ["  ", EmailLinkProblem.Empty],
    ["http://menton.com.tr", EmailLinkProblem.Http],
    ["HTTP://menton.com.tr", EmailLinkProblem.Http],
    ["kisi@ornek.example", EmailLinkProblem.Email],
    ["mailto:kisi@ornek.example", EmailLinkProblem.Other],
    ["javascript:alert(1)", EmailLinkProblem.Other],
    ["JavaScript:alert(1)", EmailLinkProblem.Other],
    ["ftp://menton.com.tr", EmailLinkProblem.Other],
    ["menton", EmailLinkProblem.Invalid],
    ["iki kelime.com", EmailLinkProblem.Invalid],
    ["https://", EmailLinkProblem.Invalid],
    ["https://menton.com.tr@kotu.example", EmailLinkProblem.Invalid],
  ])("refuses %s as %s", (typed, problem) => {
    expect(emailLink(typed)).toEqual({ href: null, problem });
    expect(isEmailLink(typed)).toBe(false);
  });

  it("notices http addresses in text and links in pasted HTML", () => {
    expect(hasHttpAddress("bak http://eski.example")).toBe(true);
    expect(hasHttpAddress("bak https://yeni.example")).toBe(false);
    expect(hasHttpAddress("http:// yazma")).toBe(false);
    expect(hasHttpLink('<a class="x" href="http://a.example">a</a>')).toBe(
      true,
    );
    expect(hasHttpLink('<a href="https://a.example">http://a</a>')).toBe(false);
  });
});
