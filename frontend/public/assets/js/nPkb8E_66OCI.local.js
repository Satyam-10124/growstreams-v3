/*! local plinthos loader */
const base='js/plinth/';
window.__PLINTHOS_CONFIG__={kitPath:'kK2frTERf8bx/prod',assetPath:'/assets/js/plinth'},window.__PLINTHOS_SNIPPET_CONFIG__={debug:!1,kitPath:'kK2frTERf8bx',staging:!1,disabled:!1,colorSpace:'srgb',stageContent:{},renderTargets:[{debug:!1,start:!0,ioStops:!0,ioStarts:!0,stageKey:'zeppy',antialias:!1,background:!0,instanceKey:'background',fadeDuration:1e3,maxPixelRatio:1.5,disableBindings:!1,disabled:!1}],colorManagement:!0,lazyLoadEnabled:!0,lazyLoadInterval:200,dataAttributePrefix:'pd',mutationObserverDebump:200,mutationObserverEnabled:!0,intersectionObserverEnabled:!0,intersectionObserverPriority:'lowest',snippetId:'nPkb8E_66OCI'};
import('./plinth/user-content.js').catch(e=>console.warn('plinth user-content failed',e));
setTimeout(()=>import('./plinth/prod-snippet.js').catch(e=>console.warn('plinth snippet failed',e)),100);
