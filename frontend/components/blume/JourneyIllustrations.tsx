import React from "react";

export function StreamingSVG(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 400 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: "100%", height: "auto", ...props.style }}
      {...props}
    >
      <defs>
        <radialGradient id="sg-sage-bg1" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#e7efe6" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#e7efe6" stopOpacity="0" />
        </radialGradient>
        <style>{`
          .flow-dot { animation: flowAnim 2s linear infinite; }
          .flow-dot-2 { animation: flowAnim 2.5s linear infinite 0.5s; }
          .flow-dot-3 { animation: flowAnim 2.2s linear infinite 1s; }
          @keyframes flowAnim {
            0% { stroke-dashoffset: 200; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { stroke-dashoffset: 0; opacity: 0; }
          }
          .tick-plus { animation: tickPulse 1.5s ease-in-out infinite alternate; }
          .tick-plus-2 { animation: tickPulse 1.8s ease-in-out infinite alternate 0.5s; }
          .tick-plus-3 { animation: tickPulse 2s ease-in-out infinite alternate 1s; }
          @keyframes tickPulse {
            0% { transform: scale(0.8); opacity: 0.2; }
            100% { transform: scale(1.2); opacity: 1; }
          }
        `}</style>
      </defs>
      
      {/* Background Soft Glow */}
      <circle cx="200" cy="140" r="120" fill="url(#sg-sage-bg1)" />

      {/* Connection Lines (Dashed) */}
      <path d="M120 140 C 180 140, 200 80, 260 80" stroke="#34d399" strokeWidth="2" strokeDasharray="4 4" strokeLinecap="round" />
      <path d="M120 140 L 260 140" stroke="#34d399" strokeWidth="2" strokeDasharray="4 4" strokeLinecap="round" />
      <path d="M120 140 C 180 140, 200 200, 260 200" stroke="#34d399" strokeWidth="2" strokeDasharray="4 4" strokeLinecap="round" />

      {/* Traveling Flow Dots (simulated using dasharray) */}
      <path d="M120 140 C 180 140, 200 80, 260 80" stroke="#10b981" strokeWidth="4" strokeDasharray="1 200" strokeLinecap="round" className="flow-dot" />
      <path d="M120 140 L 260 140" stroke="#10b981" strokeWidth="4" strokeDasharray="1 200" strokeLinecap="round" className="flow-dot-2" />
      <path d="M120 140 C 180 140, 200 200, 260 200" stroke="#10b981" strokeWidth="4" strokeDasharray="1 200" strokeLinecap="round" className="flow-dot-3" />

      {/* Source Node */}
      <circle cx="100" cy="140" r="28" fill="#ffffff" stroke="#0d1b19" strokeWidth="2" />
      <circle cx="100" cy="140" r="18" fill="#e7efe6" />
      <text x="100" y="143" fill="#0d1b19" fontSize="10" fontWeight="700" fontFamily="system-ui" textAnchor="middle">YOU</text>

      {/* Recipient Nodes */}
      {/* 1 */}
      <circle cx="280" cy="80" r="24" fill="#ffffff" stroke="#10b981" strokeWidth="2" />
      <text x="280" y="84" fill="#10b981" fontSize="10" fontWeight="700" fontFamily="system-ui" textAnchor="middle">DAO</text>
      <g transform="translate(310, 70)" className="tick-plus">
        <circle cx="0" cy="0" r="8" fill="#e7efe6" />
        <path d="M-3 0 L3 0 M0 -3 L0 3" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
      </g>

      {/* 2 */}
      <circle cx="280" cy="140" r="24" fill="#ffffff" stroke="#10b981" strokeWidth="2" />
      <circle cx="280" cy="140" r="14" fill="#e7efe6" />
      <g transform="translate(310, 130)" className="tick-plus-2">
        <circle cx="0" cy="0" r="8" fill="#e7efe6" />
        <path d="M-3 0 L3 0 M0 -3 L0 3" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
      </g>

      {/* 3 */}
      <rect x="256" y="176" width="48" height="48" rx="12" fill="#ffffff" stroke="#10b981" strokeWidth="2" />
      <text x="280" y="204" fill="#10b981" fontSize="10" fontWeight="700" fontFamily="system-ui" textAnchor="middle">TEAM</text>
      <g transform="translate(310, 190)" className="tick-plus-3">
        <circle cx="0" cy="0" r="8" fill="#e7efe6" />
        <path d="M-3 0 L3 0 M0 -3 L0 3" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export function GrowthSVG(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 400 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: "100%", height: "auto", ...props.style }}
      {...props}
    >
      <defs>
        <radialGradient id="sg-sage-bg2" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#e7efe6" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#e7efe6" stopOpacity="0" />
        </radialGradient>
        <style>{`
          .leaf-node { opacity: 0; transform-origin: center; animation: popIn 3s ease-out infinite; }
          .leaf-node:nth-child(1) { animation-delay: 0.2s; transform-origin: 120px 100px; }
          .leaf-node:nth-child(2) { animation-delay: 0.6s; transform-origin: 280px 100px; }
          .leaf-node:nth-child(3) { animation-delay: 1.0s; transform-origin: 150px 220px; }
          .leaf-node:nth-child(4) { animation-delay: 1.4s; transform-origin: 260px 200px; }
          .leaf-node:nth-child(5) { animation-delay: 1.8s; transform-origin: 200px 60px; }
          @keyframes popIn {
            0% { opacity: 0; transform: scale(0); }
            10% { opacity: 1; transform: scale(1.1); }
            15% { opacity: 1; transform: scale(1); }
            80% { opacity: 1; transform: scale(1); }
            100% { opacity: 0; transform: scale(0.9); }
          }
          .ring-fill { stroke-dasharray: 100; stroke-dashoffset: 100; animation: fillRing 3s ease-out infinite; }
          @keyframes fillRing {
            0% { stroke-dashoffset: 100; }
            40% { stroke-dashoffset: 20; }
            80% { stroke-dashoffset: 20; }
            100% { stroke-dashoffset: 100; }
          }
        `}</style>
      </defs>

      <circle cx="200" cy="140" r="120" fill="url(#sg-sage-bg2)" />

      {/* Branches */}
      <path d="M200 140 L120 100" stroke="#34d399" strokeWidth="2" strokeLinecap="round" />
      <path d="M200 140 L280 100" stroke="#34d399" strokeWidth="2" strokeLinecap="round" />
      <path d="M200 140 L150 220" stroke="#34d399" strokeWidth="2" strokeLinecap="round" />
      <path d="M200 140 L260 200" stroke="#34d399" strokeWidth="2" strokeLinecap="round" />
      <path d="M200 140 L200 60" stroke="#34d399" strokeWidth="2" strokeLinecap="round" />

      {/* Central Node */}
      <circle cx="200" cy="140" r="32" fill="#ffffff" stroke="#0d1b19" strokeWidth="2" />
      <circle cx="200" cy="140" r="22" fill="#e7efe6" />
      <text x="200" y="144" fill="#0d1b19" fontSize="11" fontWeight="700" fontFamily="system-ui" textAnchor="middle">GROW</text>
      
      {/* XP Ring around center */}
      <circle cx="200" cy="140" r="40" fill="none" stroke="#e7efe6" strokeWidth="2" />
      <circle cx="200" cy="140" r="40" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" className="ring-fill" pathLength="100" />

      {/* Leaf Nodes */}
      <g className="leaf-node">
        <circle cx="120" cy="100" r="16" fill="#ffffff" stroke="#10b981" strokeWidth="2" />
        <path d="M120 95 L120 105 M115 100 L125 100" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
      </g>
      <g className="leaf-node">
        <circle cx="280" cy="100" r="20" fill="#ffffff" stroke="#10b981" strokeWidth="2" />
        <circle cx="280" cy="100" r="10" fill="#e7efe6" />
      </g>
      <g className="leaf-node">
        <rect x="134" y="204" width="32" height="32" rx="8" fill="#ffffff" stroke="#10b981" strokeWidth="2" />
      </g>
      <g className="leaf-node">
        <circle cx="260" cy="200" r="14" fill="#10b981" />
      </g>
      <g className="leaf-node">
        <circle cx="200" cy="60" r="16" fill="#ffffff" stroke="#10b981" strokeWidth="2" />
      </g>
    </svg>
  );
}

export function NetworkSVG(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 400 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: "100%", height: "auto", ...props.style }}
      {...props}
    >
      <defs>
        <radialGradient id="sg-sage-bg3" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#e7efe6" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#e7efe6" stopOpacity="0" />
        </radialGradient>
        <style>{`
          .node-pulse { animation: nodePulse 4s ease-in-out infinite alternate; }
          .node-pulse-2 { animation: nodePulse 3s ease-in-out infinite alternate 1s; }
          .node-pulse-3 { animation: nodePulse 5s ease-in-out infinite alternate 2s; }
          @keyframes nodePulse {
            0% { transform: scale(0.9); }
            100% { transform: scale(1.1); }
          }
          .ripple { animation: rippleAnim 4s linear infinite; stroke-dasharray: 10 200; stroke-dashoffset: 200; }
          @keyframes rippleAnim {
            0% { stroke-dashoffset: 200; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { stroke-dashoffset: 0; opacity: 0; }
          }
        `}</style>
      </defs>

      <circle cx="200" cy="140" r="130" fill="url(#sg-sage-bg3)" />

      {/* Network Connections */}
      <g stroke="#e7efe6" strokeWidth="2" strokeLinecap="round">
        <path d="M100 140 L160 80 L240 100 L300 160 L220 220 L140 200 Z" />
        <path d="M160 80 L200 160 L240 100" />
        <path d="M100 140 L200 160 L300 160" />
        <path d="M220 220 L200 160 L140 200" />
        <path d="M160 80 L260 40 L340 100 L300 160" />
      </g>

      {/* Ripples on connections */}
      <g stroke="#34d399" strokeWidth="2" strokeLinecap="round" className="ripple">
        <path d="M100 140 L160 80 L240 100 L300 160" />
        <path d="M300 160 L220 220 L140 200 L100 140" />
      </g>

      {/* Nodes */}
      <g className="node-pulse" style={{ transformOrigin: "100px 140px" }}>
        <circle cx="100" cy="140" r="16" fill="#ffffff" stroke="#10b981" strokeWidth="2" />
      </g>
      
      <g className="node-pulse-2" style={{ transformOrigin: "160px 80px" }}>
        <rect x="144" y="64" width="32" height="32" rx="8" fill="#ffffff" stroke="#0d1b19" strokeWidth="2" />
      </g>

      <g className="node-pulse-3" style={{ transformOrigin: "240px 100px" }}>
        <circle cx="240" cy="100" r="20" fill="#e7efe6" stroke="#10b981" strokeWidth="2" />
      </g>

      <g className="node-pulse" style={{ transformOrigin: "300px 160px" }}>
        <circle cx="300" cy="160" r="18" fill="#ffffff" stroke="#10b981" strokeWidth="2" />
        <circle cx="300" cy="160" r="8" fill="#34d399" />
      </g>

      <g className="node-pulse-2" style={{ transformOrigin: "220px 220px" }}>
        <rect x="204" y="204" width="32" height="32" rx="16" fill="#ffffff" stroke="#0d1b19" strokeWidth="2" />
      </g>

      <g className="node-pulse-3" style={{ transformOrigin: "140px 200px" }}>
        <circle cx="140" cy="200" r="14" fill="#10b981" />
      </g>

      <g className="node-pulse" style={{ transformOrigin: "200px 160px" }}>
        <circle cx="200" cy="160" r="12" fill="#ffffff" stroke="#10b981" strokeWidth="2" />
      </g>

      <g className="node-pulse-2" style={{ transformOrigin: "260px 40px" }}>
        <circle cx="260" cy="40" r="10" fill="#e7efe6" stroke="#10b981" strokeWidth="2" />
      </g>

      <g className="node-pulse-3" style={{ transformOrigin: "340px 100px" }}>
        <rect x="328" y="88" width="24" height="24" rx="6" fill="#ffffff" stroke="#0d1b19" strokeWidth="2" />
      </g>
    </svg>
  );
}
