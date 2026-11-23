import { describe, expect, it } from "vitest";

import {
  emailLink,
  hasHttpAddress,
  isEmailHref,
  isEmailLink,
  withoutLostLinks,
} from "@/lib/email-link";
import { EmailLinkProblem } from "@/types/email-center";

describe("addresses in a mail", () => {
  it.each([
    ["https://menton.com.tr/invite?a=1", "https://menton.com.tr/invite?a=1"],
    [" HTTPS://Menton.com.tr ", "https://Menton.com.tr"],
    ["menton.com.tr", "https://menton.com.tr"],
    ["menton.com.tr:8443/yol", "https://menton.com.tr:8443/yol"],
    ["https://site.test/@kisi", "https://site.test/@kisi"],
    ["site.test/?kim=a@b", "https://site.test/?kim=a@b"],
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
    ["/belge.pdf", EmailLinkProblem.Invalid],
    ["https://..", EmailLinkProblem.Invalid],
    ["https://a.", EmailLinkProblem.Invalid],
    ["https://menton.com.tr@kotu.example", EmailLinkProblem.Invalid],
  ])("refuses %s as %s", (typed, problem) => {
    expect(emailLink(typed)).toEqual({ href: null, problem });
    expect(isEmailLink(typed)).toBe(false);
  });

  it("takes a pasted link's address only as it is", () => {
    expect(isEmailHref("https://menton.com.tr")).toBe(true);
    expect(isEmailHref("menton.com.tr")).toBe(false);
    expect(isEmailHref("/belge.pdf")).toBe(false);
    expect(isEmailHref("http://menton.com.tr")).toBe(false);
  });

  it("notices a written http address, but not one inside an https address", () => {
    expect(hasHttpAddress("<p>bak http://eski.example</p>")).toBe(true);
    expect(hasHttpAddress("<p>http://eski.example</p>")).toBe(true);
    expect(hasHttpAddress("<p>bak https://yeni.example</p>")).toBe(false);
    expect(hasHttpAddress("<p>http:// yazma</p>")).toBe(false);
    expect(
      hasHttpAddress('<a href="https://a.test/?u=http://b.test">a</a>'),
    ).toBe(false);
  });

  it.each([
    ['<a class="x" href="http://a.example">a</a>', '<a class="x" >a</a>'],
    ["<a href=mailto:a@b.test>a</a>", "<a >a</a>"],
    ["<a href='www.a.example' id='b'>a</a>", "<a  id='b'>a</a>"],
    ['<a href="">a</a>', "<a >a</a>"],
  ])("takes the address off %s, which cannot be a link", (html, cleaned) => {
    expect(withoutLostLinks(html)).toEqual({ cleaned, lost: true });
  });

  it.each([
    '<a href="https://a.example" target="_blank">http://a</a>',
    "<p>metin href=http://a.example</p>",
  ])("leaves %s as it is", (html) => {
    expect(withoutLostLinks(html)).toEqual({ cleaned: html, lost: false });
  });
});
