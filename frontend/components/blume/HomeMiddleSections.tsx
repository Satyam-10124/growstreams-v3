'use client';

import React, { useEffect } from 'react';
import { CommunityGardenSection } from './CommunityGarden';

export function HomeMiddleSections() {
  useEffect(() => {
    const NS = 'http://www.w3.org/2000/svg';
    const $ = (s: string, r: Document | HTMLElement = document) => r.querySelector(s) as any;
    const mk = (t: string, a: any = {}, p?: any) => {
      const e = document.createElementNS(NS, t);
      for (const k in a) e.setAttribute(k, a[k]);
      if (p) p.appendChild(e);
      return e;
    };
    const RM = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

    /* network illustration */
    (() => {
      const s = $('#net');
      if (!s) return;
      s.innerHTML = '';
      const N = [
        [180, 130, 'c'], [70, 70, 'p'], [290, 60, 'd'],
        [60, 190, 'd'], [300, 190, 'p'], [180, 40, 'p'],
        [170, 225, 'p'], [110, 130, 'p'], [250, 125, 'd']
      ];
      const L = [
        [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7], [0, 8],
        [1, 5], [5, 2], [3, 7], [4, 8], [3, 6], [6, 4], [1, 7], [2, 8]
      ];
      mk('circle', { class: 'rip', cx: 180, cy: 130, r: 150 }, s);
      mk('circle', { class: 'rip', cx: 180, cy: 130, r: 150, style: 'animation-delay:-2.5s' }, s);
      L.forEach(([a, b]) => mk('line', {
        x1: N[a][0], y1: N[a][1], x2: N[b][0], y2: N[b][1],
        class: 'ink', opacity: 0.45, 'stroke-width': 1.5
      }, s));
      N.forEach(([x, y, t], i) => {
        const st = `animation-delay:${-(i * 0.7)}s`;
        if (t == 'd') mk('rect', { class: 'ink sg nd', x: (x as number) - 13, y: (y as number) - 13, width: 26, height: 26, rx: 7, style: st }, s);
        else mk('circle', { class: (t == 'c' ? 'em ink' : 'ink sg') + ' nd', cx: x, cy: y, r: t == 'c' ? 15 : 11, style: st }, s);
      });
    })();

    /* vine */
    const wrap = $('#wrap');
    const svg = $('#vine');
    const chs = [...document.querySelectorAll('.ch')];
    
    let path: any, len: number, leaves: any[] = [], nodes: any[] = [], tip: any, flower: any, ghost: any;

    function build() {
      if (!wrap || !svg || chs.length === 0) return;
      svg.innerHTML = ''; leaves = []; nodes = [];
      const W = wrap.clientWidth, H = wrap.clientHeight, r = wrap.getBoundingClientRect(), mob = innerWidth <= 800, cx = mob ? 24 : W / 2, sw = mob ? 0 : 46;
      // Start vine below the .head element so it doesn't overlap title
      const headEl = wrap.querySelector('.head') as HTMLElement;
      const headH = headEl ? headEl.offsetHeight : 200;
      const pts = [[cx, headH]];
      chs.forEach((c, i) => {
        const b = c.getBoundingClientRect();
        pts.push([cx + (i % 2 ? sw : -sw), b.top - r.top + b.height / 2]);
      });
      pts.push([cx, H - 100]);

      let d = `M${pts[0][0]} ${pts[0][1]}`;
      for (let i = 1; i < pts.length; i++) {
        const [a, b] = [pts[i - 1], pts[i]], m = (a[1] + b[1]) / 2;
        d += `C${a[0]} ${m} ${b[0]} ${m} ${b[0]} ${b[1]}`;
      }

      const defs = mk('defs', {}, svg);
      const g = mk('linearGradient', { id: 'vg', x1: 0, y1: 0, x2: 0, y2: H, gradientUnits: 'userSpaceOnUse' }, defs);
      [[0, '#5eead4'], [0.1, '#34d399'], [0.3, '#10b981'], [1, '#14532d']].forEach(([o, c]) => mk('stop', { offset: o, 'stop-color': c }, g));

      ghost = mk('path', { d, fill: 'none', stroke: 'rgba(110,150,130,.28)', 'stroke-width': 1.5, 'stroke-dasharray': '2 7', 'stroke-linecap': 'round' }, svg);
      path = mk('path', { d, fill: 'none', stroke: 'url(#vg)', 'stroke-width': 3, 'stroke-linecap': 'round' }, svg);
      len = path.getTotalLength();
      path.style.strokeDasharray = len;

      /* leaves */
      const nL = 11;
      for (let i = 1; i <= nL; i++) {
        const at = len * (i / (nL + 1));
        const p = path.getPointAtLength(at), q = path.getPointAtLength(at + 2);
        const ang = Math.atan2(q.y - p.y, q.x - p.x) * 180 / Math.PI, sd = i % 2 ? 1 : -1;
        const lf = mk('path', {
          d: 'M0 0C6 -10 20 -10 26 0C20 10 6 10 0 0Z', fill: i % 3 ? '#10b981' : '#34d399', opacity: 0.9,
          transform: `translate(${p.x} ${p.y}) rotate(${ang + sd * 55}) scale(0)`
        }, svg);
        (lf as any)._at = at;
        (lf as any)._t = `translate(${p.x} ${p.y}) rotate(${ang + sd * 55})`;
        leaves.push(lf);
      }

      /* chapter nodes */
      chs.forEach((c, i) => {
        const [x, y] = pts[i + 1];
        const gg = mk('g', {}, svg);
        mk('circle', { cx: x, cy: y, r: 17, fill: '#f3f0e6', stroke: '#10b981', 'stroke-width': 2 }, gg);
        const t = mk('text', { x, y: y + 5, 'text-anchor': 'middle', style: 'font:600 15px Bricolage Grotesque,sans-serif', fill: '#0c1a17' }, gg);
        t.textContent = (i + 1).toString();

        let best = 0, bd = 1e9;
        for (let l = 0; l < len; l += 6) {
          const p = path.getPointAtLength(l), dd = Math.abs(p.y - y);
          if (dd < bd) { bd = dd; best = l; }
        }
        (gg as any)._at = best;
        (gg as any)._c = gg.firstChild;
        (gg as any)._t = t;
        nodes.push(gg);
      });

      /* flower */
      const e = path.getPointAtLength(len);
      flower = mk('g', { transform: `translate(${e.x} ${e.y}) scale(0)` }, svg);
      (flower as any)._t = `translate(${e.x} ${e.y})`;
      for (let k = 0; k < 6; k++) mk('ellipse', { cx: 0, cy: -16, rx: 7, ry: 14, fill: k % 2 ? '#34d399' : '#10b981', transform: `rotate(${k * 60})` }, flower);
      mk('circle', { r: 6, fill: '#f3f0e6' }, flower);

      tip = mk('circle', { r: 6, fill: '#5eead4' }, svg);
      tip.style.filter = 'drop-shadow(0 0 6px #34d399)';

      update();
    }

    function update() {
      if (!path) return;
      const r = wrap.getBoundingClientRect(), p = RM ? 1 : Math.min(1, Math.max(0, (innerHeight * 0.85 - r.top) / r.height)), at = len * p;
      path.style.strokeDashoffset = len - at;
      const t = path.getPointAtLength(at);
      tip.setAttribute('cx', t.x);
      tip.setAttribute('cy', t.y);
      tip.style.opacity = p > 0.995 ? 0 : 1;

      leaves.forEach(l => {
        l.setAttribute('transform', l._t + ` scale(${at >= l._at ? 1 : 0})`);
        l.style.transition = 'transform .5s cubic-bezier(.3,1.6,.5,1)';
      });
      nodes.forEach((n, i) => {
        const on = at >= n._at;
        n._c.setAttribute('fill', on ? '#10b981' : '#f3f0e6');
        n._t.setAttribute('fill', on ? '#fff' : '#0c1a17');
        chs[i].classList.toggle('on', on);
      });
      flower.setAttribute('transform', flower._t + ` scale(${p > 0.985 ? 1 : 0})`);
      flower.style.transition = 'transform .8s cubic-bezier(.3,1.6,.5,1)';
    }

    const scrollHandler = () => requestAnimationFrame(update);
    window.addEventListener('scroll', scrollHandler, { passive: true });
    
    let rt: any;
    const resizeHandler = () => { clearTimeout(rt); rt = setTimeout(build, 120); };
    window.addEventListener('resize', resizeHandler);

    if (document.fonts) {
      document.fonts.ready.then(build);
    } else {
      build();
    }

    /* live numbers */
    let c = 4482, tVal = 125121032;
    const f = (n: number) => Math.round(n).toLocaleString('en-US');
    const n2Interval = setInterval(() => {
      tVal += 1.24;
      const el = $('#n2');
      if (el) el.textContent = f(tVal);
    }, 100);
    const n1Interval = setInterval(() => {
      c += Math.random() < 0.4 ? 1 : 0;
      const el = $('#n1');
      if (el) el.textContent = f(c);
    }, 2500);

    return () => {
      window.removeEventListener('scroll', scrollHandler);
      window.removeEventListener('resize', resizeHandler);
      clearInterval(n1Interval);
      clearInterval(n2Interval);
    };
  }, []);

  return (
    <div className="home-middle-sections">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700&family=Space+Grotesk:wght@400;500&display=swap');

        .home-middle-sections {
          --ink: #0c1a17; --deep: #12372c; --paper: #f3f0e6; --sage: #dfe8da;
          --em: #10b981; --mint: #5eead4; --txt: #0c1a17; --mut: #4d5f58;
          --d: 'Bricolage Grotesque', 'Space Grotesk', system-ui, sans-serif;
          --b: 'Space Grotesk', system-ui, sans-serif;
          color: var(--txt);
          font: 400 1.05rem/1.6 var(--b);
        }
        .home-middle-sections p {
          margin-block-start: 0;
          margin-block-end: 0;
        }

        /* journey */
        .home-middle-sections .journey { background: var(--paper); position: relative; z-index: 10; overflow: hidden; }
        .home-middle-sections .journey::before { content: ''; display: block; height: 60px; background: linear-gradient(to bottom, rgba(12,26,23,0.18), transparent); pointer-events: none; }
        .home-middle-sections .wrap { position: relative; max-width: 1120px; margin: 0 auto; padding: 0 1.25rem; }
        .home-middle-sections #vine { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; overflow: visible; }
        .home-middle-sections .head { min-height: 380px; padding-top: 60px; text-align: center; color: var(--txt); position: relative; z-index: 2; background: var(--paper); }
        .home-middle-sections .head h2 { font: 700 clamp(2.2rem, 5.5vw, 3.74rem)/1.05 var(--d); letter-spacing: -.03em; margin: 0 auto; max-width: 14ch; }
        .home-middle-sections .ch { position: relative; display: grid; grid-template-columns: 1fr 1fr; gap: 12%; align-items: center; min-height: 540px; padding: 40px 0; opacity: .25; transition: opacity .8s; }
        .home-middle-sections .ch.on { opacity: 1; }
        .home-middle-sections .ch:nth-child(odd) .art { order: 2; }
        .home-middle-sections .ch h3 { font: 600 clamp(1.8rem, 3.6vw, 2.9rem)/1.05 var(--d); letter-spacing: -.03em; margin: 0 0 1rem; color: var(--txt); }
        .home-middle-sections .ch p { color: var(--mut); max-width: 34ch; margin: 0; }
        .home-middle-sections .art svg { width: 100%; height: auto; display: block; overflow: visible; }
        .home-middle-sections .ink { fill: none; stroke: var(--ink); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
        .home-middle-sections .sg { fill: var(--sage); }
        .home-middle-sections .em { fill: var(--em); }
        .home-middle-sections .emS { fill: none; stroke: var(--em); stroke-width: 2; stroke-linecap: round; }
        .home-middle-sections .flow { fill: none; stroke: var(--em); stroke-width: 2; stroke-dasharray: 3 9; stroke-linecap: round; animation: fl 1.4s linear infinite; }
        @keyframes fl { to { stroke-dashoffset: -24; } }
        .home-middle-sections .dot { fill: var(--em); offset-rotate: 0deg; animation: mv 3.2s linear infinite; offset-distance: 0; }
        @keyframes mv { 0% { offset-distance: 0; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { offset-distance: 100%; opacity: 0; } }
        .home-middle-sections .tick { font: 600 14px var(--d); fill: var(--em); animation: tk 3.2s ease-in-out infinite; opacity: 0; }
        @keyframes tk { 0%, 70% { opacity: 0; transform: translateY(4px); } 85% { opacity: 1; transform: none; } 100% { opacity: 0; } }
        .home-middle-sections .tip { transform-box: fill-box; transform-origin: center; animation: gr 7s ease-in-out infinite; transform: scale(0); }
        @keyframes gr { 0%, 8% { transform: scale(0); } 22%, 86% { transform: scale(1); } 100% { transform: scale(0); } }
        .home-middle-sections .nd { transform-box: fill-box; transform-origin: center; animation: pl 4s ease-in-out infinite; }
        @keyframes pl { 50% { transform: scale(1.25); } }
        .home-middle-sections .rip { fill: none; stroke: var(--em); stroke-width: 1.5; transform-box: fill-box; transform-origin: center; animation: rp 5s ease-out infinite; opacity: 0; }
        @keyframes rp { 0% { transform: scale(.1); opacity: .7; } 100% { transform: scale(1); opacity: 0; } }
        
        /* numbers */
        .home-middle-sections .num { background: var(--paper); padding: 140px 0 100px; text-align: center; }
        .home-middle-sections .num p { font: 600 clamp(1.7rem, 4.4vw, 3.4rem)/1.2 var(--d); letter-spacing: -.025em; max-width: 22em; margin: 0 auto; padding: 0 1.25rem; color: var(--txt); }
        .home-middle-sections .num b { font-weight: 700; background: linear-gradient(transparent 68%, rgba(16,185,129,.35) 0); font-variant-numeric: tabular-nums; color: var(--txt); }
        .home-middle-sections .num small { display: block; max-width: 22em; margin: 2rem auto 0; padding: 0 1.25rem; color: var(--mut); }
        
        @media(max-width:800px) {
          .home-middle-sections .ch { grid-template-columns: 1fr; gap: 1.5rem; padding-left: 48px; min-height: 0; padding-top: 70px; padding-bottom: 70px; }
          .home-middle-sections .ch:nth-child(odd) .art { order: 0; }
          .home-middle-sections .head { text-align: left; padding-left: 48px; }
          .home-middle-sections .head h2 { margin: 0; }
        }
        @media(prefers-reduced-motion:reduce) {
          .home-middle-sections * { animation: none !important; transition: none !important; }
          .home-middle-sections .tip { transform: scale(1); }
          .home-middle-sections .ch { opacity: 1; }
          .home-middle-sections .stem { stroke-dashoffset: 0; }
          .home-middle-sections .bl { transform: none; }
        }
      `}</style>

      <section className="journey" id="how">
        <div className="wrap" id="wrap">
          <svg id="vine" aria-hidden="true"></svg>
          <div className="head"><h2>How the growth network works</h2></div>

          <article className="ch">
            <div className="txt"><h3>Stream value to people you trust</h3><p>Fund contributors and reward builders every second. Value flows to the people driving your community forward.</p></div>
            <div className="art">
              <svg viewBox="0 0 360 260" role="img" aria-label="One builder streaming value to three contributors">
                <circle className="sg" cx="62" cy="130" r="40" opacity=".6" />
                <circle className="ink sg" cx="62" cy="130" r="26" />
                <path className="flow" d="M88 122C150 100 220 70 290 54" />
                <path className="flow" d="M88 130C160 130 230 130 292 130" />
                <path className="flow" d="M88 138C150 160 220 192 290 208" />
                <circle className="dot" r="4.5" style={{ offsetPath: "path('M88 122C150 100 220 70 290 54')" }} />
                <circle className="dot" r="4.5" style={{ offsetPath: "path('M88 130C160 130 230 130 292 130')", animationDelay: "-1s" }} />
                <circle className="dot" r="4.5" style={{ offsetPath: "path('M88 138C150 160 220 192 290 208')", animationDelay: "-2s" }} />
                <g className="ink sg">
                  <circle cx="308" cy="50" r="16" />
                  <circle cx="310" cy="130" r="16" />
                  <circle cx="308" cy="210" r="16" />
                </g>
                <text className="tick" x="298" y="22">+</text>
                <text className="tick" x="300" y="102" style={{ animationDelay: "-1s" }}>+</text>
                <text className="tick" x="298" y="182" style={{ animationDelay: "-2s" }}>+</text>
              </svg>
            </div>
          </article>

          <article className="ch">
            <div className="txt"><h3>Grow your network, grow your impact</h3><p>Connect with DAOs, open source projects and communities. Your contributions earn rewards automatically.</p></div>
            <div className="art">
              <svg viewBox="0 0 360 260" role="img" aria-label="A plant whose branches end in people and DAOs">
                <ellipse className="sg" cx="180" cy="240" rx="120" ry="12" opacity=".7" />
                <path className="ink" d="M180 240C180 190 182 150 180 110M180 190C150 175 120 160 96 120M180 170C214 150 244 130 268 90M180 130C170 100 160 80 150 50M180 112C196 90 206 70 214 40" />
                <g className="ink sg">
                  <circle className="tip" cx="96" cy="112" r="14" style={{ animationDelay: "0s" }} />
                  <circle className="tip" cx="150" cy="40" r="14" style={{ animationDelay: ".5s" }} />
                  <rect className="tip" x="202" y="26" width="26" height="26" rx="7" style={{ animationDelay: "1s" }} />
                  <rect className="tip" x="256" y="76" width="26" height="26" rx="7" style={{ animationDelay: "1.5s" }} />
                </g>
                <circle className="tip em" cx="180" cy="100" r="9" style={{ animationDelay: "2s" }} />
                <circle className="emS" cx="96" cy="112" r="22" opacity=".5" />
              </svg>
            </div>
          </article>

          <article className="ch">
            <div className="txt"><h3>One network, instant and infinite</h3><p>Parallel, high-performance transactions let the whole network move together.</p></div>
            <div className="art">
              <svg id="net" viewBox="0 0 360 260" role="img" aria-label="A constellation of connected people and DAOs"></svg>
            </div>
          </article>
        </div>
      </section>

      <section className="num">
        <p>Right now <b id="n1">4,482</b> connections are growing at <b>12.4 GROW</b> a second. <b id="n2">125,121,032</b> GROW grown so far, with <b>0&nbsp;ms</b> of friction.</p>
        <small>Rewards settle block by block, with no middlemen and no delays.</small>
      </section>
      
      <CommunityGardenSection />
    </div>
  );
}
