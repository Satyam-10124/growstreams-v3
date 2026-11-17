/* GrowStreams GSAP Scroll-Triggered UI */
(function () {
  'use strict';

  function loadGSAP(cb) {
    if (window.gsap && window.ScrollTrigger) return cb();
    const s1 = document.createElement('script');
    s1.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js';
    s1.onload = function () {
      const s2 = document.createElement('script');
      s2.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js';
      s2.onload = cb;
      document.head.appendChild(s2);
    };
    document.head.appendChild(s1);
  }

  function initHeroWidget() {
    // Animate rate counter continuously
    const rateEl = document.getElementById('gs-hw-rate');
    const streamsEl = document.getElementById('gs-hw-streams');
    const blocksEl = document.getElementById('gs-hw-blocks');
    if (!rateEl) return;

    let rateBase = 12.4, blocksCount = 42891;

    // Initial count-up
    gsap.fromTo({val:0}, {val:12.4}, {
      duration: 2,
      ease: 'power2.out',
      onUpdate: function() { if(rateEl) rateEl.textContent = this.targets()[0].val.toFixed(2); }
    });
    gsap.fromTo({val:0}, {val:4482}, {
      duration: 2.2,
      ease: 'power3.out',
      onUpdate: function() { if(streamsEl) streamsEl.textContent = Math.round(this.targets()[0].val); }
    });
    gsap.fromTo({val:0}, {val:42891}, {
      duration: 2.5,
      ease: 'power3.out',
      onUpdate: function() { if(blocksEl) blocksEl.textContent = Math.round(this.targets()[0].val).toLocaleString(); }
    });

    // Live-ish ticker: slightly jitter the rate and blocks every 1.5s
    setInterval(() => {
      rateBase += (Math.random() - 0.48) * 0.3;
      rateBase = Math.max(10, Math.min(16, rateBase));
      blocksCount += Math.floor(Math.random() * 3) + 1;
      if (rateEl) rateEl.textContent = rateBase.toFixed(2);
      if (blocksEl) blocksEl.textContent = blocksCount.toLocaleString();
    }, 1500);

    // Animate rows in
    const rows = document.querySelectorAll('.gs-hw-row');
    rows.forEach((row, i) => {
      gsap.fromTo(row,
        { opacity: 0, x: -12 },
        { opacity: 1, x: 0, duration: 0.5, delay: 0.6 + i * 0.1, ease: 'power2.out' }
      );
    });
  }


  function initStreamCounter(el) {
    const target = parseFloat(el.dataset.target);
    const suffix = el.dataset.suffix || '';
    const decimals = el.dataset.decimals ? parseInt(el.dataset.decimals) : 0;
    let obj = { val: 0 };
    gsap.to(obj, {
      val: target,
      duration: 2.2,
      ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      onUpdate: () => {
        el.textContent = obj.val.toFixed(decimals) + suffix;
      }
    });
  }

  function initLiveTicker(container) {
    const items = container.querySelectorAll('.gs-ticker__item');
    let i = 0;
    items[0].classList.add('gs-ticker__item--active');
    setInterval(() => {
      items[i].classList.remove('gs-ticker__item--active');
      i = (i + 1) % items.length;
      items[i].classList.add('gs-ticker__item--active');
    }, 2200);
  }

  function initStreamBar(bar) {
    const pct = parseFloat(bar.dataset.pct) || 75;
    gsap.to(bar.querySelector('.gs-bar__fill'), {
      width: pct + '%',
      duration: 1.8,
      ease: 'power3.out',
      scrollTrigger: { trigger: bar, start: 'top 85%', once: true }
    });
  }

  function animateCards() {
    const cards = document.querySelectorAll('.gs-card');
    cards.forEach((card, idx) => {
      gsap.fromTo(card,
        { opacity: 0, y: 48 },
        {
          opacity: 1, y: 0,
          duration: 0.72,
          ease: 'power3.out',
          delay: idx * 0.12,
          scrollTrigger: { trigger: card, start: 'top 88%', once: true }
        }
      );
    });

    const statBlocks = document.querySelectorAll('.gs-stat');
    statBlocks.forEach((s, idx) => {
      gsap.fromTo(s,
        { opacity: 0, scale: 0.88 },
        {
          opacity: 1, scale: 1,
          duration: 0.6,
          ease: 'back.out(1.4)',
          delay: idx * 0.1,
          scrollTrigger: { trigger: s, start: 'top 88%', once: true }
        }
      );
    });

    // Headline chars animation
    const headline = document.querySelector('.gs-section__headline');
    if (headline) {
      gsap.fromTo(headline,
        { opacity: 0, y: 30 },
        {
          opacity: 1, y: 0,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: { trigger: headline, start: 'top 85%', once: true }
        }
      );
    }

    // Floating flow line
    const line = document.querySelector('.gs-flow-line');
    if (line) {
      gsap.fromTo(line,
        { scaleX: 0, transformOrigin: 'left center' },
        {
          scaleX: 1,
          duration: 1.5,
          ease: 'power2.inOut',
          scrollTrigger: { trigger: line, start: 'top 85%', once: true }
        }
      );
    }

    // Stream pulse dots
    document.querySelectorAll('.gs-pulse').forEach((dot, i) => {
      gsap.to(dot, {
        scale: 1.35,
        opacity: 0.4,
        duration: 0.8,
        repeat: -1,
        yoyo: true,
        delay: i * 0.25,
        ease: 'sine.inOut'
      });
    });
  }

  function init() {
    gsap.registerPlugin(ScrollTrigger);
    initHeroWidget();
    animateCards();
    document.querySelectorAll('[data-counter]').forEach(initStreamCounter);
    document.querySelectorAll('.gs-ticker').forEach(initLiveTicker);
    document.querySelectorAll('.gs-bar').forEach(initStreamBar);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => loadGSAP(init));
  } else {
    loadGSAP(init);
  }
})();
