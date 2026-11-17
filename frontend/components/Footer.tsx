import React from "react";
import Link from "next/link";
import { FOOTER_COLUMNS, LEGAL_LINKS, FOOTER_INFO } from "../data/footer";

function FooterRuler({ side }: { side: "left" | "right" }) {
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
          <div className="h-px shrink-0 w-4.5 bg-sage-5" />
          <div className="h-px shrink-0 w-2.5 bg-sage-5" />
          <div className="h-px shrink-0 w-2.5 bg-sage-5" />
          <div className="h-px shrink-0 w-2.5 bg-sage-5" />
          <div className="h-px shrink-0 w-2.5 bg-sage-5" />
        </React.Fragment>
      ))}
    </div>
  );
}

function FormCutCorners() {
  return (
    <div className="pointer-events-none absolute inset-0 z-2">
      <div
        className="absolute -top-px -left-px border-white/10 bg-white"
        style={{
          clipPath: "polygon(0 0, 100% 0, 0 100%)",
          width: "7px",
          height: "7px",
        }}
      />
      <div
        className="absolute -top-px -right-px border-white/10 bg-white"
        style={{
          clipPath: "polygon(0 0, 100% 0, 100% 100%)",
          width: "7px",
          height: "7px",
        }}
      />
      <div
        className="absolute -bottom-px -left-px border-white/10 bg-white"
        style={{
          clipPath: "polygon(0 0, 0 100%, 100% 100%)",
          width: "7px",
          height: "7px",
        }}
      />
      <div
        className="absolute -right-px -bottom-px border-white/10 bg-white"
        style={{
          clipPath: "polygon(100% 0, 0 100%, 100% 100%)",
          width: "7px",
          height: "7px",
        }}
      />
    </div>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76c-.92 0-1.66.74-1.66 1.66 0 .92.74 1.66 1.66 1.66.92 0 1.66-.74 1.66-1.66 0-.92-.74-1.66-1.66-1.66m1.39 9.74v-8.37H5.07v8.37h2.78z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-forest text-white">
      <FooterRuler side="left" />
      <FooterRuler side="right" />

      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-between max-lg:hidden"
        style={{ top: "0%" }}
      >
        <div className="text-lemongrass w-5.5">
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
        <div className="text-lemongrass w-5.5 rotate-180">
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

      <div className="relative z-1">
        <div className="container">
          {/* Main CTA */}
          <div className="relative mx-auto flex w-full max-w-[960px] flex-col items-center gap-y-7 sm:gap-y-10 pt-20 md:pt-28 lg:pt-164">
            <p className="relative z-10 text-78px-footer-cta text-center max-sm:text-balance">
              <span>Stream value to everyone who's earned it</span>
            </p>
            <div className="relative z-10 flex items-center gap-x-5">
              <Link className="inline-block" href="/app">
                <div className="group relative inline-flex appearance-none items-center py-2.5 select-none transition-[color] justify-center text-black hover:text-lemongrass min-h-10.75 px-4.5">
                  <span className="absolute inset-0 rounded-md transition-[background-color,border-color,transform,scale] group-hover:scale-[0.98] origin-center bg-lemongrass border border-lemongrass group-hover:bg-transparent" />
                  <span className="text-15px-btn relative z-10">
                    Launch App
                  </span>
                </div>
              </Link>
            </div>

            <div
              className="pointer-events-none absolute -top-20 -left-30 w-[150px] max-lg:opacity-40 lg:w-[219px] z-0"
              style={{
                transform: "translateY(40px) rotate(-20deg)",
                perspective: "1200px",
              }}
            >
              <img
                alt="Mark decoration"
                loading="lazy"
                width={219}
                height={422}
                decoding="async"
                className="h-auto max-w-full footer-mark-float"
                style={{ color: "transparent" }}
                src="./images/mark.png"
              />
            </div>
            <div
              className="pointer-events-none absolute -right-32 -bottom-14 w-[150px] max-lg:opacity-40 lg:-right-40 lg:w-[219px] z-0"
              style={{ transform: "translateY(100px) rotate(50deg)" }}
            >
              <img
                alt="Mark decoration"
                loading="lazy"
                width={219}
                height={422}
                decoding="async"
                className="h-auto max-w-full footer-mark-float"
                style={{ color: "transparent" }}
                src="./images/mark.png"
              />
            </div>
          </div>

          {/* Links & Newsletter */}
          <div className="pb-11 pt-20 md:pt-28 lg:pt-164">
            <div className="flex flex-col items-start gap-16 lg:flex-row lg:gap-12">
              <nav aria-label="Footer navigation" className="w-full flex-1">
                <div className="xs:grid-cols-3 xs:gap-6 grid grid-cols-2 gap-10 sm:gap-8 lg:flex lg:gap-12 xl:gap-x-21.25">
                  {FOOTER_COLUMNS.map((col) => (
                    <div key={col.title}>
                      <div className="space-y-5 sm:space-y-4">
                        <h3 className="text-10px-nav-heading opacity-70">
                          {col.title}
                        </h3>
                        <ul className="space-y-3.5 sm:space-y-3" role="list">
                          {col.links.map((link) => (
                            <li
                              className="text-14px-body relative"
                              key={link.label}
                            >
                              <Link
                                className="inline-block opacity-80 hover:opacity-100 transition-opacity"
                                href={link.href}
                                target={
                                  link.href.startsWith("http")
                                    ? "_blank"
                                    : undefined
                                }
                                rel={
                                  link.href.startsWith("http")
                                    ? "noopener noreferrer"
                                    : undefined
                                }
                              >
                                <span>{link.label}</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </nav>

              <div className="w-full shrink-0 space-y-20 lg:w-5/12 lg:max-w-104">
                <div className="space-y-5">
                  <div className="text-14px-eyebrow">
                    {FOOTER_INFO.newsletterTitle}
                  </div>
                  <div className="space-y-2">
                    <form className="flex w-full gap-x-3" noValidate={true}>
                      <div className="relative border border-white/10 h-12 flex-1">
                        <FormCutCorners />
                        <input
                          type="email"
                          required={true}
                          placeholder="Email address"
                          className="input-unstyled focus-reset text-15px-btn size-full w-full px-4 py-3 transition-colors sm:px-4.5 text-white placeholder:text-white/40 hover:bg-white/3! focus:bg-white/3!"
                          aria-invalid={false}
                          name="email"
                          defaultValue=""
                        />
                      </div>
                      <div className="relative border border-white size-12 shrink-0">
                        <FormCutCorners />
                        <button
                          type="submit"
                          aria-label="Subscribe to newsletter"
                          className="group flex size-full cursor-pointer items-center justify-center"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="22"
                            height="22"
                            viewBox="0 0 22 22"
                            fill="none"
                            aria-hidden={true}
                            className="transition-transform will-change-transform group-hover:scale-90"
                          >
                            <path
                              d="M14.4375 11L18.5625 15.125L14.4375 19.25"
                              stroke="white"
                              strokeWidth="1.375"
                              strokeLinecap="square"
                            />
                            <path
                              d="M6.875 2.75V2.0625H5.5V2.75H6.1875H6.875ZM6.1875 15.125H5.5V15.8125H6.1875V15.125ZM18.5625 15.8125C18.9422 15.8125 19.25 15.5047 19.25 15.125C19.25 14.7453 18.9422 14.4375 18.5625 14.4375V15.125V15.8125ZM6.1875 2.75H5.5V15.125H6.1875H6.875V2.75H6.1875ZM6.1875 15.125V15.8125H18.5625V15.125V14.4375H6.1875V15.125Z"
                              fill="white"
                            />
                          </svg>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="text-14px-eyebrow">Social</div>
                  <ul className="flex items-center gap-4" role="list">
                    <li>
                      <Link
                        href="https://linkedin.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="LinkedIn"
                        className="inline-flex size-10 items-center justify-center rounded border border-white/20 bg-white/5 text-white hover:border-lemongrass hover:text-lemongrass hover:bg-white/10 transition-all cursor-pointer"
                      >
                        <LinkedInIcon />
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="https://x.com/GrowwStreams"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="X (formerly Twitter)"
                        className="inline-flex size-10 items-center justify-center rounded border border-white/20 bg-white/5 text-white hover:border-lemongrass hover:text-lemongrass hover:bg-white/10 transition-all cursor-pointer"
                      >
                        <XIcon />
                      </Link>
                    </li>
                  </ul>
                </div>

                <div className="flex w-full flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
                  <nav aria-label="Legal navigation">
                    <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
                      {LEGAL_LINKS.map((link) => (
                        <li className="text-12px-legal-link" key={link.label}>
                          <Link
                            aria-label={link.label}
                            className="inline-block opacity-50 transition-opacity hover:opacity-100"
                            href={link.href}
                          >
                            <span>{link.label}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </nav>
                  <div className="text-12px-legal-link opacity-50">
                    {FOOTER_INFO.copyright}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-12 text-sage-4 flex items-center justify-between">
              <span className="text-2xl font-bold font-sans tracking-tight text-white/40">
                {FOOTER_INFO.brandName}
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
