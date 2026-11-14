"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";

import { MentonWordmark } from "@/components/common/menton-wordmark";
import { Button, ButtonSize, ButtonVariant } from "@/components/ia/button";
import { usePublicSessionDestination } from "@/hooks/use-public-session-destination";
import { SUPPORT_EMAIL } from "@/lib/const";
import { IaAccent } from "@/types/ia-theme";

const FEATURES = [
  {
    key: "officeHours",
    image: "/ia/illustrations/office-hours-calendar.png",
    featured: true,
  },
  {
    key: "peerMentoring",
    image: "/ia/illustrations/peer-mentor-magnifier.png",
    featured: false,
  },
  {
    key: "appointments",
    image: "/ia/illustrations/waiting-chairs.png",
    featured: false,
  },
  {
    key: "advisor",
    image: "/ia/illustrations/open-book.png",
    featured: false,
  },
] as const;

const AUDIENCES = ["student", "iskur", "academic"] as const;

const POINTS = ["first", "second", "third"] as const;

/**
 * The ODTÜ deployment's front page, built from the IA Revizyon screens and the menton v1.2 design system (ODTÜ
 * Primary mode): the plain header, a hero with the campus illustration, the student home's quick-action cards, one
 * card per role and the "ODTÜ ile giriş" banner. Teknokent's landing sells startup mentoring, which ODTÜ does not run.
 */
export function OdtuLandingPage() {
  const copy = useTranslations("odtuLanding");
  const destination = usePublicSessionDestination();
  const helpHref = `mailto:${SUPPORT_EMAIL}`;

  return (
    <div
      data-ia-accent={IaAccent.Odtu}
      className="flex min-h-screen flex-col bg-background-surface text-text-primary"
    >
      <header className="border-b border-border-subtle">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-4 sm:px-8 lg:px-20">
          <MentonWordmark />
          <nav
            aria-label={copy("navLabel")}
            className="flex items-center gap-4 type-label sm:gap-6"
          >
            {/* A plain link: the help address is a mailto, which next/link does not handle. */}
            <a
              href={helpHref}
              className="text-text-secondary hover:text-text-primary"
            >
              {copy("help")}
            </a>
            <Button href={destination.href} size={ButtonSize.Small}>
              {destination.label}
            </Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-20 px-4 pt-12 pb-20 sm:px-8 lg:gap-24 lg:px-20 lg:pt-20">
        <section
          aria-labelledby="odtu-landing-title"
          className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_440px]"
        >
          <div className="flex flex-col gap-6">
            <p className="type-overline text-text-accent">{copy("overline")}</p>
            <h1
              id="odtu-landing-title"
              className="type-h1 text-balance text-text-primary lg:type-display"
            >
              {copy("title")}
            </h1>
            <p className="max-w-[560px] type-body-lg text-text-secondary">
              {copy("intro")}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button href={destination.href} size={ButtonSize.Large}>
                {destination.label}
              </Button>
              {destination.signup ? (
                <Button
                  href={destination.signup.href}
                  variant={ButtonVariant.Ghost}
                  size={ButtonSize.Large}
                >
                  {copy("signupAction")}
                </Button>
              ) : null}
            </div>
            <p className="flex flex-wrap items-center gap-2 type-caption text-text-muted">
              <span className="rounded-full bg-brand-odtu-bg px-2.5 py-1 type-label-sm text-brand-odtu-primary">
                {copy("noSignupTag")}
              </span>
              {copy("noSignupText")}
            </p>
          </div>
          <div className="hidden justify-center rounded-featured border border-card-featured-border bg-card-featured-bg p-10 lg:flex">
            <Image
              src="/ia/illustrations/campus-flag.png"
              alt=""
              width={320}
              height={308}
              priority
            />
          </div>
        </section>

        <section aria-labelledby="odtu-landing-features" className="space-y-6">
          <h2 id="odtu-landing-features" className="type-h3">
            {copy("featuresTitle")}
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {FEATURES.map((feature) => (
              <li
                key={feature.key}
                className={`flex items-center gap-4 rounded-[20px] p-5 ${
                  feature.featured
                    ? "bg-brand-odtu-bg"
                    : "border border-border-default bg-background-surface"
                }`}
              >
                <Image
                  src={feature.image}
                  alt=""
                  width={88}
                  height={88}
                  className="size-[88px] shrink-0 object-contain"
                />
                <div className="flex min-w-0 flex-col gap-1">
                  <h3 className="type-title-card">
                    {copy(`features.${feature.key}.title`)}
                  </h3>
                  <p className="type-caption text-text-muted">
                    {copy(`features.${feature.key}.caption`)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="odtu-landing-audience" className="space-y-6">
          <h2 id="odtu-landing-audience" className="type-h3">
            {copy("audienceTitle")}
          </h2>
          <div className="grid gap-5 md:grid-cols-3">
            {AUDIENCES.map((audience) => (
              <article
                key={audience}
                aria-labelledby={`odtu-audience-${audience}`}
                className="flex flex-col gap-4 rounded-card border border-border-default bg-background-surface p-6"
              >
                <span className="w-fit rounded-full bg-brand-odtu-bg px-3 py-1 type-label-sm text-brand-odtu-primary">
                  {copy(`audience.${audience}.badge`)}
                </span>
                <h3
                  id={`odtu-audience-${audience}`}
                  className="type-h4 text-text-primary"
                >
                  {copy(`audience.${audience}.title`)}
                </h3>
                <span aria-hidden className="h-px bg-border-subtle" />
                <ul className="flex flex-col gap-3">
                  {POINTS.map((point) => (
                    <li
                      key={point}
                      className="flex items-center gap-2 type-body-sm text-text-primary"
                    >
                      <Image
                        src="/ia/icons/check.svg"
                        alt=""
                        width={14}
                        height={14}
                      />
                      {copy(`audience.${audience}.points.${point}`)}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="odtu-landing-banner"
          className="flex flex-col gap-4 rounded-2xl border border-border-subtle px-6 py-[22px] sm:flex-row sm:items-center sm:gap-5"
        >
          <Image
            src="/ia/odtu/odtu-logo.png"
            alt=""
            width={48}
            height={40}
            className="h-10 w-12 shrink-0 object-contain"
          />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id="odtu-landing-banner"
                className="text-[18px] font-semibold text-text-primary"
              >
                {copy("banner.title")}
              </h2>
              <span className="text-[11.5px] font-medium text-brand-odtu-primary">
                {copy("noSignupTag")}
              </span>
            </div>
            <p className="type-body-sm text-text-secondary">
              {copy("banner.text")}
            </p>
          </div>
          <Button href={destination.href}>{destination.label}</Button>
        </section>
      </main>

      <footer className="border-t border-border-subtle">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-6 type-caption text-text-muted sm:px-8 lg:px-20">
          <span>{copy("footer")}</span>
          <a href={helpHref} className="hover:text-text-primary">
            {SUPPORT_EMAIL}
          </a>
        </div>
      </footer>
    </div>
  );
}
