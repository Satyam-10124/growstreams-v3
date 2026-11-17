"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { REWARDS_CONTENT } from "../data/animations";
import styles from "./RewardsSection.module.css";

gsap.registerPlugin(ScrollTrigger);

function Heart({ className, ...rest }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden {...rest}>
      <path
        d="M12 20.5S3.5 15.2 3.5 9.4A4.6 4.6 0 0 1 12 6.9a4.6 4.6 0 0 1 8.5 2.5c0 5.8-8.5 11.1-8.5 11.1Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function RewardsSection() {
  const root = useRef(null);

  useEffect(() => {
    const ctx = gsap.context((self) => {
      const q = self.selector;

      const mm = gsap.matchMedia();

      const setAmount = (el, v) => {
        el.textContent = `−$${v.toFixed(2)}`;
      };
      const setPoints = (el, v) => {
        el.textContent = `+${Math.round(v)} VARA`;
      };

      mm.add("(prefers-reduced-motion: reduce)", () => {
        q("[data-amount]").forEach((el) =>
          setAmount(el, Number(el.dataset.amount)),
        );
        q("[data-points]").forEach((el) =>
          setPoints(el, Number(el.dataset.points)),
        );
        gsap.set(
          q(
            "[data-lead], [data-txn], [data-txn-name], [data-reward], [data-criteria], [data-criteria-inner], [data-heart], [data-guides]",
          ),
          { autoAlpha: 1, y: 0, scale: 1, scaleY: 1 },
        );
        gsap.set(q("[data-highlight]"), { scaleX: 1 });
        gsap.set(q("[data-link]"), { strokeDashoffset: 0 });
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(q("[data-lead]"), {
          autoAlpha: 0,
          y: 22,
          duration: 0.7,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: {
            trigger: q("[data-lead]")[0],
            start: "top 82%",
            once: true,
          },
        });

        const link = q("[data-link]")[0];
        if (link) {
          const len = link.getTotalLength();
          gsap.set(link, { strokeDasharray: len, strokeDashoffset: len });
        }

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: q("[data-board]")[0],
            start: "top 88%",
            end: "top 22%",
            scrub: 0.6,
          },
          defaults: { ease: "power2.out" },
        });

        tl.from(q("[data-guides]"), { autoAlpha: 0, duration: 0.12 }, 0)
          .from(
            q("[data-criteria]"),
            { scaleY: 0.04, autoAlpha: 0, duration: 0.12 },
            0.03,
          )
          .from(
            q("[data-criteria-inner]"),
            { autoAlpha: 0, y: 6, duration: 0.08 },
            0.13,
          )
          .to(link, { strokeDashoffset: 0, duration: 0.1, ease: "none" }, 0.18)
          .from(
            q("[data-txn]"),
            { autoAlpha: 0, y: 26, duration: 0.16, stagger: 0.05 },
            0.2,
          )
          .from(
            q("[data-txn-name]"),
            { autoAlpha: 0, duration: 0.12, stagger: 0.05 },
            0.34,
          )
          .from(
            q("[data-reward]"),
            { autoAlpha: 0, y: 12, duration: 0.14, stagger: 0.05 },
            0.5,
          )
          .from(
            q("[data-highlight]"),
            { scaleX: 0, duration: 0.16, ease: "power2.inOut" },
            0.56,
          )
          .from(
            q("[data-heart]"),
            {
              autoAlpha: 0,
              scale: 0,
              duration: 0.14,
              stagger: 0.05,
              ease: "back.out(2.2)",
            },
            0.6,
          );

        q("[data-amount]").forEach((el, i) => {
          const target = Number(el.dataset.amount);
          const c = { v: 0 };
          setAmount(el, 0);
          tl.to(
            c,
            {
              v: target,
              duration: 0.3,
              ease: "power2.out",
              onUpdate: () => setAmount(el, c.v),
            },
            0.22 + i * 0.05,
          );
        });

        q("[data-points]").forEach((el, i) => {
          const target = Number(el.dataset.points);
          const c = { v: 0 };
          setPoints(el, 0);
          tl.to(
            c,
            {
              v: target,
              duration: 0.34,
              ease: "power2.out",
              onUpdate: () => setPoints(el, c.v),
            },
            0.62 + i * 0.05,
          );
        });
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <div>
      <section className={styles.section} ref={root}>
        <header className={styles.lead}>
          <p className={styles.eyebrow} data-lead>
            <span className={styles.eyebrowMark}>
              <Heart className={styles.eyebrowHeart} />
            </span>
            {REWARDS_CONTENT.eyebrow}
          </p>
          <h2 className={styles.title} data-lead>
            {REWARDS_CONTENT.headline}
          </h2>
          <p className={styles.body} data-lead>
            {REWARDS_CONTENT.body}
          </p>
          <a className={styles.cta} href={REWARDS_CONTENT.ctaHref} data-lead>
            {REWARDS_CONTENT.ctaText}
          </a>
        </header>

        <div className={styles.board} data-board>
          <svg className={styles.guides} data-guides aria-hidden>
            {REWARDS_CONTENT.vGuides.map((x) => (
              <line key={`v${x}`} x1={x} y1="0" x2={x} y2="100%" />
            ))}
            {REWARDS_CONTENT.hGuides.map((y) => (
              <line key={`h${y}`} x1="0" y1={y} x2="100%" y2={y} />
            ))}
          </svg>

          <div className={styles.criteriaSlot}>
            <div className={styles.criteria} data-criteria>
              <div className={styles.criteriaInner} data-criteria-inner>
                <div>
                  <p className={styles.criteriaTitle}>
                    {REWARDS_CONTENT.criteriaTitle}
                  </p>
                  <p className={styles.criteriaText}>
                    {REWARDS_CONTENT.criteriaText}
                  </p>
                </div>
                <Heart className={styles.criteriaHeart} />
              </div>
            </div>
          </div>

          <svg className={styles.linkWrap} aria-hidden>
            <line
              data-link
              x1="50%"
              y1="0"
              x2="50%"
              y2="100%"
              stroke="var(--rule)"
              strokeWidth="1"
            />
          </svg>

          <div className={styles.cols}>
            {REWARDS_CONTENT.transactions.map((t) => (
              <div className={styles.col} key={t.id}>
                <div className={styles.txn} data-txn>
                  <span className={`${styles.logo} ${styles[t.tone]}`}>
                    {t.monogram}
                  </span>
                  <div className={styles.txnFoot}>
                    <span className={styles.txnName} data-txn-name>
                      {t.name}
                      <span className={styles.txnWhen}>{t.when}</span>
                    </span>
                    <span className={styles.txnAmount} data-amount={t.amount}>
                      −$0.00
                    </span>
                  </div>
                </div>

                <div
                  className={`${styles.reward} ${t.matched ? styles.matched : ""}`}
                  data-reward
                >
                  {t.matched && (
                    <span className={styles.highlight} data-highlight />
                  )}
                  <span className={styles.rewardLabel}>
                    <Heart className={styles.rewardHeart} data-heart />
                    Tokens
                  </span>
                  <span className={styles.points} data-points={t.points}>
                    +0 VARA
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
