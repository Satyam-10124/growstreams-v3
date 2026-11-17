/**
 * Version Checker
 * Proactively detects when a new deployment is available by comparing
 * the build version embedded in the HTML with a fresh fetch.
 * This prevents chunk load errors by reloading before they occur.
 *
 * Event-driven: Only checks when page becomes visible or on navigation,
 * not on a periodic timer.
 */

(function () {
  'use strict';

  const VERSION_CHECK_KEY = 'last_version_check';
  const VERSION_CHECK_COOLDOWN = 10000; // Don't check more than once per 10 seconds
  const CURRENT_VERSION_KEY = 'current_build_version';
  const TAB_HIDDEN_TIME_KEY = 'tab_hidden_timestamp';

  // Get the build version from the window (injected by Vite plugin)
  const currentVersion = window.__BUILD_VERSION__;

  if (!currentVersion) {
    console.warn('⚠️ Build version not found - version checking disabled');
    return;
  }

  // Store the current version
  sessionStorage.setItem(CURRENT_VERSION_KEY, currentVersion);

  function forceHardReload() {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('force_refresh', Date.now().toString());
      window.location.href = url.toString();
    } catch (e) {
      window.location.reload();
    }
  }

  async function checkForNewVersion() {
    // Skip if we've checked recently
    const lastCheck = sessionStorage.getItem(VERSION_CHECK_KEY);
    const now = Date.now();

    if (lastCheck && now - parseInt(lastCheck, 10) < VERSION_CHECK_COOLDOWN) {
      return;
    }

    try {
      // Fetch the current page's HTML to get the latest build version
      // Use cache: 'no-store' to ensure we get fresh HTML
      const response = await fetch(window.location.href, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (response.ok) {
        const html = await response.text();
        // Extract the build version from the HTML
        const versionMatch = html.match(
          /window\.__BUILD_VERSION__\s*=\s*['"]([^'"]+)['"]/
        );

        if (versionMatch && versionMatch[1]) {
          const serverVersion = versionMatch[1];
          const clientVersion = sessionStorage.getItem(CURRENT_VERSION_KEY);

          // If versions don't match, a new deployment is available
          if (
            serverVersion !== clientVersion &&
            serverVersion !== currentVersion
          ) {
            console.log(
              `🔄 New version detected (${clientVersion} → ${serverVersion}). Reloading...`
            );
            sessionStorage.setItem(VERSION_CHECK_KEY, now.toString());
            sessionStorage.setItem(CURRENT_VERSION_KEY, serverVersion);
            // Small delay to let any ongoing operations complete
            setTimeout(() => {
              forceHardReload();
            }, 1000);
            return;
          }
        }
      }

      // Update last check timestamp
      sessionStorage.setItem(VERSION_CHECK_KEY, now.toString());
    } catch (error) {
      // Silently fail - version checking is best-effort
      // Don't spam console with errors
      console.debug('Version check failed (non-critical):', error.message);
    }
  }

  // Track when tab becomes hidden/visible
  let tabHiddenTime = null;

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // Tab hidden - store timestamp
      tabHiddenTime = Date.now();
      sessionStorage.setItem(TAB_HIDDEN_TIME_KEY, tabHiddenTime.toString());
    } else {
      // Tab visible - check if it's been hidden for a while (user might have been away)
      const hiddenTimestamp = sessionStorage.getItem(TAB_HIDDEN_TIME_KEY);
      if (hiddenTimestamp) {
        const hiddenDuration = Date.now() - parseInt(hiddenTimestamp, 10);
        // If tab was hidden for more than 30 seconds, check for updates
        // (user might have been away during a deployment)
        if (hiddenDuration > 30000) {
          setTimeout(() => {
            checkForNewVersion();
          }, 1000); // Small delay to let page settle
        }
      }
      tabHiddenTime = null;
      sessionStorage.removeItem(TAB_HIDDEN_TIME_KEY);
    }
  });

  // Check on page load (after a short delay to let page settle)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        checkForNewVersion();
      }, 3000);
    });
  } else {
    setTimeout(() => {
      checkForNewVersion();
    }, 3000);
  }

  // Check on window focus (user switches back to tab)
  window.addEventListener('focus', () => {
    // Only check if tab wasn't just hidden (to avoid double-checking)
    if (!document.hidden) {
      setTimeout(() => {
        checkForNewVersion();
      }, 1000);
    }
  });

  console.log('✅ Version checker initialized (event-driven)');
})();
