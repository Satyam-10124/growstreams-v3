"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ENRICHMENT_RAW,
  ENRICHMENT_FIELDS,
  ENRICHMENT_DETAILS,
  ENRICHMENT_HEADLINE,
  ENRICHMENT_LIVE_CELLS,
} from "../data/animations";
import styles from "./EnrichmentGrid.module.css";

gsap.registerPlugin(ScrollTrigger);

const GRID = 56;

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

function StreetMap() {
  const h = [8, 20, 31, 44, 57, 68, 79, 91];
  const v = [7, 18, 26, 37, 48, 59, 71, 83, 94];
  return (
    <svg
      className={styles.mapSvg}
      viewBox="0 0 100 60"
      preserveAspectRatio="none"
      aria-hidden
    >
      <rect width="100" height="60" fill="var(--map-bg)" />
      <g
        stroke="var(--map-line)"
        strokeWidth="0.5"
        vectorEffect="non-scaling-stroke"
      >
        {h.map((y) => (
          <line key={`h${y}`} x1="0" y1={y * 0.6} x2="100" y2={y * 0.6} />
        ))}
        {v.map((x) => (
          <line key={`v${x}`} x1={x} y1="0" x2={x} y2="60" />
        ))}
        <line x1="0" y1="14" x2="100" y2="46" strokeWidth="1.2" />
        <line x1="62" y1="0" x2="30" y2="60" />
      </g>
      <circle cx="48" cy="31" r="2.4" fill="var(--map-pin)" />
      <circle
        cx="48"
        cy="31"
        r="5.5"
        fill="none"
        stroke="var(--map-pin)"
        strokeWidth="0.6"
        opacity="0.5"
      />
    </svg>
  );
}

export default function EnrichmentGrid() {
  const root = useRef(null);
  const code = useRef(null);
  const amount = useRef(null);
  const latencyValue = useRef(null);
  const bars = useRef(null);

  useEffect(() => {
    const ctx = gsap.context((self) => {
      const q = self.selector;

      const paint = {
        code: (n) => {
          if (code.current)
            code.current.textContent = ENRICHMENT_RAW.slice(0, Math.round(n));
        },
        amount: (v) => {
          if (amount.current) amount.current.textContent = `−$${v.toFixed(2)}`;
        },
        latency: (v) => {
          const ms = Math.round(v);
          if (latencyValue.current)
            latencyValue.current.textContent = `${ms}MS`;
          if (bars.current) {
            const lit = Math.round((ms / 50) * 10);
            [...bars.current.children].forEach((b, i) => {
              b.dataset.lit = i < lit ? "true" : "false";
            });
          }
        },
      };

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: reduce)", () => {
        paint.code(ENRICHMENT_RAW.length);
        paint.amount(78.36);
        paint.latency(50);
        gsap.set(q("[data-block], [data-headline2], [data-detail]"), {
          autoAlpha: 1,
          y: 0,
        });
        gsap.set(q("[data-wire]"), { strokeDashoffset: 0, autoAlpha: 1 });
        gsap.set(q("[data-map]"), { scaleY: 1, autoAlpha: 1 });
      });

      mm.add(
        "(min-width: 1001px) and (prefers-reduced-motion: no-preference)",
        () => {
          q("[data-wire]").forEach((p) => {
            const len = p.getTotalLength();
            gsap.set(p, {
              strokeDasharray: len,
              strokeDashoffset: len,
              autoAlpha: 1,
            });
          });

          const counters = { chars: 0, amount: 0, latency: 0 };
          paint.code(0);
          paint.amount(0);
          paint.latency(0);

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: root.current,
              start: "top top",
              end: "+=260%",
              pin: true,
              scrub: 0.7,
              invalidateOnRefresh: true,
            },
          });

          tl.fromTo(
            q("[data-grid]"),
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: 0.1, ease: "none" },
            0,
          ).fromTo(
            q("[data-headline2]"),
            { autoAlpha: 0.18, y: 14 },
            { autoAlpha: 1, y: 0, duration: 0.18, ease: "power2.out" },
            0.02,
          );

          tl.fromTo(
            q("[data-window]"),
            { autoAlpha: 0, y: 18 },
            { autoAlpha: 1, y: 0, duration: 0.1, ease: "power2.out" },
            0.04,
          )
            .to(
              counters,
              {
                chars: ENRICHMENT_RAW.length,
                duration: 0.34,
                ease: "none",
                onUpdate: () => paint.code(counters.chars),
              },
              0.08,
            )
            .to(q("[data-caret]"), { autoAlpha: 0, duration: 0.02 }, 0.44);

          tl.to(
            q('[data-wire="key"]'),
            { strokeDashoffset: 0, duration: 0.08, ease: "none" },
            0.3,
          )
            .fromTo(
              q('[data-block="key"]'),
              { autoAlpha: 0, y: 16 },
              { autoAlpha: 1, y: 0, duration: 0.1, ease: "power2.out" },
              0.35,
            )
            .to(
              counters,
              {
                latency: 50,
                duration: 0.5,
                ease: "power1.in",
                onUpdate: () => paint.latency(counters.latency),
              },
              0.34,
            )
            .fromTo(
              q('[data-block="latency"]'),
              { autoAlpha: 0 },
              { autoAlpha: 1, duration: 0.06 },
              0.34,
            );

          tl.to(
            q('[data-wire="card"]'),
            { strokeDashoffset: 0, duration: 0.08, ease: "none" },
            0.44,
          )
            .fromTo(
              q('[data-block="card"]'),
              { autoAlpha: 0, y: 24 },
              { autoAlpha: 1, y: 0, duration: 0.12, ease: "power2.out" },
              0.48,
            )
            .to(
              counters,
              {
                amount: 78.36,
                duration: 0.16,
                ease: "power2.out",
                onUpdate: () => paint.amount(counters.amount),
              },
              0.5,
            )
            .fromTo(
              q("[data-map]"),
              { scaleY: 0, autoAlpha: 0 },
              { scaleY: 1, autoAlpha: 1, duration: 0.12, ease: "power2.out" },
              0.6,
            )
            .fromTo(
              q("[data-detail]"),
              { autoAlpha: 0, y: 8 },
              {
                autoAlpha: 1,
                y: 0,
                duration: 0.1,
                stagger: 0.03,
                ease: "power2.out",
              },
              0.66,
            );

          tl.to(
            q('[data-wire="fields"]'),
            { strokeDashoffset: 0, duration: 0.12, ease: "none" },
            0.6,
          );

          ENRICHMENT_FIELDS.forEach((b, i) => {
            tl.fromTo(
              q(`[data-block="${b.id}"]`),
              { autoAlpha: 0, x: 22 },
              { autoAlpha: 1, x: 0, duration: 0.12, ease: "power2.out" },
              0.64 + i * 0.08,
            );
          });

          q("[data-cell]").forEach((cell, i) => {
            gsap.to(cell, {
              opacity: gsap.utils.random(0.25, 0.7),
              duration: gsap.utils.random(2.5, 5),
              delay: i * 0.35,
              ease: "sine.inOut",
              repeat: -1,
              yoyo: true,
            });
          });
        },
      );

      mm.add(
        "(max-width: 1000px) and (prefers-reduced-motion: no-preference)",
        () => {
          paint.code(ENRICHMENT_RAW.length);
          paint.amount(78.36);
          paint.latency(50);
          gsap.set(q("[data-caret]"), { autoAlpha: 0 });
          gsap.set(q("[data-map]"), { scaleY: 1, autoAlpha: 1 });

          gsap.utils
            .toArray(q("[data-block], [data-headline2]"))
            .forEach((el) => {
              gsap.fromTo(
                el,
                { autoAlpha: 0, y: 20 },
                {
                  autoAlpha: 1,
                  y: 0,
                  duration: 0.6,
                  ease: "power2.out",
                  scrollTrigger: { trigger: el, start: "top 88%" },
                },
              );
            });
        },
      );
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <div>
      <section className={styles.section} ref={root}>
        <div className={styles.grid} data-grid aria-hidden>
          {ENRICHMENT_LIVE_CELLS.map(([cx, cy]) => (
            <span
              key={`${cx}-${cy}`}
              className={styles.cell}
              data-cell
              style={{
                left: cx * GRID,
                top: cy * GRID,
                width: GRID,
                height: GRID,
              }}
            />
          ))}
        </div>

        <div className={styles.stage}>
          <svg
            className={styles.wires}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden
          >
            <g
              fill="none"
              stroke="var(--wire)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            >
              <path data-wire="key" d="M15.5 36 L15.5 66" />
              <path data-wire="card" d="M29 80 L72 80" />
              <path data-wire="fields" d="M85 52 L85 45" />
            </g>
          </svg>

          {/* Raw payload */}
          <div
            className={`${styles.window} ${styles.atWindow}`}
            data-window
            data-block="window"
          >
            <Corners />
            <div className={styles.windowInner}>
              <div className={styles.titlebar}>
                <span className={styles.dots}>
                  <i />
                  <i />
                  <i />
                </span>
                <span className={styles.tools}>
                  <span className={styles.pill}>cURL</span>
                  <svg viewBox="0 0 20 20" fill="none" aria-hidden>
                    <rect
                      x="6.5"
                      y="6.5"
                      width="9"
                      height="9"
                      rx="2"
                      stroke="currentColor"
                      strokeWidth="1.4"
                    />
                    <path
                      d="M13.5 4.5H5.5a1 1 0 0 0-1 1v8"
                      stroke="currentColor"
                      strokeWidth="1.4"
                    />
                  </svg>
                </span>
              </div>
              <div className={styles.codeWrap}>
                <pre className={styles.code}>
                  <code ref={code} />
                  <span className={styles.caret} data-caret />
                </pre>
              </div>
            </div>
          </div>

          {/* API Key */}
          <div className={`${styles.window} ${styles.atKey}`} data-block="key">
            <Corners />
            <div className={styles.windowInner}>
              <div className={styles.keyLabel}>[API KEY]</div>
              <div className={styles.keyValue}>
                {process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "YOUR_API_KEY_HERE"}
              </div>
            </div>
          </div>

          {/* Latency */}
          <div
            className={`${styles.latency} ${styles.atLatency}`}
            data-block="latency"
          >
            <span className={styles.latencyLabel}>Latency</span>
            <span className={styles.bars} ref={bars}>
              {Array.from({ length: 10 }).map((_, i) => (
                <i key={i} data-lit="false" />
              ))}
            </span>
            <span className={styles.latencyValue} ref={latencyValue}>
              0MS
            </span>
          </div>

          {/* Enriched transaction */}
          <div
            className={`${styles.receipt} ${styles.atCard}`}
            data-block="card"
          >
            <div className={styles.cardTop}>
              <span className={styles.mark}>
                <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M4 9.5 12 4l8 5.5V20H4V9.5Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9.5 20v-6h5v6"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <div className={styles.cardFoot}>
                <span className={styles.cardName}>
                  Vara Stream Settlement
                  <span className={styles.cardWhen}>2026-08-20 00:30:15</span>
                </span>
                <span className={styles.cardAmount} ref={amount}>
                  −$0.00
                </span>
              </div>
            </div>

            <div className={styles.map} data-map>
              <StreetMap />
            </div>

            <dl className={styles.details}>
              {ENRICHMENT_DETAILS.map(([k, v]) => (
                <div className={styles.detail} data-detail key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Fields */}
          {ENRICHMENT_FIELDS.map((b, i) => (
            <div
              key={b.id}
              className={`${styles.field} ${styles[`atField${i}`]}`}
              data-block={b.id}
            >
              <Corners />
              <div className={styles.fieldLabel}>
                <svg
                  className={styles.caretGlyph}
                  viewBox="0 0 8 8"
                  aria-hidden
                >
                  <path d="M0 0.5 L7 4 L0 7.5 Z" fill="currentColor" />
                </svg>
                {b.label}
              </div>
              <div className={styles.fieldBody}>
                {b.lines.map((l) => (
                  <span key={l}>{l}</span>
                ))}
              </div>
            </div>
          ))}

          <div className={styles.headlineWrap}>
            <h2 className={styles.headline} data-headline2>
              {ENRICHMENT_HEADLINE}
            </h2>
          </div>
        </div>
      </section>
    </div>
  );
}
