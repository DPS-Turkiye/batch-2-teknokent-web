import { cx } from "@/components/landing/landing-styles";
import type { useLandingFaq } from "@/hooks/use-landing";
import { LANDING_FAQS } from "@/lib/const/landing";

export function LandingFaq({ faq }: { faq: ReturnType<typeof useLandingFaq> }) {
  return (
    <section id="sss" className={cx("faq-section")}>
      <div className={cx("wrap", "faq-grid")}>
        <div className={cx("faq-side")}>
          <div className={cx("eyebrow", "rv")}>SSS</div>
          <h2 className={cx("h2", "rvt")}>
            <span className={cx("mask")}>
              <span>Sıkça sorulan</span>
            </span>{" "}
            <span className={cx("mask")}>
              <span>sorular</span>
            </span>
          </h2>
          <p className={cx("lead", "rv")}>
            Aradığın cevabı bulamazsan program ekibine platform içinden
            ulaşabilirsin.
          </p>
        </div>
        <div className={cx("faq", "rv")}>
          {LANDING_FAQS.map((item, index) => {
            const open = faq.isOpen(index);
            return (
              <div key={item.question} className={cx("q", open && "open")}>
                <button
                  type="button"
                  id={`qb${index}`}
                  aria-expanded={open}
                  aria-controls={`qa${index}`}
                  onClick={() => faq.toggle(index)}
                >
                  <span>{item.question}</span>
                  <span className={cx("pm")} aria-hidden />
                </button>
                <div
                  className={cx("a")}
                  id={`qa${index}`}
                  role="region"
                  aria-labelledby={`qb${index}`}
                >
                  <div>
                    <p>{item.answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
