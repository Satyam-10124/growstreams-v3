"use client";

import React, { useEffect, useRef, useState } from "react";
import { StreamingSVG, GrowthSVG, NetworkSVG } from "./JourneyIllustrations";

export function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      // Start when top of container hits middle of screen, end when bottom hits middle
      const start = rect.top - windowHeight * 0.6;
      const end = rect.bottom - windowHeight * 0.6;
      const total = end - start;
      let progress = 0;
      if (total > 0) {
        progress = Math.min(Math.max(-start / total, 0), 1);
      }
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial check
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Path length approx 2500 for the desktop SVG
  const pathLength = 2500;
  const drawLength = scrollProgress * pathLength;

  // Thresholds for revealing steps
  const step1Revealed = scrollProgress > 0.15;
  const step2Revealed = scrollProgress > 0.45;
  const step3Revealed = scrollProgress > 0.75;
  const isFinished = scrollProgress > 0.95;

  return (
    <section 
      ref={containerRef}
      style={{ 
        backgroundColor: "#f7f4ee", 
        padding: "120px 24px", 
        color: "#0d1b19",
        position: "relative",
        overflow: "hidden" 
      }}
    >
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .vine-path-active { stroke-dashoffset: 0 !important; }
          .vine-element { transform: scale(1) !important; opacity: 1 !important; }
          .step-reveal { opacity: 1 !important; transform: translateY(0) !important; }
        }
        @media (max-width: 768px) {
          .vine-desktop { display: none !important; }
          .vine-mobile { display: block !important; }
          .step-row { flex-direction: column !important; }
          .step-row:nth-child(even) { flex-direction: column !important; }
          .step-content { padding-left: 48px !important; text-align: left !important; }
          .step-image { padding-left: 48px !important; }
          .step-badge { left: 0 !important; transform: translateX(-50%) !important; }
        }
        .vine-mobile { display: none; }
        .step-reveal {
          transition: opacity 500ms ease-out, transform 500ms ease-out;
        }
        .step-hidden {
          opacity: 0;
          transform: translateY(16px);
        }
        .step-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .vine-element {
          transition: transform 400ms cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 400ms ease-out;
        }
        .leaf-hidden { transform: scale(0); opacity: 0; }
        .leaf-visible { transform: scale(1); opacity: 1; }
        .badge-inactive { background-color: #e7efe6; color: #94a3b8; border-color: #cbd5e1; }
        .badge-active { background-color: #10b981; color: #ffffff; border-color: #059669; box-shadow: 0 0 12px rgba(16,185,129,0.3); }
        .illustration-card {
          background: #ffffff;
          border: 1px solid rgba(13,27,25,0.08);
          border-radius: 24px;
          box-shadow: 0 8px 32px rgba(13,27,25,0.04);
          overflow: hidden;
          padding: 24px;
        }
      `}</style>

      <div style={{ maxWidth: "1120px", margin: "0 auto", position: "relative" }}>
        
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "120px", position: "relative", zIndex: 10 }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "#10b981", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "16px" }}>
            HOW IT WORKS
          </div>
          <h2 style={{ fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>
            How the growth network works
          </h2>
        </div>

        {/* --- Background Vine (Desktop) --- */}
        <div className="vine-desktop" style={{ position: "absolute", top: "100px", left: "50%", transform: "translateX(-50%)", width: "800px", height: "1100px", zIndex: 0, pointerEvents: "none" }}>
          <svg viewBox="0 0 800 1100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
            <defs>
              <linearGradient id="vine-grad" x1="0" y1="0" x2="0" y2="1100" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#14532d" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
            {/* Ghost Path */}
            <path d="M400 0 C 400 150, 700 200, 700 350 C 700 500, 100 550, 100 700 C 100 850, 400 900, 400 1050 L 400 1100" stroke="#e7efe6" strokeWidth="2" strokeLinecap="round" />
            {/* Active Path */}
            <path className="vine-path-active" d="M400 0 C 400 150, 700 200, 700 350 C 700 500, 100 550, 100 700 C 100 850, 400 900, 400 1050 L 400 1100" stroke="url(#vine-grad)" strokeWidth="3" strokeLinecap="round" strokeDasharray={pathLength} strokeDashoffset={pathLength - drawLength} style={{ transition: "stroke-dashoffset 0.1s linear", filter: "drop-shadow(0 4px 6px rgba(16,185,129,0.15))" }} />
            
            {/* Leaves (Sprouting as progress increases) */}
            <g className={`vine-element ${scrollProgress > 0.08 ? 'leaf-visible' : 'leaf-hidden'}`} style={{ transformOrigin: '410px 100px' }}>
              <path d="M405 95 C 420 80, 430 95, 415 105 Z" fill="#10b981" />
            </g>
            <g className={`vine-element ${scrollProgress > 0.22 ? 'leaf-visible' : 'leaf-hidden'}`} style={{ transformOrigin: '680px 260px' }}>
              <path d="M680 260 C 695 240, 710 260, 690 270 Z" fill="#34d399" />
            </g>
            <g className={`vine-element ${scrollProgress > 0.38 ? 'leaf-visible' : 'leaf-hidden'}`} style={{ transformOrigin: '500px 480px' }}>
              <path d="M495 475 C 480 460, 470 480, 485 490 Z" fill="#10b981" />
            </g>
            <g className={`vine-element ${scrollProgress > 0.58 ? 'leaf-visible' : 'leaf-hidden'}`} style={{ transformOrigin: '120px 620px' }}>
              <path d="M115 615 C 95 600, 85 620, 105 630 Z" fill="#10b981" />
            </g>
            <g className={`vine-element ${scrollProgress > 0.72 ? 'leaf-visible' : 'leaf-hidden'}`} style={{ transformOrigin: '250px 830px' }}>
              <path d="M255 825 C 275 810, 285 830, 265 840 Z" fill="#34d399" />
            </g>
            <g className={`vine-element ${scrollProgress > 0.88 ? 'leaf-visible' : 'leaf-hidden'}`} style={{ transformOrigin: '400px 1000px' }}>
              <path d="M395 995 C 380 980, 370 1000, 385 1010 Z" fill="#10b981" />
            </g>
            
            {/* End Bud */}
            <g className={`vine-element ${isFinished ? 'leaf-visible' : 'leaf-hidden'}`} style={{ transformOrigin: '400px 1090px' }}>
              <circle cx="400" cy="1090" r="8" fill="#ffffff" stroke="#10b981" strokeWidth="2" />
              <circle cx="400" cy="1090" r="3" fill="#34d399" />
            </g>
          </svg>
        </div>

        {/* --- Background Vine (Mobile) --- */}
        <div className="vine-mobile" style={{ position: "absolute", top: "100px", left: "24px", bottom: "0", width: "40px", zIndex: 0, pointerEvents: "none" }}>
          <div style={{ position: "absolute", top: 0, bottom: 0, left: "20px", width: "2px", backgroundColor: "#e7efe6" }} />
          <div className="vine-path-active" style={{ position: "absolute", top: 0, left: "19.5px", width: "3px", height: `${scrollProgress * 100}%`, background: "linear-gradient(to bottom, #14532d, #10b981)", transition: "height 0.1s linear", borderRadius: "2px" }} />
        </div>

        {/* --- Steps Container --- */}
        <div style={{ display: "flex", flexDirection: "column", gap: "160px", position: "relative", zIndex: 10 }}>
          
          {/* Step 1 */}
          <div className="step-row" style={{ display: "flex", alignItems: "center", gap: "64px" }}>
            <div className={`step-content step-reveal ${step1Revealed ? 'step-visible' : 'step-hidden'}`} style={{ flex: 1, textAlign: "right", position: "relative" }}>
              <div className={`step-badge vine-element ${step1Revealed ? 'badge-active' : 'badge-inactive'}`} style={{ position: "absolute", right: "-102px", top: "50%", transform: "translateY(-50%)", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, fontFamily: "ui-monospace, monospace", border: "2px solid", transition: "all 400ms" }}>
                01
              </div>
              <h3 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "16px" }}>Stream value to people you trust</h3>
              <p style={{ fontSize: "18px", color: "#475569", lineHeight: 1.6 }}>
                Fund contributors and reward builders every second. Value flows continuously to the people driving your community forward.
              </p>
            </div>
            <div className={`step-image step-reveal ${step1Revealed ? 'step-visible' : 'step-hidden'}`} style={{ flex: 1 }}>
              <div className="illustration-card">
                <StreamingSVG />
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="step-row" style={{ display: "flex", alignItems: "center", gap: "64px", flexDirection: "row-reverse" }}>
            <div className={`step-content step-reveal ${step2Revealed ? 'step-visible' : 'step-hidden'}`} style={{ flex: 1, textAlign: "left", position: "relative" }}>
              <div className={`step-badge vine-element ${step2Revealed ? 'badge-active' : 'badge-inactive'}`} style={{ position: "absolute", left: "-102px", top: "50%", transform: "translateY(-50%)", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, fontFamily: "ui-monospace, monospace", border: "2px solid", transition: "all 400ms" }}>
                02
              </div>
              <h3 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "16px" }}>Grow your network, grow your impact</h3>
              <p style={{ fontSize: "18px", color: "#475569", lineHeight: 1.6 }}>
                Connect with DAOs, open source projects, and communities. Your contributions earn rewards automatically.
              </p>
            </div>
            <div className={`step-image step-reveal ${step2Revealed ? 'step-visible' : 'step-hidden'}`} style={{ flex: 1 }}>
              <div className="illustration-card">
                <GrowthSVG />
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="step-row" style={{ display: "flex", alignItems: "center", gap: "64px" }}>
            <div className={`step-content step-reveal ${step3Revealed ? 'step-visible' : 'step-hidden'}`} style={{ flex: 1, textAlign: "right", position: "relative" }}>
              <div className={`step-badge vine-element ${step3Revealed ? 'badge-active' : 'badge-inactive'}`} style={{ position: "absolute", right: "-102px", top: "50%", transform: "translateY(-50%)", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, fontFamily: "ui-monospace, monospace", border: "2px solid", transition: "all 400ms" }}>
                03
              </div>
              <h3 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "16px" }}>One network, instant and infinite</h3>
              <p style={{ fontSize: "18px", color: "#475569", lineHeight: 1.6 }}>
                Parallel, high-performance transactions let the whole network move together.
              </p>
            </div>
            <div className={`step-image step-reveal ${step3Revealed ? 'step-visible' : 'step-hidden'}`} style={{ flex: 1 }}>
              <div className="illustration-card">
                <NetworkSVG />
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
