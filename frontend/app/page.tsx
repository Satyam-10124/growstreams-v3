import { HomeMiddleSections } from "@/components/blume/HomeMiddleSections";
﻿export default function Page() {
  return (
    <>
      <style>{`
        astro-island,astro-slot,astro-static-slot{display:contents}
        .sidecar-hero-primary svg, .sidecar-conclusion__cta svg { display: none !important; }
        .sidecar-hero-primary a span:nth-child(3), .sidecar-conclusion__cta a span:nth-child(3) { display: none !important; }
        .sidecar-hero-primary a, .sidecar-conclusion__cta a { padding-left: 24px !important; padding-right: 24px !important; }
        .sidecar-hero-primary .text-\\[12px\\], .sidecar-conclusion__cta .text-\\[12px\\] { display: none !important; }

        /* Sync hero background fade with the new dark section (ink: #0c1a17) */
        .sidecar-hero-overlay-bottom[data-astro-cid-sc5xoz2y] {
          height: 120px !important;
          background-image: linear-gradient(to bottom, transparent, rgba(12,26,23,0.5) 40%, #0c1a17 100%) !important;
        }
        @media(min-width:768px) {
          .sidecar-hero[data-astro-cid-sc5xoz2y] {
            background: linear-gradient(to bottom, transparent 0 calc(100svh - 96px), #0c1a17 calc(100svh - 8px) 100%), #0484e8 !important;
          }
        }
      `}</style>

      <div
        className={"floating-island"}
        aria-hidden={"true"}
        data-floating-island={""}
        data-astro-cid-nghsr54r={""}
      >
        <div className={"floating-island__inner"} data-astro-cid-nghsr54r={""}>
          <span className={"floating-island__text"} data-astro-cid-nghsr54r={""}>
            {"GrowStreams"}
          </span>
          <div className={"floating-island__cta"} data-astro-cid-nghsr54r={""} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <a
              href="/app"
              style={{
                display: 'inline-flex', alignItems: 'center', padding: '8px 18px',
                background: '#10b981', color: '#000', borderRadius: '999px',
                fontWeight: 700, fontSize: '13px', textDecoration: 'none',
                whiteSpace: 'nowrap', transition: 'background 0.2s',
              }}
            >
              Launch App
            </a>
            <a
              href="/agents"
              style={{
                display: 'inline-flex', alignItems: 'center', padding: '8px 18px',
                background: 'transparent', color: '#10b981',
                border: '1px solid rgba(16,185,129,0.4)',
                borderRadius: '999px', fontWeight: 700, fontSize: '13px',
                textDecoration: 'none', whiteSpace: 'nowrap', transition: 'all 0.2s',
              }}
            >
              Stonk on Vara & AI Squads
            </a>
            <a
              href="/protocol-overview"
              style={{
                display: 'inline-flex', alignItems: 'center', padding: '8px 18px',
                background: 'rgba(56,189,248,0.15)', color: '#38bdf8',
                border: '1px solid rgba(56,189,248,0.45)',
                borderRadius: '999px', fontWeight: 700, fontSize: '13px',
                textDecoration: 'none', whiteSpace: 'nowrap', transition: 'all 0.2s',
              }}
            >
              DeFiLlama #1 Stats
            </a>
          </div>
        </div>
      </div>
      <section className={"sidecar-hero"} data-astro-cid-sc5xoz2y={""}>
        <div
          className={"sidecar-hero-layers"}
          aria-hidden={"true"}
          data-astro-cid-sc5xoz2y={""}
        >
          <div
            className={"parallax-layer parallax-layer--ff-sky"}
            data-parallax-layer={""}
            data-speed={"0.015"}
            data-scale={"1.02"}
            data-astro-cid-sc5xoz2y={""}
          />
          <div
            className={"parallax-layer parallax-layer--ff-far-blue"}
            data-parallax-layer={""}
            data-speed={"0.04"}
            data-scale={"1.025"}
            data-astro-cid-sc5xoz2y={""}
          />
          <div
            className={"parallax-layer parallax-layer--ff-cliff-lookout"}
            data-parallax-layer={""}
            data-speed={"0.08"}
            data-scale={"1.03"}
            data-astro-cid-sc5xoz2y={""}
          />
          <div
            className={"parallax-layer parallax-layer--ff-mid-flower-hills"}
            data-parallax-layer={""}
            data-speed={"0.12"}
            data-scale={"1.035"}
            data-astro-cid-sc5xoz2y={""}
          />
          <div
            className={"parallax-layer parallax-layer--ff-near-flower-slopes"}
            data-parallax-layer={""}
            data-speed={"0.24"}
            data-scale={"1.045"}
            data-astro-cid-sc5xoz2y={""}
          />
          <div
            className={
              "parallax-layer parallax-layer--ff-mid-foreground-flowers"
            }
            data-parallax-layer={""}
            data-speed={"0.32"}
            data-scale={"1.055"}
            data-astro-cid-sc5xoz2y={""}
          />
          <div
            className={"parallax-layer parallax-layer--ff-front-flowers"}
            data-parallax-layer={""}
            data-speed={"0.42"}
            data-scale={"1.065"}
            data-astro-cid-sc5xoz2y={""}
          />
        </div>
        <div
          className={"sidecar-hero-overlay-top"}
          aria-hidden={"true"}
          data-astro-cid-sc5xoz2y={""}
        />
        <div
          className={"sidecar-hero-overlay-bottom"}
          aria-hidden={"true"}
          data-astro-cid-sc5xoz2y={""}
        />
        <div className={"sidecar-hero-content"} data-astro-cid-sc5xoz2y={""}>
          <div className={"sidecar-hero-text"} data-astro-cid-sc5xoz2y={""}>
            <div
              className={"sidecar-hero-logo flex items-center"}
              data-astro-cid-sc5xoz2y={""}
            >
              <img src={"/images/logo.png"} alt={"Blume Logo"} style={{ height: "64px", width: "auto" }} />
            </div>
            <h1 className={"sidecar-hero-title"} data-astro-cid-sc5xoz2y={""}>
              {" Grow together, "}
              <br data-astro-cid-sc5xoz2y={""} />
              {"on-chain."}
            </h1>
            <p className={"sidecar-hero-subtitle"} data-astro-cid-sc5xoz2y={""}>
              {
                " GrowStreams is the social growth engine where communities fund contributors, stream rewards in real time, and grow together as one network. "
              }
            </p>
            <div className={"sidecar-hero-cta"} data-astro-cid-sc5xoz2y={""} style={{ display: 'flex', justifyContent: 'center' }}>
              <div
                className={"sidecar-hero-primary"}
                data-astro-cid-sc5xoz2y={""}
                style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginTop: '8px', justifyContent: 'center' }}
              >
                <a
                  href="/app"
                  style={{
                    display: 'inline-flex', alignItems: 'center', padding: '14px 32px',
                    background: '#10b981', color: '#000', borderRadius: '999px',
                    fontWeight: 700, fontSize: '15px', textDecoration: 'none',
                    boxShadow: '0 0 24px rgba(16,185,129,0.35)', transition: 'all 0.2s',
                  }}
                >
                  Launch App
                </a>
                <a
                  href="/agents"
                  style={{
                    display: 'inline-flex', alignItems: 'center', padding: '14px 32px',
                    background: 'transparent', color: '#10b981',
                    border: '1px solid rgba(16,185,129,0.5)',
                    borderRadius: '999px', fontWeight: 700, fontSize: '15px',
                    textDecoration: 'none', transition: 'all 0.2s',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  Stonk on Vara & AI Squads ✦
                </a>
                <a
                  href="/protocol-overview"
                  style={{
                    display: 'inline-flex', alignItems: 'center', padding: '14px 32px',
                    background: 'rgba(56,189,248,0.14)', color: '#38bdf8',
                    border: '1px solid rgba(56,189,248,0.5)',
                    borderRadius: '999px', fontWeight: 700, fontSize: '15px',
                    textDecoration: 'none', transition: 'all 0.2s',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  Protocol Volume & DeFiLlama ↗
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>
      <HomeMiddleSections />
      <section
        className={"sidecar-conclusion"}
        style={
          {
            "--conclusion-accent": "#F4A300",
          } as any
        }
        aria-labelledby={"sidecar-conclusion-title"}
        data-astro-cid-7mp4itxr={""}
      >
        <picture
          className={"sidecar-conclusion__media"}
          aria-hidden={"true"}
          data-astro-cid-7mp4itxr={""}
        >
          <source
            media={"(min-width: 1440px)"}
            type={"image/avif"}
            data-astro-cid-7mp4itxr={""}
            {...({
              srcSet: "/images/sidecar/bg-3072.avif",
            } as any)}
          />
          <source
            media={"(min-width: 768px)"}
            type={"image/avif"}
            data-astro-cid-7mp4itxr={""}
            {...({
              srcSet: "/images/sidecar/bg-1280.avif",
            } as any)}
          />
          <source
            media={"(min-width: 1440px)"}
            type={"image/webp"}
            data-astro-cid-7mp4itxr={""}
            {...({
              srcSet: "/images/sidecar/bg-3072.webp",
            } as any)}
          />
          <source
            media={"(min-width: 768px)"}
            type={"image/webp"}
            data-astro-cid-7mp4itxr={""}
            {...({
              srcSet: "/images/sidecar/bg-1280.webp",
            } as any)}
          />
          <img
            src={"/images/sidecar/bg-768.webp"}
            alt={""}
            aria-hidden={"true"}
            loading={"lazy"}
            decoding={"async"}
            data-astro-cid-7mp4itxr={""}
          />
        </picture>
        <div
          className={"sidecar-conclusion__shade"}
          aria-hidden={"true"}
          data-astro-cid-7mp4itxr={""}
        />
        <div
          className={"sidecar-conclusion__inner"}
          data-astro-cid-7mp4itxr={""}
        >
          <div
            className={"sidecar-conclusion__logo"}
            aria-hidden={"true"}
            data-astro-cid-7mp4itxr={""}
          >
            <img src={"/images/logo.png"} alt={"Blume Logo"} style={{ height: "80px", width: "auto" }} />
          </div>
          <astro-island
            {...({
              uid: "1sl05O",
              "component-url": "/_astro/FlowerBadge.D2vmxh1O.js",
              "component-export": "default",
              "renderer-url": "/_astro/client.BmeJ5Ddr.js",
              props:
                '{"className":[0,"sidecar-conclusion__eyebrow"],"initialFlower":[0,"yellow-sunflower"],"label":[0,"Start Streaming"],"petalCount":[0,4],"size":[0,"sm"],"tone":[0,"soft"],"data-astro-cid-7mp4itxr":[0,true]}',
              ssr: "",
              client: "load",
              opts: '{"name":"FlowerBadge","value":true}',
              "await-children": "",
            } as any)}
            suppressHydrationWarning
            dangerouslySetInnerHTML={{
              __html:
                '<span class="sidecar-conclusion__eyebrow" style="align-items:center;align-self:flex-start;border-radius:999px;border-style:solid;border-width:1px;box-sizing:border-box;display:inline-flex;flex-shrink:0;font-family:\'SN Pro Variable\', system-ui, sans-serif;font-weight:700;justify-content:center;letter-spacing:0.1em;line-height:1;max-width:100%;text-transform:uppercase;white-space:nowrap;width:fit-content;font-size:10px;padding:4px 9px;background-color:color-mix(in srgb, #22c55e 12%, transparent);border-color:transparent;color:#F4A300">Start Streaming</span><!--astro:end-->',
            }}
          />
          <h2
            className={"sidecar-conclusion__title"}
            id={"sidecar-conclusion-title"}
            data-astro-cid-7mp4itxr={""}
          >
            {"\nReady to grow?\n"}
          </h2>
          <p
            className={"sidecar-conclusion__copy"}
            data-astro-cid-7mp4itxr={""}
          >
            {
              "\nJoin builders, DAOs, and contributors already growing together on GrowStreams. Start streaming value to your network in seconds.\n"
            }
          </p>
          <div
            className={"sidecar-conclusion__cta"}
            data-astro-cid-7mp4itxr={""}
          >
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', alignItems: 'center', marginTop: '24px' }}>
              <a
                href="/app"
                style={{
                  display: 'inline-flex', alignItems: 'center', padding: '14px 32px',
                  background: '#10b981', color: '#000', borderRadius: '999px',
                  fontWeight: 700, fontSize: '15px', textDecoration: 'none',
                  boxShadow: '0 0 24px rgba(16,185,129,0.35)', transition: 'all 0.2s',
                }}
              >
                Launch App
              </a>
              <a
                href="/agentic"
                style={{
                  display: 'inline-flex', alignItems: 'center', padding: '14px 32px',
                  background: 'transparent', color: '#10b981',
                  border: '1px solid rgba(16,185,129,0.5)',
                  borderRadius: '999px', fontWeight: 700, fontSize: '15px',
                  textDecoration: 'none', transition: 'all 0.2s',
                  backdropFilter: 'blur(8px)',
                }}
              >
                Launch Agent ✦
              </a>
            </div>
          </div>
          <div
            className={"sidecar-conclusion__footer"}
            data-astro-cid-7mp4itxr={""}
          >
            <nav
              className={"sidecar-conclusion__links"}
              aria-label={"Footer"}
              data-astro-cid-7mp4itxr={""}
            >
              <a href="/" data-astro-cid-7mp4itxr={""}>
                {"Home"}
              </a>
              <a href="/protocol-overview" data-astro-cid-7mp4itxr={""}>
                {"$1M+ Volume Dashboard"}
              </a>
              <a href="/agentic" data-astro-cid-7mp4itxr={""}>
                {"Agent Society & Stonk on Vara"}
              </a>
              <a href="/app" data-astro-cid-7mp4itxr={""}>
                {"Launch dApp"}
              </a>
              <a
                href="/developers"
                data-astro-cid-7mp4itxr={""}
              >
                {"Developers"}
              </a>
              <a
                href="/ecosystem"
                data-astro-cid-7mp4itxr={""}
              >
                {"Ecosystem"}
              </a>
              <a
                href="https://docs.vara.network/"
                target="_blank"
                rel="noopener noreferrer"
                data-astro-cid-7mp4itxr={""}
              >
                {"Vara Docs"}
              </a>

            </nav>
            <a
              href="https://x.com/VaraNetwork"
              target={"_blank"}
              rel={"noopener noreferrer"}
              aria-label={"Follow GrowStreams on X"}
              className={"sidecar-conclusion__social"}
              data-astro-cid-7mp4itxr={""}
            >
              <svg
                xmlns={"http://www.w3.org/2000/svg"}
                width={"17"}
                height={"17"}
                fill={"currentColor"}
                aria-hidden={"true"}
                data-astro-cid-7mp4itxr={""}
                {...({
                  viewBox: "0 0 24 24",
                } as any)}
              >
                <path
                  d={
                    "M18.244 2.25h3.271l-7.155 8.181 8.404 11.319h-6.593l-5.159-6.733-5.901 6.733H1.84l7.641-8.728L1.333 2.25h6.76l4.663 6.06 5.488-6.06z"
                  }
                  data-astro-cid-7mp4itxr={""}
                />
              </svg>
              <span className={"sr-only"} data-astro-cid-7mp4itxr={""}>
                {"X (formerly Twitter)"}
              </span>
            </a>
          </div>
        </div>
      </section>

    </>
  );
}
