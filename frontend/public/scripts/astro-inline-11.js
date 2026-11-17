
    !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys getNextSurveyStep onSessionId".split(" ");for(n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
    posthog.init('phc_mevo39heWzHfMwQWQ5Q8LPsHviHFE3inpgdeWYExbVBH', {
      api_host: 'https://eu.i.posthog.com',
      ui_host: 'https://eu.posthog.com',
      defaults: '2025-05-24',
      capture_pageview: false,
      capture_pageleave: true,
      disable_surveys_automatic_display: true,
      bootstrap: {"distinctID":"c56c17cd-8756-4fed-8719-0046c8f32683","isIdentifiedID":false,"featureFlags":{"accounts-and-feature-requests":true,"sidecar-messaging-cta":"control","website-journey-step-1-agents-copy":"control","website-new-blog-cms":true,"survey-targeting-d47ca73c85-custom":true,"artifact-sync":false,"sidecar-messaging-headline":"steering","onboarding-improvements-step":false,"delivery-lifecycle":false,"wrapped":false,"desktop-mcp-insights-agent-workflow":false,"website-journey-step-3-less-steering-copy":"copy-04","desktop-conversation-continuation-menu":false,"survey-targeting-40aad02ced-custom":true,"pull-request-indicator":false,"sidecar-desktop-download-cta":true,"require-login-before-use":"login-required","cloud-improve-processing":false,"referral-share-prompt-placement":"page_footer","setup-audits-onboarding":true,"desktop-menu-bar-status-item":true,"website-journey-step-2-privacy-copy":"copy-03","sidecar-messaging-subtitle":"control-plane","job-board":false},"featureFlagPayloads":{"sidecar-messaging-cta":{"downloadLabel":"Launch App","mobileDownloadLabel":"Email me a download link for later","waitlistLabel":"Join waitlist","waitlistLoadingLabel":"Joining..."},"website-journey-step-1-agents-copy":{"title":"All Your Agents, in Focus","description":"See what every agent is doing and the rules, skills, and instructions guiding its work."},"website-journey-step-3-less-steering-copy":{"title":"See Every Change Before It Lands","description":"Review the evidence and exact diff, then apply, dismiss, or save the suggestion for later."},"sidecar-desktop-download-cta":{"platforms":["mac","linux","windows"]},"website-journey-step-2-privacy-copy":{"title":"Local From the Start","description":"Your conversation history is stored locally on your device."},"sidecar-messaging-subtitle":{"text":"Rules, skills, hooks and corrections pile up in every harness. Blume sees the whole graph and keeps it maintained."}}},
      loaded: function(posthog) {
        var telemetryProperties = {"app_product":"blume","app_surface":"marketing","app_client":"website","site_domain":"blume.codes"};
        posthog.register(telemetryProperties);
        posthog.capture('$pageview', telemetryProperties);
        var exposures = [{"flag":"sidecar-messaging-headline","variant":"steering"},{"flag":"sidecar-messaging-subtitle","variant":"control-plane"},{"flag":"sidecar-messaging-cta","variant":"control"},{"flag":"sidecar-desktop-download-cta","variant":"true"},{"flag":"job-board","variant":"false"}];
        exposures.forEach(function (exposure) {
          try {
            var dedupeKey = 'ph_exposed_' + exposure.flag + '_' + exposure.variant;
            if (sessionStorage.getItem(dedupeKey)) return;
            sessionStorage.setItem(dedupeKey, '1');
          } catch (err) {
            // sessionStorage unavailable (private mode) — fall through and emit.
          }
          posthog.capture('$feature_flag_called', {
            $feature_flag: exposure.flag,
            $feature_flag_response: exposure.variant,
          });
        });
      },
    });
    