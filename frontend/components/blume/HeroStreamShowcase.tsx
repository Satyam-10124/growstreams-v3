"use client";

import React, { useState, useEffect, useRef } from "react";

export function HeroStreamShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [streamRate, setStreamRate] = useState(12.40);
  const [unlockedPct, setUnlockedPct] = useState(78.4);
  const [blockHeight, setBlockHeight] = useState(5189402);

  // Tranquil updates (every 1 second)
  useEffect(() => {
    const interval = setInterval(() => {
      setStreamRate((prev) => +(prev + 0.01).toFixed(2));
      setUnlockedPct((prev) => +(prev >= 99.9 ? 78.4 : prev + 0.1).toFixed(1));
      setBlockHeight((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Scroll progress listener
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight || 800;

      const start = windowHeight * 0.95;
      const end = windowHeight * 0.35;
      const current = rect.top;

      let progress = (start - current) / (start - end);
      if (progress < 0) progress = 0;
      if (progress > 1) progress = 1;

      const eased = 1 - Math.pow(1 - progress, 3);
      setScrollProgress(eased);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const p = scrollProgress;
  const stageOpacity = Math.min(1, p * 1.3);

  // Center Box animations
  const centerTranslateY = 50 - p * 58;
  const centerScale = 0.9 + p * 0.18;
  const centerOpacity = stageOpacity;

  // Left Box animations
  const leftTranslateX = (1 - p) * 140;
  const leftTranslateY = 50 - p * 38;
  const leftRotateY = 24 - p * 18;
  const leftRotateZ = -4 + p * 2.5;
  const leftScale = 0.82 + p * 0.16;
  const leftOpacity = Math.max(0, (p - 0.15) / 0.85) * 0.94;

  // Right Box animations
  const rightTranslateX = (1 - p) * -140;
  const rightTranslateY = 50 - p * 38;
  const rightRotateY = -24 + p * 18;
  const rightRotateZ = 4 - p * 2.5;
  const rightScale = 0.82 + p * 0.16;
  const rightOpacity = Math.max(0, (p - 0.15) / 0.85) * 0.94;

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        maxWidth: "1240px",
        margin: "80px auto 40px",
        padding: "0 24px",
        position: "relative",
        opacity: stageOpacity,
        pointerEvents: p < 0.2 ? "none" : "auto",
        transition: "opacity 0.2s ease-out",
      }}
    >
      <style>{`
        @keyframes terminalCursorBlink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        .term-cursor {
          display: inline-block;
          width: 8px;
          height: 18px;
          background: #10b981;
          margin-left: 6px;
          vertical-align: middle;
          animation: terminalCursorBlink 1s infinite;
        }
      `}</style>

      {/* 3-Box Stage Container */}
      <div
        className="hero-showcase-container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "20px",
          position: "relative",
          perspective: "1400px",
          flexWrap: "nowrap",
          willChange: "transform, opacity",
        }}
      >
        {/* ================= LEFT BOX: Payroll ================= */}
        <div
          className="hero-showcase-box left-box"
          style={{
            flex: "1 1 340px",
            maxWidth: "360px",
            background: "linear-gradient(180deg, rgba(14, 23, 27, 0.9) 0%, rgba(8, 14, 18, 0.96) 100%)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(16, 185, 129, 0.18)",
            borderRadius: "24px",
            padding: "28px 26px",
            boxShadow: `0 20px 50px -10px rgba(0, 0, 0, ${0.4 * p})`,
            transform: `perspective(1000px) rotateY(${leftRotateY}deg) rotate(${leftRotateZ}deg) translateX(${leftTranslateX}px) translateY(${leftTranslateY}px) scale(${leftScale})`,
            opacity: leftOpacity,
            transformOrigin: "right center",
            transition: "transform 0.08s ease-out, opacity 0.08s ease-out",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#6ee7b7", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              CONTRIBUTOR STREAM
            </span>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#10b981", boxShadow: "0 0 6px #10b981" }} />
          </div>

          <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>
            Open Source Builder
          </div>
          <div style={{ fontSize: "26px", fontWeight: 800, color: "#ffffff", fontFamily: "ui-monospace, monospace", margin: "6px 0 16px" }}>
            1,200 <span style={{ fontSize: "15px", color: "#34d399" }}>GROW/mo</span>
          </div>

          {/* Progress Indicator */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#94a3b8", marginBottom: "6px" }}>
              <span>Growth Progress</span>
              <span style={{ color: "#34d399", fontWeight: 700 }}>{unlockedPct}%</span>
            </div>
            <div style={{ height: "5px", background: "#1e293b", borderRadius: "3px", overflow: "hidden" }}>
              <div style={{ width: `${unlockedPct}%`, height: "100%", background: "linear-gradient(90deg, #059669, #00ff88)" }} />
            </div>
          </div>

          <div style={{ marginTop: "16px", fontSize: "12px", color: "#64748b", fontFamily: "ui-monospace, monospace" }}>
            0x7a9f...3e21 &bull; Streaming live
          </div>
        </div>

        {/* ================= CENTER BOX: Terminal Style Look ================= */}
        <div
          className="hero-showcase-box center-box"
          style={{
            flex: "1 1 540px",
            maxWidth: "560px",
            zIndex: 10,
            position: "relative",
            background: "linear-gradient(180deg, #0a1318 0%, #050b0e 100%)",
            backdropFilter: "blur(32px)",
            WebkitBackdropFilter: "blur(32px)",
            border: `1px solid rgba(16, 185, 129, ${0.25 + p * 0.25})`,
            borderRadius: "20px",
            overflow: "hidden",
            boxShadow: `0 30px 80px -15px rgba(0, 0, 0, ${0.5 + p * 0.3}), 0 0 50px -10px rgba(16, 185, 129, ${0.15 + p * 0.2})`,
            transform: `scale(${centerScale}) translateY(${centerTranslateY}px)`,
            opacity: centerOpacity,
            transition: "transform 0.08s ease-out, opacity 0.08s ease-out, box-shadow 0.08s ease-out",
          }}
        >
          {/* Terminal Window Title Bar */}
          <div
            style={{
              background: "#060a0d",
              borderBottom: "1px solid rgba(16, 185, 129, 0.18)",
              padding: "12px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ef4444", opacity: 0.8 }} />
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#f59e0b", opacity: 0.8 }} />
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#10b981", opacity: 0.8 }} />
              <span
                style={{
                  marginLeft: "10px",
                  fontSize: "11px",
                  color: "#64748b",
                  fontFamily: "ui-monospace, SFMono-Regular, monospace",
                }}
              >
                ~ growstreams --network --connections #{blockHeight}
              </span>
            </div>

            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "#10b981",
                fontFamily: "ui-monospace, monospace",
                background: "rgba(16, 185, 129, 0.12)",
                padding: "2px 8px",
                borderRadius: "4px",
              }}
            >
              ACTIVE
            </span>
          </div>

          {/* Terminal Shell Body */}
          <div style={{ padding: "28px 32px", fontFamily: "ui-monospace, SFMono-Regular, monospace" }}>
            {/* Terminal Command Line */}
            <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "16px" }}>
              <span style={{ color: "#10b981" }}>$</span> growstreams --network --live
            </div>

            {/* Terminal Big Live Counter */}
            <div
              style={{
                background: "rgba(16, 185, 129, 0.05)",
                border: "1px solid rgba(16, 185, 129, 0.16)",
                borderRadius: "12px",
                padding: "18px 22px",
                marginBottom: "20px",
              }}
            >
              <div style={{ fontSize: "10px", color: "#6ee7b7", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>
                [ACTIVE_CONNECTIONS]
              </div>
              <div
                style={{
                  fontSize: "clamp(34px, 5vw, 44px)",
                  fontWeight: 800,
                  color: "#ffffff",
                  letterSpacing: "-0.02em",
                  textShadow: "0 0 20px rgba(16, 185, 129, 0.35)",
                }}
              >
                {streamRate.toFixed(2)}{" "}
                <span style={{ fontSize: "20px", color: "#34d399", fontWeight: 600 }}>GROW/s</span>
                <span className="term-cursor" />
              </div>
            </div>

            {/* Terminal Output Log */}
            <div style={{ fontSize: "11px", color: "#94a3b8", display: "flex", flexDirection: "column", gap: "6px" }}>
              <div>
                <span style={{ color: "#38bdf8" }}>[NETWORK]</span> builder.eth ➔ community reward flowing
              </div>
              <div>
                <span style={{ color: "#34d399" }}>[GROWTH]</span> 420 contributors earning &bull; Zero friction
              </div>
            </div>

            {/* Terminal Bottom Divider & Simple Stats */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "8px",
                paddingTop: "18px",
                marginTop: "18px",
                borderTop: "1px solid rgba(16, 185, 129, 0.12)",
                textAlign: "center",
              }}
            >
              <div>
                <div style={{ fontSize: "10px", color: "#64748b" }}>CONNECTIONS</div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#f8fafc", marginTop: "2px" }}>4,482</div>
              </div>
              <div style={{ borderLeft: "1px solid rgba(16, 185, 129, 0.1)", borderRight: "1px solid rgba(16, 185, 129, 0.1)" }}>
                <div style={{ fontSize: "10px", color: "#64748b" }}>LATENCY</div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#34d399", marginTop: "2px" }}>0 ms</div>
              </div>
              <div>
                <div style={{ fontSize: "10px", color: "#64748b" }}>FRICTION</div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#38bdf8", marginTop: "2px" }}>0.00%</div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT BOX: Actor Runtime ================= */}
        <div
          className="hero-showcase-box right-box"
          style={{
            flex: "1 1 340px",
            maxWidth: "360px",
            background: "linear-gradient(180deg, rgba(14, 23, 27, 0.9) 0%, rgba(8, 14, 18, 0.96) 100%)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(16, 185, 129, 0.18)",
            borderRadius: "24px",
            padding: "28px 26px",
            boxShadow: `0 20px 50px -10px rgba(0, 0, 0, ${0.4 * p})`,
            transform: `perspective(1000px) rotateY(${rightRotateY}deg) rotate(${rightRotateZ}deg) translateX(${rightTranslateX}px) translateY(${rightTranslateY}px) scale(${rightScale})`,
            opacity: rightOpacity,
            transformOrigin: "left center",
            transition: "transform 0.08s ease-out, opacity 0.08s ease-out",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#38bdf8", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              GROWTH NETWORK
            </span>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#38bdf8", boxShadow: "0 0 6px #38bdf8" }} />
          </div>

          <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>
            Active Contributors
          </div>
          <div style={{ fontSize: "26px", fontWeight: 800, color: "#ffffff", fontFamily: "ui-monospace, monospace", margin: "6px 0 16px" }}>
            420 <span style={{ fontSize: "15px", color: "#38bdf8" }}>growing</span>
          </div>

          {/* Node Topology */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#091216", borderRadius: "10px", border: "1px solid #142a27" }}>
            <div style={{ fontSize: "11px", color: "#a7f3d0", fontFamily: "ui-monospace, monospace" }}>
              DAO ➔ Community ➔ Contributors
            </div>
          </div>

          <div style={{ marginTop: "16px", fontSize: "12px", color: "#64748b", fontFamily: "ui-monospace, monospace" }}>
            Social &bull; Permissionless growth
          </div>
        </div>
      </div>
    </div>
  );
}
