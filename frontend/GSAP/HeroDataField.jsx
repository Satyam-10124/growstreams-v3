"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { HERO_HEADLINE, HERO_FIELD_CARDS } from "../data/animations";
import styles from "./HeroDataField.module.css";

gsap.registerPlugin(ScrollTrigger);

function Corners() {
  return (
    <>
      <i className={`${styles.corner} ${styles.cTL}`} aria-hidden />
      <i className={`${styles.corner} ${styles.cTR}`} aria-hidden />
      <i className={`${styles.corner} ${styles.cBL}`} aria-hidden />
      <i className={`${styles.corner} ${styles.cBR}`} aria-hidden />
    </>
  );
}

function CardGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="2.5"
        y="5"
        width="19"
        height="14"
        rx="2.5"
        fill="currentColor"
        opacity="0.18"
      />
      <rect
        x="2.5"
        y="5"
        width="19"
        height="14"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path d="M2.5 9.5h19" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M5.75 14.5h4.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Card({ data }) {
  const { kind, x, y, depth, hideOnMobile } = data;

  return (
    <div
      className={`${styles.scroller} ${hideOnMobile ? styles.hideOnMobile : ""}`}
      data-scroll
      data-depth={depth}
      data-x={x}
      data-y={y}
    >
      <div className={styles.mouse} data-mouse>
        <div className={styles.floater} data-float>
          <div className={styles.card} data-card style={{ "--depth": depth }}>
            {kind === "meta" ? (
              <div className={styles.meta}>
                <Corners />
                <div className={styles.metaLabel}>
                  <svg className={styles.caret} viewBox="0 0 8 8" aria-hidden>
                    <path d="M0 0.5 L7 4 L0 7.5 Z" fill="currentColor" />
                  </svg>
                  {data.label}
                </div>
                <div className={styles.metaBody}>
                  {data.lines.map((l, idx) => (
                    <span key={`${l}-${idx}`}>{l}</span>
                  ))}
                </div>
              </div>
            ) : (
              <div className={styles.tx}>
                <span className={`${styles.txIcon} ${styles[data.tone]}`}>
                  <CardGlyph />
                </span>
                <span className={styles.txText}>
                  <span className={styles.txTitle}>{data.title}</span>
                  <span className={styles.txSub}>{data.sub}</span>
                </span>
                <span className={styles.txAmount}>{data.amount}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HeroDataField() {
  const root = useRef(null);

  useEffect(() => {
    const ctx = gsap.context((self) => {
      const q = self.selector;
      const scrollers = q("[data-scroll]");
      const words = q("[data-word]");
      const field = q("[data-field]")[0];

      const startZ = (el) => -(3500 + 2500 * Number(el.dataset.depth));

      const offset = (el, axis) => {
        const size = axis === "x" ? field.offsetWidth : field.offsetHeight;
        return ((Number(el.dataset[axis]) - 50) / 100) * size;
      };

      gsap.set(scrollers, { autoAlpha: 0 });

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(scrollers, {
          autoAlpha: 1,
          x: (i, el) => offset(el, "x"),
          y: (i, el) => offset(el, "y"),
          z: 0,
          filter: "none",
        });
        gsap.set(words, { yPercent: 0, opacity: 1 });
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(words, {
          yPercent: 110,
          opacity: 0,
          filter: "blur(6px)",
          duration: 0.9,
          stagger: 0.045,
          ease: "power3.out",
          clearProps: "filter",
        });

        const emerge = gsap.timeline({
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: "+=160%",
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
          },
        });

        emerge
          .fromTo(
            scrollers,
            {
              x: (i, el) => offset(el, "x"),
              y: (i, el) => offset(el, "y"),
              z: (i, el) => startZ(el),
            },
            {
              x: (i, el) => offset(el, "x"),
              y: (i, el) => offset(el, "y"),
              z: 0,
              ease: "none",
              duration: 1,
              stagger: { each: 0.04, from: "center", grid: "auto" },
            },
          )
          .fromTo(
            scrollers,
            { autoAlpha: 0, filter: "blur(10px)" },
            {
              autoAlpha: 1,
              filter: "blur(0px)",
              ease: "power1.out",
              duration: 0.45,
              stagger: { each: 0.04, from: "center", grid: "auto" },
            },
            0,
          )
          .to(
            q("[data-headline]"),
            { scale: 0.97, opacity: 0.72, ease: "none", duration: 1 },
            0,
          );

        q("[data-float]").forEach((el, i) => {
          const depth = Number(scrollers[i].dataset.depth) || 1;
          const amp = gsap.utils.mapRange(0.3, 1, 10, 26, depth);

          gsap.to(el, {
            y: gsap.utils.random(-amp, -amp * 0.45),
            x: gsap.utils.random(-amp * 0.5, amp * 0.5),
            rotation: gsap.utils.random(-0.7, 0.7),
            duration: gsap.utils.random(9, 16),
            delay: gsap.utils.random(0, 4),
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
          });
        });

        const setters = q("[data-mouse]").map((el, i) => ({
          depth: Number(scrollers[i].dataset.depth) || 1,
          x: gsap.quickTo(el, "x", { duration: 0.9, ease: "power3.out" }),
          y: gsap.quickTo(el, "y", { duration: 0.9, ease: "power3.out" }),
        }));

        const onMove = (e) => {
          const r = root.current.getBoundingClientRect();
          const nx = (e.clientX - r.left) / r.width - 0.5;
          const ny = (e.clientY - r.top) / r.height - 0.5;
          setters.forEach((s) => {
            s.x(nx * 44 * s.depth);
            s.y(ny * 30 * s.depth);
          });
        };
        const onLeave = () => setters.forEach((s) => (s.x(0), s.y(0)));

        const el = root.current;
        el.addEventListener("pointermove", onMove);
        el.addEventListener("pointerleave", onLeave);

        return () => {
          el.removeEventListener("pointermove", onMove);
          el.removeEventListener("pointerleave", onLeave);
        };
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <div>
      <section className={styles.hero} ref={root}>
        <div className={styles.panel} data-panel>
          <div className={styles.field} data-field aria-hidden>
            {HERO_FIELD_CARDS.map((c) => (
              <Card key={c.id} data={c} />
            ))}
          </div>

          <h1 className={styles.headline} data-headline>
            {HERO_HEADLINE.map((seg, si) => (
              <span key={si} className={seg.accent ? styles.accent : undefined}>
                {seg.text.split(" ").map((w, wi) => (
                  <span className={styles.word} key={`${si}-${wi}`}>
                    <span className={styles.wordInner} data-word>
                      {w}
                    </span>
                  </span>
                ))}
              </span>
            ))}
          </h1>
        </div>
      </section>
    </div>
  );
}
