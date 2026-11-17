import{g as A}from"./journeyFlowerCrowns.DUkvtA6v.js";
import"./style.DvmLeqGT.js";

(function(){
  if(typeof window>"u"||typeof document>"u")return;
  
  let currentJourney = null;
  let currentN = 0;
  
  function initJourney(a) {
    if (a.dataset.journeyInitialized) return;
    a.dataset.journeyInitialized = "true";
    currentJourney = a;

    const o=a.querySelector(".journey__draw-line"),
          i=Array.from(a.querySelectorAll(".journey__path-progress"));
    if(!o)return;

    const n=o.getTotalLength();
    currentN = n;
    for(const t of i) t.style.strokeDasharray=`${n}`;

    const l=Array.from(a.querySelectorAll(".journey__sprout")).map(t=>({
      el:t,
      at:Number(t.dataset.at??"1"),
      angle:Number(t.dataset.angle??"0")
    }));

    for(const t of l){
      const c=n*t.at,
            u=o.getPointAtLength(c),
            f=o.getPointAtLength(Math.max(0,c-2)),
            s=o.getPointAtLength(Math.min(n,c+2)),
            e=Math.atan2(s.y-f.y,s.x-f.x)*180/Math.PI+t.angle;
      t.el.dataset.layoutRotation=e.toFixed(2);
      t.el.setAttribute("transform",`translate(${u.x.toFixed(2)} ${u.y.toFixed(2)}) rotate(${e.toFixed(2)})`);
      const r=t.el.querySelector(".journey__flower-crown-rotation");
      if(r){
        const m=Number(r.dataset.baseRotation??"0"),
              w=A(t.el.dataset.flowerSpecies,m,e);
        r.setAttribute("transform",`rotate(${w} ${r.dataset.crownX} ${r.dataset.crownY})`);
      }
    }

    if(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches){
      for(const t of i)t.style.strokeDashoffset="0";
      for(const t of l)t.el.classList.add("is-visible");
      return;
    }

    for(const t of i) t.style.strokeDashoffset=`${n}`;
    updateScroll();
  }
  
  let d=!1;
  const updateScroll=function(){
    d=!1;
    const a = document.querySelector(".journey");
    if (!a || !currentN) return;
    
    const t=a.getBoundingClientRect(),
          f=(window.innerHeight*.25-t.top)/t.height,
          s=Math.max(0,Math.min(1,f)),
          p=`${currentN*(1-s)}`;
          
    const i = Array.from(a.querySelectorAll(".journey__path-progress"));
    for(const e of i) e.style.strokeDashoffset=p;
    
    const l = Array.from(a.querySelectorAll(".journey__sprout"));
    for(const e of l) {
      const at = Number(e.dataset.at??"1");
      e.classList.toggle("is-visible",s>=at);
    }
  };

  const h=function(){d||(d=!0,requestAnimationFrame(updateScroll))};
  window.addEventListener("scroll",h,{passive:!0});
  window.addEventListener("resize",h,{passive:!0});

  document.querySelectorAll(".journey").forEach(initJourney);

  const observer = new MutationObserver(() => {
    document.querySelectorAll(".journey").forEach(initJourney);
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
