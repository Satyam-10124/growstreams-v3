"use client";

import { useEffect } from "react";

// Classic site scripts, injected sequentially AFTER React hydration so their
// DOM mutations (Lenis wrappers, Plinthos canvas, wowo classes) are preserved.
const INLINE_SNIPPETS = [
  // tab-focus helper (was inline in original page)
  `function handleFirstTab(e){if(e.keyCode===9){document.body.classList.add('user-is-tabbing');window.removeEventListener('keydown',handleFirstTab);}}\nwindow.addEventListener('keydown',handleFirstTab);`,
];

function loadScript(src: string, isModule = false): Promise<void> {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    if (isModule) s.type = "module";
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`failed: ${src}`));
    document.body.appendChild(s);
  });
}

function runInline(code: string) {
  const s = document.createElement("script");
  s.text = code;
  document.body.appendChild(s);
}

export default function SiteScripts() {
  useEffect(() => {
    let cancelled = false;

    // Dynamically inject stylesheet so it unloads on exit
    const styleLink = document.createElement("link");
    styleLink.rel = "stylesheet";
    styleLink.href = "/assets/css/style.css";
    document.head.appendChild(styleLink);

    // Force scroll to top on mount before Lenis and GSAP hijack scroll
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    
    // Set body scroll restoration to manual before anything runs
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }

    (async () => {
      for (const code of INLINE_SNIPPETS) runInline(code);

      // BATCH 1: Load jQuery in parallel
      await Promise.all([
        loadScript("/assets/js/jquery-3.7.1.min.js"),
      ]).catch(() => {});

      if (cancelled) return;

      // BATCH 2: Load remaining deps in parallel (they don't depend on each other)
      await Promise.all([
        loadScript("/assets/js/slick.min.js"),
        loadScript("/assets/js/jquery.cookie.js"),
        loadScript("/assets/js/splide.min.js"),
        loadScript("/assets/js/splide-extension-auto-scroll.min.js"),
        loadScript("/assets/js/prism.min.js"),
        loadScript("/assets/js/prism-json.min.js"),
        loadScript("/assets/js/prism-line-numbers.min.js"),
        loadScript("/assets/js/js.cookie.min.js"),
        loadScript("/assets/js/animateNumber.js"),
      ]).catch(() => {});

      if (cancelled) return;

      // BATCH 3: script.js needs jQuery + Lenis ready — load it last
      await loadScript("/assets/js/script.js").catch(() => {});

      if (cancelled) return;

      // BATCH 4: Optional/non-critical scripts
      await Promise.all([
        loadScript("/cpresources/31027a9f/jquery.js"),
        loadScript("/cpresources/958cd201/yii.js"),
        loadScript("/assets/js/plinth-digital.js"),
      ]).catch(() => {});

      if (!cancelled) {
        await loadScript("/assets/js/nPkb8E_66OCI.local.js", true).catch(() => {});
      }
    })();

    return () => {
      cancelled = true;
      if (document.head.contains(styleLink)) {
        document.head.removeChild(styleLink);
      }
    };
  }, []);

  return null;
}
