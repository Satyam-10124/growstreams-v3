import{j as e}from"./jsx-runtime.D_zvdyIk.js";/* empty css                       */import{r as o}from"./index.CEK5zJnf.js";import p from"./FlowerBadge.D2vmxh1O.js";import{u,c as n}from"./flowerStore.kO8pFYc0.js";import{F as c}from"./FeatureFlowerBadge.pQ5vRp_0.js";import"./GlobalPetalAnchor.CEJ-1JhB.js";import"./globalPetalStore.C-ekeyrZ.js";import"./PetalEffect.BJzkMjb9.js";import"./UsageFooter.l8QEN428.js";import"./index.DorHZqxH.js";import"./style.DvmLeqGT.js";const d=[{status:"today",title:"Agent Overview",description:"Always know when your agent finished, is working, or needs your approval.",flower:"blue-forgetmenot"},{status:"today",title:"Hidden Files & Rules",description:"Track the hidden files, skills, hooks, and rules that quietly shape what your agents do.",flower:"orange-daylily"},{status:"today",title:"Usage Tracking",description:"Track your Claude Code and Codex plan limits and token burn before you hit a wall.",flower:"red-tulip"},{status:"soon",title:"Auto-Fixes",description:"Detect mismatches between your agent setups and your chat instructions. Blume proposes the fix; you approve.",flower:"purple-bluebell"},{status:"soon",title:"Analytics",description:"See whether your agent setup is improving or degrading over time.",flower:"orange-lantana"},{status:"soon",title:"Local Domain Model",description:"A single source of truth for intent across your project.",flower:"yellow-sunflower"}],x=[{status:"next",title:"Central Domain Model",description:"Source of truth for intent across your whole team. Audit how every decision was made."},{status:"next",title:"Team Conflict Resolution",description:"When two developers' intent or patterns collide, Blume surfaces it before it ships."},{status:"next",title:"Auto-Improve Mode",description:"Tests changes automatically and measures performance against your domain."}],g={today:null,soon:"Soon",next:"Next"};function l({initialFlower:r,status:a}){const i=g[a];if(!i)return null;const s=`features__tile-pill features__tile-pill--${a}`;return e.jsx(p,{className:s,initialFlower:r,label:i,petalCount:a==="soon"?4:3,size:"sm",tone:a==="next"?"outline":"soft"})}function S({currentFlower:r}){const{flowerType:a}=u(),[i,s]=o.useState(!1);o.useEffect(()=>{s(!0)},[]);const f=n(i?a:r);return e.jsxs("section",{className:"features",style:{"--features-accent":f},"aria-labelledby":"features-title",children:[e.jsxs("div",{className:"features__intro",children:[e.jsx("h2",{className:"features__title",id:"features-title",children:"What Blume can do"}),e.jsx("p",{className:"features__subtitle",children:"Today, and the corners of the agent setup we're building toward."})]}),e.jsx("ul",{className:"features__bento features__bento--with-flowers",role:"list",children:d.map(t=>e.jsxs("li",{className:"features__tile features__tile--flower",style:t.flower?{"--tile-flower-accent":n(t.flower)}:void 0,children:[t.flower&&e.jsx("div",{className:"features__tile-flower",children:e.jsx(c,{flower:t.flower,initialActive:t.flower===r})}),e.jsx(l,{initialFlower:r,status:t.status}),e.jsxs("div",{className:"features__tile-content",children:[e.jsx("div",{className:"features__tile-title-row",children:e.jsx("h3",{className:"features__tile-title",children:t.title})}),e.jsx("p",{className:"features__tile-desc",children:t.description})]})]},t.title))}),e.jsxs("div",{className:"features__next-group",children:[e.jsxs("div",{className:"features__next-header",children:[e.jsx("span",{className:"features__next-rule","aria-hidden":"true"}),e.jsx("span",{className:"features__next-label",children:"On the horizon"}),e.jsx("span",{className:"features__next-rule","aria-hidden":"true"})]}),e.jsx("ul",{className:"features__bento",role:"list",children:x.map(t=>e.jsxs("li",{className:`features__tile features__tile--horizon ${t.highlighted?"features__tile--highlighted":""}`,children:[e.jsx(l,{initialFlower:r,status:t.status}),e.jsxs("div",{className:"features__tile-content",children:[e.jsx("h3",{className:"features__tile-title",children:t.title}),e.jsx("p",{className:"features__tile-desc",children:t.description})]})]},t.title))})]}),e.jsx("style",{children:`
        .features {
          background-color: #f7f4ee;
          padding: 80px 24px 120px;
          position: relative;
          z-index: 1;
        }
        .features__intro {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          max-width: 800px;
          margin: 0 auto;
          text-align: center;
        }
        .features__title {
          font-family: 'Gelica', 'Fraunces Variable', 'Fraunces', Georgia, serif;
          font-size: 56px;
          font-weight: 500;
          line-height: 1em;
          letter-spacing: -0.025em;
          color: #1a140d;
          margin: 0;
        }
        .features__subtitle {
          font-family: 'SN Pro Variable', system-ui, sans-serif;
          font-size: 18px;
          font-weight: 400;
          line-height: 1.5em;
          letter-spacing: -0.015em;
          color: rgba(26, 20, 13, 0.65);
          margin: 0;
          max-width: 560px;
        }
        .features__bento {
          list-style: none;
          margin: 64px auto 0;
          padding: 0;
          max-width: 920px;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          grid-auto-rows: minmax(284px, 1fr);
          grid-auto-flow: dense;
          gap: 24px;
        }
        .features__bento--with-flowers {
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          grid-auto-rows: auto;
          gap: 18px;
        }
        .features__tile {
          position: relative;
          display: flex;
          flex-direction: column;
          background-color: hsla(260, 20%, 30%, 0.03);
          border-radius: 28px;
          padding: 22px 21px 21px;
          box-shadow:
            0 20px 140px 0 transparent,
            0 25px 20px 0 transparent,
            inset 0 0 0 1px transparent,
            0 0 0 1px transparent;
          transition: all 0.2s ease;
          cursor: pointer;
          user-select: none;
          overflow: hidden;
        }
        .features__tile--flower {
          flex-direction: column;
          align-items: stretch;
          gap: 12px;
          border-radius: 20px;
          padding: 16px 18px 18px;
          transition: all 0.25s ease;
        }
        .features__tile-flower {
          flex-shrink: 0;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: visible;
        }
        .features__tile-flower-button {
          position: relative;
          width: 48px;
          height: 48px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 0;
          border-radius: 12px;
          background: transparent;
          box-shadow: none;
          cursor: pointer;
          padding: 0;
          overflow: hidden;
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease,
            background 0.2s ease,
            border-color 0.2s ease;
        }
        .features__tile-flower-button:hover {
          background: linear-gradient(135deg, rgba(var(--feature-flower-rgb), 0.15), rgba(var(--feature-flower-rgb), 0.05));
          box-shadow:
            0 8px 25px rgba(var(--feature-flower-rgb), 0.3),
            0 0 0 1px rgba(var(--feature-flower-rgb), 0.2);
          transform: scale(1.1) rotate(2deg);
        }
        .features__tile-flower-button:active {
          transform: scale(0.95) rotate(0deg);
        }
        .features__tile-flower-button:focus-visible {
          outline: 2px solid rgba(var(--feature-flower-rgb), 0.55);
          outline-offset: 3px;
        }
        .features__tile-flower-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
          position: relative;
          z-index: 1;
          transition:
            filter 0.2s ease,
            transform 0.2s ease;
        }
        .features__tile-flower-button:hover .features__tile-flower-img {
          filter: brightness(1.1) contrast(1.1);
          transform: scale(1.1);
        }
        .features__tile-flower-shine {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          opacity: 0;
          transform: translateX(-100%);
          transition:
            opacity 0.35s ease,
            transform 1s ease;
        }
        .features__tile-flower-shine--active {
          opacity: 0.2;
          transform: translateX(100%);
          background: linear-gradient(90deg, transparent, rgba(var(--feature-flower-rgb), 0.3), transparent);
        }
        .features__tile-flower-glow {
          position: absolute;
          inset: -4px;
          border-radius: 16px;
          pointer-events: none;
          opacity: 0.75;
          filter: blur(4px);
          background: radial-gradient(circle, rgba(var(--feature-flower-rgb), 0.4), transparent 70%);
        }
        .features__tile-content {
          position: relative;
          flex: 1;
          min-width: 0;
        }
        .features__tile-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 6px;
        }
        .features__tile:hover {
          background: hsla(0, 0%, 100%, 0.4);
          transform: translate3d(0, -1px, 0) scale(1.02);
          box-shadow:
            0 20px 140px 0 rgba(0, 20, 20, 0.08),
            0 25px 20px 0 rgba(0, 20, 20, 0.04),
            inset 0 0 0 1px rgba(255, 255, 255, 0.6),
            0 0 0 1px rgba(0, 0, 0, 0.03);
          z-index: 1;
        }
        .features__tile--flower:hover {
          background: hsla(0, 0%, 100%, 0.4);
          box-shadow:
            0 20px 60px 0 color-mix(in srgb, var(--tile-flower-accent) 14%, transparent),
            0 12px 20px 0 color-mix(in srgb, var(--tile-flower-accent) 8%, transparent),
            0 0 0 3px color-mix(in srgb, var(--tile-flower-accent) 35%, transparent);
        }
        .features__tile--horizon:hover {
          background: hsla(0, 0%, 100%, 0.4);
          box-shadow:
            0 20px 60px 0 color-mix(in srgb, var(--features-accent) 14%, transparent),
            0 12px 20px 0 color-mix(in srgb, var(--features-accent) 8%, transparent),
            0 0 0 3px color-mix(in srgb, var(--features-accent) 35%, transparent);
        }
        .features__tile--horizon {
          justify-content: flex-start;
        }
        .features__tile--horizon .features__tile-content {
          display: flex;
          flex-direction: column;
          padding-top: 26px;
        }
        .features__tile--horizon .features__tile-title {
          margin: 0 0 6px;
        }
        .features__tile--horizon .features__tile-pill {
          left: 16px;
          right: auto;
        }
        .features__tile--highlighted {
          grid-column: span 2;
          flex-direction: row-reverse;
          align-items: stretch;
          gap: 20px;
        }
        .features__tile--highlighted .features__tile-content {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .features__tile-pill {
          position: absolute;
          top: 16px;
          right: 16px;
          z-index: 2;
        }
        .features__tile--flower .features__tile-pill {
          top: 14px;
          right: 14px;
        }
        .features__tile-title {
          font-family: 'Gelica', 'Fraunces Variable', 'Fraunces', Georgia, serif;
          font-size: 18px;
          font-weight: 600;
          line-height: 1.25;
          letter-spacing: -0.01em;
          color: #1a140d;
          margin: 0 0 6px;
        }
        .features__tile--flower .features__tile-title {
          font-size: 18px;
          line-height: 1.25;
          margin: 0;
        }
        .features__tile-desc {
          font-family: 'SN Pro Variable', system-ui, sans-serif;
          font-size: 17px;
          font-weight: 400;
          line-height: 1.5;
          letter-spacing: -0.02em;
          font-feature-settings:
            'pnum' 1,
            'kern' 1,
            'liga' 1,
            'calt' 1;
          font-variant-numeric: proportional-nums;
          color: rgba(26, 20, 13, 0.65);
          margin: 0;
        }
        .features__next-group {
          max-width: 920px;
          margin: 80px auto 0;
        }
        .features__next-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 18px;
          margin-bottom: 24px;
        }
        .features__next-rule {
          flex: 1;
          height: 1px;
        }
        .features__next-header > .features__next-rule:first-child {
          background: linear-gradient(to right, transparent, rgba(26, 20, 13, 0.16));
        }
        .features__next-header > .features__next-rule:last-child {
          background: linear-gradient(to left, transparent, rgba(26, 20, 13, 0.16));
        }
        .features__next-label {
          font-family: 'SN Pro Variable', system-ui, sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(26, 20, 13, 0.55);
          white-space: nowrap;
          flex-shrink: 0;
        }
        .features__next-group .features__bento {
          margin-top: 0;
        }
        @media (max-width: 767px) {
          .features {
            padding: 56px 16px 80px;
          }
          .features__title {
            font-size: clamp(36px, 9vw, 56px);
            letter-spacing: -0.03em;
          }
          .features__bento {
            margin-top: 48px;
            grid-template-columns: 1fr;
            grid-auto-rows: auto;
            gap: 14px;
          }
          .features__tile,
          .features__tile--highlighted {
            grid-column: span 1;
            flex-direction: column;
            padding: 18px 18px 20px;
          }
          .features__next-group {
            margin-top: 56px;
          }
        }
      `})]})}export{S as default};
