"use client";

import React, { useState, useEffect } from "react";

const initialLogs = [
  { id: 1, user: "alice.eth", action: "received a grant stream", amount: "+246 GROW", time: "just now", color: "#10b981" },
  { id: 2, user: "dev-dao.eth", action: "funded an open source bounty", amount: "1,250 GROW", time: "1s ago", color: "#34d399" },
  { id: 3, user: "core-team.eth", action: "unlocked a milestone reward", amount: "4,500 GROW", time: "3s ago", color: "#0d1b19" },
  { id: 4, user: "protocol.eth", action: "distributed treasury funds", amount: "0.05 GROW/s", time: "5s ago", color: "#10b981" },
  { id: 5, user: "builder.eth", action: "started earning from community", amount: "+12 GROW/s", time: "12s ago", color: "#34d399" },
];

export function NetworkSection() {
  const [logs, setLogs] = useState(initialLogs);
  const [valueGrown, setValueGrown] = useState(125121032);

  // Activity Feed loop simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setLogs((prev) => {
        const nextLogs = [...prev];
        const last = nextLogs.pop();
        if (last) {
          nextLogs.unshift({
            ...last,
            id: Date.now(),
            time: "just now"
          });
        }
        return nextLogs;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Ticker simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setValueGrown((prev) => prev + Math.floor(Math.random() * 5));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section style={{ backgroundColor: "#f7f4ee", padding: "120px 24px", color: "#0d1b19" }}>
      <div style={{ maxWidth: "1120px", margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "80px" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "#10b981", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "16px" }}>
            THE NETWORK
          </div>
          <h2 style={{ fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 16px" }}>
            Value that grows at the speed of a block.
          </h2>
          <p style={{ fontSize: "18px", color: "#475569", maxWidth: "600px", margin: "0 auto", lineHeight: 1.6 }}>
            GrowStreams streams rewards to contributors continuously on-chain. No middlemen, no delays.
          </p>
        </div>

        {/* 4 Stat Tiles */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "24px", marginBottom: "80px" }}>
          <StatTile 
            label="Growth Rate" 
            value="12.4 GROW/s" 
            caption="Streaming continuously" 
            pulse={true} 
          />
          <StatTile 
            label="Active Connections" 
            value="4,482" 
            caption="Nodes growing together" 
          />
          <StatTile 
            label="Total Value Grown" 
            value={valueGrown.toLocaleString()} 
            caption="All-time distributed volume" 
          />
          <StatTile 
            label="Network Friction" 
            value="0 ms" 
            caption="Instant, zero-delay settlement" 
          />
        </div>

        {/* 2 Columns: Activity Feed & Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "48px" }}>
          
          {/* Left Column: Activity Feed */}
          <div>
            <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "24px", color: "#0d1b19" }}>Live community activity</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", position: "relative", overflow: "hidden", height: "340px" }}>
              <style>{`
                @keyframes slideDown {
                  from { opacity: 0; transform: translateY(-20px) scale(0.95); }
                  to { opacity: 1; transform: translateY(0) scale(1); }
                }
              `}</style>
              {logs.slice(0, 5).map((log, i) => (
                <div 
                  key={log.id} 
                  style={{ 
                    display: "flex", alignItems: "center", gap: "16px", padding: "16px",
                    backgroundColor: "#ffffff", borderRadius: "16px",
                    border: "1px solid rgba(13,27,25,0.08)",
                    boxShadow: "0 2px 8px rgba(13,27,25,0.02)",
                    animation: i === 0 ? "slideDown 0.4s ease-out forwards" : "none"
                  }}
                >
                  <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "#e7efe6", display: "flex", alignItems: "center", justifyContent: "center", color: log.color, fontWeight: 700, fontSize: "16px" }}>
                    {log.user.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "14px", color: "#0d1b19", fontWeight: 600 }}>{log.user}</div>
                    <div style={{ fontSize: "13px", color: "#475569" }}>{log.action}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: log.color, fontFamily: "ui-monospace, monospace" }}>{log.amount}</div>
                    <div style={{ fontSize: "12px", color: "#94a3b8" }}>{log.time}</div>
                  </div>
                </div>
              ))}
              {/* Fade out mask at bottom */}
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "60px", background: "linear-gradient(to bottom, rgba(247,244,238,0), #f7f4ee)" }} />
            </div>
          </div>

          {/* Right Column: Built for communities */}
          <div>
            <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "24px", color: "#0d1b19" }}>Built for communities</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <FeatureChip icon="🌱" label="Contributor Rewards" />
              <FeatureChip icon="🏛️" label="DAO Grants" />
              <FeatureChip icon="🎯" label="Community Bounties" />
              <FeatureChip icon="🛠️" label="Builder Incentives" />
              <FeatureChip icon="🌐" label="Network Growth" />
              <FeatureChip icon="💻" label="Open Source Funding" />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

function StatTile({ label, value, caption, pulse }: { label: string, value: string, caption: string, pulse?: boolean }) {
  return (
    <div style={{ 
      backgroundColor: "#ffffff", padding: "32px 24px", borderRadius: "24px",
      border: "1px solid rgba(13,27,25,0.08)",
      boxShadow: "0 4px 20px rgba(13,27,25,0.03)",
      display: "flex", flexDirection: "column"
    }}>
      <div style={{ fontSize: "13px", fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px" }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
        <div style={{ fontSize: "32px", fontWeight: 700, color: "#0d1b19", fontFamily: "ui-monospace, monospace", letterSpacing: "-0.02em" }}>
          {value}
        </div>
        {pulse && (
          <div style={{ position: "relative", width: "8px", height: "8px" }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", backgroundColor: "#10b981", animation: "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite" }} />
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", backgroundColor: "#10b981" }} />
            <style>{`
              @keyframes ping {
                75%, 100% { transform: scale(2.5); opacity: 0; }
              }
            `}</style>
          </div>
        )}
      </div>
      <div style={{ fontSize: "13px", color: "#64748b" }}>
        {caption}
      </div>
    </div>
  );
}

function FeatureChip({ icon, label }: { icon: string, label: string }) {
  return (
    <div 
      className="feature-chip"
      style={{ 
        backgroundColor: "#ffffff", padding: "20px", borderRadius: "16px",
        border: "1px solid rgba(13,27,25,0.08)",
        boxShadow: "0 2px 8px rgba(13,27,25,0.02)",
        display: "flex", alignItems: "center", gap: "12px",
        transition: "all 0.2s ease-out", cursor: "default"
      }}
    >
      <style>{`
        .feature-chip:hover {
          transform: translateY(-2px);
          border-color: #10b981 !important;
          box-shadow: 0 8px 16px rgba(16,185,129,0.1) !important;
        }
      `}</style>
      <div style={{ fontSize: "20px" }}>{icon}</div>
      <div style={{ fontSize: "14px", fontWeight: 600, color: "#0d1b19" }}>{label}</div>
    </div>
  );
}
