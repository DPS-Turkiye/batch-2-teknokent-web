"use client";

import Link from "next/link";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { useLandingPage } from "@/hooks/use-landing-page";
import type {
  LandingFaq,
  LandingTraining,
  LandingTrainingCategory,
} from "@/types/landing";

function SectionHeading({
  kicker,
  title,
  description,
}: {
  kicker: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
        {kicker}
      </p>
      <h2 className="mt-3 text-2xl font-medium tracking-tight sm:text-3xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 text-sm leading-6 text-zinc-600">{description}</p>
      ) : null}
    </div>
  );
}

function TrainingCategoryFilters({
  categories,
  active,
  onSelect,
}: {
  categories: readonly LandingTrainingCategory[];
  active: LandingTrainingCategory;
  onSelect: (category: LandingTrainingCategory) => void;
}) {
  return (
    <div
      className="mt-7 flex gap-2 overflow-x-auto pb-2"
      aria-label="Eğitim kategorileri"
    >
      {categories.map((category) => (
        <button
          key={category}
          type="button"
          onClick={() => onSelect(category)}
          aria-pressed={active === category}
          className={`shrink-0 border px-3 py-2 text-[10px] ${
            active === category
              ? "border-black bg-black text-white"
              : "border-zinc-300 bg-white hover:bg-zinc-100"
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  );
}

function TrainingList({ trainings }: { trainings: LandingTraining[] }) {
  if (trainings.length === 0) {
    return (
      <div className="mt-7 grid gap-4 md:grid-cols-2">
        <p className="border border-dashed border-zinc-300 p-8 text-sm text-zinc-500 md:col-span-2">
          Bu kategori için yayınlanmış eğitim bulunmuyor.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-7 grid gap-4 md:grid-cols-2">
      {trainings.map((training) => (
        <article
          key={training.title}
          className="border border-zinc-300 p-5 sm:p-6"
        >
          <div className="flex items-start justify-between gap-4 text-[9px] uppercase tracking-[0.12em] text-zinc-500">
            <span>{training.category}</span>
            <span className="border border-zinc-300 px-2 py-1 normal-case tracking-normal">
              {training.format}
            </span>
          </div>
          <h3 className="mt-5 text-lg font-medium">{training.title}</h3>
          <p className="mt-2 text-xs text-zinc-500">{training.trainer}</p>
          <p className="mt-5 border-t border-zinc-200 pt-4 text-[10px] text-zinc-500">
            {training.detail}
          </p>
          <a
            href="#"
            className="mt-4 inline-block text-xs font-medium underline underline-offset-4"
          >
            Eğitimi incele →
          </a>
        </article>
      ))}
    </div>
  );
}

function FaqList({ faqs }: { faqs: LandingFaq[] }) {
  return (
    <div className="mt-8 border-t border-zinc-300">
      {faqs.map((faq) => (
        <details key={faq.question} className="group border-b border-zinc-300">
          <summary className="flex cursor-pointer items-center justify-between gap-6 py-5 text-sm font-medium">
            {faq.question}
            <span
              aria-hidden="true"
              className="text-lg font-light group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <p className="max-w-3xl pb-5 text-xs leading-5 text-zinc-600">
            {faq.answer}
          </p>
        </details>
      ))}
    </div>
  );
}

export default function Home() {
  const {
    announcements,
    mentorSteps,
    programs,
    trainingCategories,
    faqs,
    trainingFilter,
    setTrainingFilter,
    visibleTrainings,
  } = useLandingPage();

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />

      <main>
        <section className="border-b border-zinc-200">
          <div className="mx-auto grid max-w-[1180px] items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:px-8 lg:py-24">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                ODTÜ Teknokent
              </p>
              <h1 className="mt-5 max-w-xl text-4xl font-medium leading-[1.08] tracking-[-0.035em] sm:text-5xl lg:text-[58px]">
                Girişiminiz için doğru desteğe, doğru zamanda ulaşın
              </h1>
              <p className="mt-6 max-w-xl text-sm leading-6 text-zinc-600 sm:text-base">
                ODTÜ Teknokent programlarını, mentorluk görüşmelerini,
                eğitimleri ve girişiminizin ilerleme sürecini tek bir platform
                üzerinden takip edin.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/login"
                  className="border border-black bg-black px-5 py-3 text-center text-xs font-medium text-white hover:bg-zinc-800"
                >
                  Giriş Yap
                </Link>
                <a
                  href="#programlar"
                  className="border border-zinc-500 px-5 py-3 text-center text-xs font-medium hover:bg-zinc-100"
                >
                  Programları İncele
                </a>
              </div>
              <p className="mt-5 text-[10px] leading-4 text-zinc-500">
                Platforma yalnızca davet edildiğiniz veya kayıtlı olduğunuz rol
                ile giriş yapabilirsiniz.
              </p>
            </div>

            <div
              aria-label="Platform tanıtım görseli için wireframe alanı"
              className="wire-image min-w-0 aspect-[4/3] min-h-56 border border-zinc-300 sm:min-h-72"
              role="img"
            />
          </div>
        </section>

        <section
          id="duyurular"
          className="border-b border-zinc-200 py-16 sm:py-20"
        >
          <div className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-8">
            <SectionHeading
              kicker="Duyurular"
              title="Güncel gelişmeler"
              description="Programlar, eğitimler ve etkinliklerle ilgili son gelişmeleri takip edin."
            />
            <div className="mt-9 grid gap-5 md:grid-cols-3">
              {announcements.map((announcement) => (
                <article
                  key={announcement.title}
                  className="border border-zinc-300 bg-white"
                >
                  <div
                    aria-hidden="true"
                    className="wire-image aspect-[16/9] border-b border-zinc-300"
                  />
                  <div className="p-5">
                    <div className="flex items-center justify-between gap-3 text-[9px] uppercase tracking-[0.12em] text-zinc-500">
                      <span>{announcement.category}</span>
                      <time>{announcement.date}</time>
                    </div>
                    <h3 className="mt-4 text-lg font-medium">
                      {announcement.title}
                    </h3>
                    <p className="mt-2 text-xs leading-5 text-zinc-600">
                      {announcement.description}
                    </p>
                    <a
                      href="#"
                      className="mt-5 inline-block text-xs font-medium underline underline-offset-4"
                    >
                      Detayları görüntüle →
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="mentorluk"
          className="border-b border-zinc-200 py-16 sm:py-20"
        >
          <div className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-8">
            <SectionHeading
              kicker="Mentorluk"
              title="Mentorluk süreci nasıl işler?"
              description="Mentorluk, girişiminizin karşılaştığı problemleri deneyimli kişilerle değerlendirmenizi ve sonraki adımlarınızı netleştirmenizi sağlar."
            />
            <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {mentorSteps.map((step) => (
                <li key={step.number} className="border-t border-zinc-400 pt-5">
                  <span className="text-2xl font-light text-zinc-400">
                    {step.number}
                  </span>
                  <h3 className="mt-5 text-sm font-semibold">{step.title}</h3>
                  <p className="mt-2 text-xs leading-5 text-zinc-600">
                    {step.text}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-b border-zinc-200 py-16 sm:py-20">
          <div className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-8">
            <SectionHeading
              kicker="Karşılaştırma"
              title="Mentorluk ve eğitim arasındaki fark nedir?"
            />
            <div className="mt-9 grid max-w-4xl gap-4 md:grid-cols-2">
              <article className="border border-black p-6 sm:p-8">
                <h3 className="text-xl font-medium">Mentorluk</h3>
                <p className="mt-3 text-xs leading-5 text-zinc-600">
                  Girişimin mevcut durumuna ve ihtiyacına göre şekillenen,
                  bireysel veya ekip odaklı destek sürecidir.
                </p>
                <ul className="mt-6 space-y-2 text-xs">
                  <li>✓ Girişime özel ilerler</li>
                  <li>✓ Problem ve karar odaklıdır</li>
                  <li>✓ Birebir veya küçük ekip görüşmesi</li>
                  <li>✓ Görüşme sonunda aksiyonlar oluşturulabilir</li>
                </ul>
              </article>
              <article className="border border-zinc-300 p-6 sm:p-8">
                <h3 className="text-xl font-medium">Eğitim</h3>
                <p className="mt-3 text-xs leading-5 text-zinc-600">
                  Belirli bir konuda bilgi ve beceri kazandırmak için hazırlanan
                  yapılandırılmış içeriklerden oluşur.
                </p>
                <ul className="mt-6 space-y-2 text-xs">
                  <li>✓ Belirli bir konuya odaklanır</li>
                  <li>✓ Bireysel veya grup olarak düzenlenebilir</li>
                  <li>✓ Online veya yüz yüze gerçekleştirilebilir</li>
                  <li>✓ Ödev ve eğitim materyalleri içerebilir</li>
                </ul>
              </article>
            </div>
            <a
              href="#programlar"
              className="mt-5 inline-block text-xs underline underline-offset-4"
            >
              Hangi desteğe ihtiyacım olduğunu nasıl anlarım? →
            </a>
          </div>
        </section>

        <section
          id="programlar"
          className="border-b border-zinc-200 bg-zinc-50 py-16 sm:py-20"
        >
          <div className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-8">
            <SectionHeading
              kicker="Programlar"
              title="Programlar ve etkinlikler"
              description="Girişiminizin aşamasına ve ihtiyacına uygun programları keşfedin."
            />
            <div className="mt-9 grid gap-4 lg:grid-cols-3">
              {programs.map((program) => (
                <article
                  key={program.title}
                  className="flex min-h-64 flex-col border border-zinc-300 bg-white p-6"
                >
                  <div className="flex items-start justify-between gap-4 text-[9px] uppercase tracking-[0.12em] text-zinc-500">
                    <span>{program.type}</span>
                    <span className="border border-zinc-300 px-2 py-1 normal-case tracking-normal">
                      {program.status}
                    </span>
                  </div>
                  <h3 className="mt-7 text-xl font-medium">{program.title}</h3>
                  <p className="mt-3 text-xs leading-5 text-zinc-600">
                    {program.text}
                  </p>
                  <p className="mt-auto border-t border-zinc-200 pt-5 text-[10px] text-zinc-500">
                    {program.date}
                  </p>
                  <a
                    href="#"
                    className="mt-4 text-xs font-medium underline underline-offset-4"
                  >
                    Programı incele →
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="egitimler"
          className="border-b border-zinc-200 py-16 sm:py-20"
        >
          <div className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-8">
            <SectionHeading
              kicker="Eğitimler"
              title="Girişiminizin ihtiyaç duyduğu konular"
              description="Gelişiminizi destekleyen eğitimleri konu, tarih ve formata göre inceleyin."
            />
            <TrainingCategoryFilters
              categories={trainingCategories}
              active={trainingFilter}
              onSelect={setTrainingFilter}
            />
            <TrainingList trainings={visibleTrainings} />
          </div>
        </section>

        <section
          id="sss"
          className="border-b border-zinc-200 bg-zinc-50 py-16 sm:py-20"
        >
          <div className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-8">
            <SectionHeading kicker="SSS" title="Sıkça sorulan sorular" />
            <FaqList faqs={faqs} />
          </div>
        </section>

        <section className="py-20 text-center sm:py-28">
          <div className="mx-auto max-w-2xl px-4 sm:px-6">
            <h2 className="display-serif text-3xl leading-tight sm:text-5xl">
              Programınıza ve çalışma alanınıza erişin
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-sm leading-6 text-zinc-600">
              Mentorluk görüşmelerinizi, eğitimlerinizi ve girişim sürecinizi
              tek bir yerden takip edin.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/login"
                className="border border-black bg-black px-5 py-3 text-xs font-medium text-white"
              >
                Giriş Yap
              </Link>
              <a
                href="#programlar"
                className="border border-zinc-500 px-5 py-3 text-xs font-medium"
              >
                Programları İncele
              </a>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
