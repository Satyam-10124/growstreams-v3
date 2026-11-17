import React from "react";
import Link from "next/link";
import { HERO_CONTENT } from "../data/hero";

function RulerSide({ side }: { side: "left" | "right" }) {
  const isRight = side === "right";
  const items = Array.from({ length: 20 }, (_, i) => i);

  return (
    <div
      className={`absolute top-2 bottom-0 flex w-4.5 flex-col space-y-7 overflow-y-clip ${
        isRight ? "right-0 items-end" : "left-0"
      } max-lg:hidden`}
      aria-hidden={true}
    >
      {items.map((i) => (
        <React.Fragment key={i}>
          <div className="h-px shrink-0 w-4.5 bg-black" />
          <div className="h-px shrink-0 w-2.5 bg-black" />
          <div className="h-px shrink-0 w-2.5 bg-black" />
          <div className="h-px shrink-0 w-2.5 bg-black" />
          <div className="h-px shrink-0 w-2.5 bg-black" />
        </React.Fragment>
      ))}
    </div>
  );
}

function ArrowPointers() {
  return (
    <div className="pointer-events-none sticky inset-x-0 top-[calc(50%-0.6875rem)] z-10 flex justify-between max-lg:hidden">
      <div className="w-5.5 text-black -ml-8">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="100%"
          viewBox="0 0 22 16"
          fill="none"
        >
          <path
            d="M2.0326 15.6442L5.93597e-07 13.5799L9.02336e-08 2.0643L2.0326 -8.88478e-08L21.48 7.27606L21.48 8.36816L2.0326 15.6442Z"
            fill="currentColor"
          />
        </svg>
      </div>
      <div className="w-5.5 rotate-180 text-black -mr-8">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="100%"
          viewBox="0 0 22 16"
          fill="none"
        >
          <path
            d="M2.0326 15.6442L5.93597e-07 13.5799L9.02336e-08 2.0643L2.0326 -8.88478e-08L21.48 7.27606L21.48 8.36816L2.0326 15.6442Z"
            fill="currentColor"
          />
        </svg>
      </div>
    </div>
  );
}

function CutCorners() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 m-0!">
      <div
        className="cut-corner absolute bg-white"
        style={{
          top: "-1px",
          left: "-1px",
          clipPath: "polygon(0 0, 100% 0, 0 100%)",
          width: "1px",
          height: "1px",
        }}
      />
      <div
        className="cut-corner absolute bg-white"
        style={{
          top: "-1px",
          right: "-1px",
          clipPath: "polygon(0 0, 100% 0, 100% 100%)",
          width: "1px",
          height: "1px",
        }}
      />
      <div
        className="cut-corner absolute bg-white"
        style={{
          bottom: "-1px",
          left: "-1px",
          clipPath: "polygon(0 0, 0 100%, 100% 100%)",
          width: "1px",
          height: "1px",
        }}
      />
      <div
        className="cut-corner absolute bg-white"
        style={{
          bottom: "-1px",
          right: "-1px",
          clipPath: "polygon(100% 0, 0 100%, 100% 100%)",
          width: "1px",
          height: "1px",
        }}
      />
    </div>
  );
}

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-white text-black pt-0 pb-0 px-5 lg:px-8">
      <RulerSide side="left" />
      <RulerSide side="right" />
      <ArrowPointers />

      <div className="lg:-mt-[1.375rem]">
        <div
          className="relative bg-sage-1 py-14 max-md:-mx-5 md:py-20 lg:pt-26 lg:pb-26 xl:pb-32"
          style={
            {
              "--corner-size-mobile": "1px",
              "--corner-size-desktop": "17px",
            } as React.CSSProperties
          }
        >
          <CutCorners />

          <div className="mx-auto flex w-full max-w-[66.75rem] flex-col items-center px-5 text-center lg:px-12">
            <h1 className="text-84px-heading">{HERO_CONTENT.headline}</h1>

            {/* Visual Canvas Scene scaled 20% smaller on mobile */}
            <div
              className="relative w-full shrink-0 max-sm:scale-[0.80] max-sm:origin-center max-sm:-my-4"
              style={{ aspectRatio: "900/435" }}
            >
              <div className="relative size-full">
                <img
                  alt="GrowStreams live preview"
                  loading="lazy"
                  decoding="async"
                  width={900}
                  height={435}
                  className="hero-scene-layers pointer-events-none"
                  style={{ color: "transparent" }}
                  src={HERO_CONTENT.sceneImage}
                />
              </div>
              <div className="absolute inset-0 size-full" style={{ zIndex: 2 }}>
                <img
                  alt="Mark decoration"
                  loading="lazy"
                  width={230}
                  height={443}
                  decoding="async"
                  className="hero-mark-overlay pointer-events-none"
                  style={{ color: "transparent" }}
                  src={HERO_CONTENT.markOverlayImage}
                />
              </div>
            </div>

            <div className="prose mt-6 w-full max-w-[27.75rem] opacity-80">
              <p>{HERO_CONTENT.subheadline}</p>
            </div>

            <div className="flex items-center gap-x-5 mt-6 sm:mt-7">
              <Link className="inline-block" href={HERO_CONTENT.cta.href}>
                <div className="group relative inline-flex appearance-none items-center py-2.5 select-none transition-[color] justify-center text-lemongrass min-h-10.75 px-4.5">
                  <span className="absolute inset-0 rounded-md transition-[background-color,border-color,transform,scale] group-hover:scale-[0.98] origin-center bg-forest group-hover:bg-forest/90" />
                  <span className="text-15px-btn relative z-10">
                    {HERO_CONTENT.cta.label}
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
