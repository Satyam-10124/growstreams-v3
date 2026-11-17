import React from "react";
import Link from "next/link";
import { NAV_ITEMS, HEADER_CTA } from "../data/navigation";

export default function Header() {
  return (
    <header className="sticky inset-x-0 top-0 z-50 h-(--header-height) w-full bg-white shadow-black/5 transition-all">
      <div className="container h-full">
        <div className="flex h-full items-center justify-between gap-x-8">
          <Link
            aria-label="GrowStreams Home"
            className="inline-block text-forest cursor-pointer"
            href="/"
          >
            <h1 className="text-3xl font-bold font-sans tracking-tight">
              GrowStreams
            </h1>
          </Link>

          <nav aria-label="Main navigation" className="max-lg:hidden">
            <ul className="flex gap-x-10">
              {NAV_ITEMS.map((item) => (
                <li className="relative" key={item.label}>
                  {item.hasDropdown ? (
                    <div className="relative">
                      <button
                        type="button"
                        aria-expanded={false}
                        aria-haspopup={true}
                        className="text-15px-btn hover:text-moss cursor-pointer transition-colors inline-flex items-start gap-x-1.25"
                      >
                        <span>{item.label}</span>
                        <div className="mt-1.75 w-1.75 shrink-0 rotate-90">
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
                      </button>
                    </div>
                  ) : (
                    <Link
                      className="inline-block text-15px-btn hover:text-moss cursor-pointer transition-colors"
                      href={item.href}
                      target={item.href.startsWith("http") ? "_blank" : undefined}
                      rel={
                        item.href.startsWith("http")
                          ? "noopener noreferrer"
                          : undefined
                      }
                    >
                      <span>{item.label}</span>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-x-5 max-lg:hidden">
            <Link className="inline-block" href={HEADER_CTA.href}>
              <div className="group relative inline-flex appearance-none items-center py-2.5 select-none transition-[color] justify-center text-lemongrass min-h-10.75 px-4.5">
                <span className="absolute inset-0 rounded-md transition-[background-color,border-color,transform,scale] group-hover:scale-[0.98] origin-center bg-forest group-hover:bg-forest/90" />
                <span className="text-15px-btn relative z-10">
                  {HEADER_CTA.label}
                </span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
