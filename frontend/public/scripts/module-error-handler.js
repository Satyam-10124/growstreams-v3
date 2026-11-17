/**
 * Module Error Handler
 * Detects and handles module loading errors that can occur after deployments
 * when users have cached HTML referencing old JavaScript files.
 */

(function () {
  // Track if we've already attempted a reload to prevent infinite loops
  const RELOAD_ATTEMPTED_KEY = 'module_reload_attempted';
  const RELOAD_TIMESTAMP_KEY = 'module_reload_timestamp';
  const RELOAD_COOLDOWN = 20000; // 20 seconds cooldown between auto-reloads

  function forceHardReload() {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('force_refresh', Date.now().toString());
      window.location.href = url.toString();
    } catch (e) {
      window.location.reload();
    }
  }

  function shouldAttemptReload() {
    const lastReload = sessionStorage.getItem(RELOAD_TIMESTAMP_KEY);
    if (!lastReload) return true;

    const timeSinceReload = Date.now() - parseInt(lastReload, 10);
    return timeSinceReload > RELOAD_COOLDOWN;
  }

  function handleModuleError(error) {
    // ONLY trigger for VERY SPECIFIC module loading errors
    // Be extremely conservative to avoid false positives
    const isSpecificModuleError =
      error &&
      error.message &&
      (error.message.includes('Failed to fetch dynamically imported module') ||
        (error.message.includes('Loading chunk') &&
          error.message.includes('failed')) ||
        error.message.includes('Importing a module script failed'));

    if (isSpecificModuleError) {
      console.warn(
        '🔄 SPECIFIC module loading error detected. This happens after deployments.',
        error
      );

      if (shouldAttemptReload()) {
        console.log(
          '🔄 Attempting reload in 8 seconds (giving time for error boundary)...'
        );
        sessionStorage.setItem(RELOAD_ATTEMPTED_KEY, 'true');
        sessionStorage.setItem(RELOAD_TIMESTAMP_KEY, Date.now().toString());

        // Wait 8 seconds to give error boundary time to handle it first
        setTimeout(() => {
          forceHardReload();
        }, 8000);
      } else {
        console.error(
          '❌ Multiple specific module errors detected. Manual refresh may be needed.'
        );
      }
    } else if (error) {
      // Log other errors but don't reload
      console.debug('Non-module error detected, not reloading:', error.message);
    }
  }

  // Listen for unhandled promise rejections (common for dynamic imports)
  window.addEventListener('unhandledrejection', event => {
    handleModuleError(event.reason);
  });

  // Listen for global errors
  window.addEventListener('error', event => {
    handleModuleError(event.error);
  });

  // Clear reload flags on successful page load
  window.addEventListener('load', () => {
    // Clear the attempted flag after successful load
    sessionStorage.removeItem(RELOAD_ATTEMPTED_KEY);
    // Clean up the force_refresh URL parameter if it exists
    // This keeps the URL clean for the user
    if (window.location.search.includes('force_refresh')) {
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete('force_refresh');
        window.history.replaceState({}, document.title, url.toString());
      } catch (e) {
        console.warn('Could not clean up URL params', e);
      }
    }
  });

  // Clear any stale reload flags on page load
  const now = Date.now();
  const lastReload = sessionStorage.getItem(RELOAD_TIMESTAMP_KEY);
  if (lastReload && now - parseInt(lastReload, 10) > 30000) {
    // 30 seconds
    sessionStorage.removeItem(RELOAD_ATTEMPTED_KEY);
    sessionStorage.removeItem(RELOAD_TIMESTAMP_KEY);
    console.log('🧹 Cleared stale reload flags');
  }

  console.log('✅ Module error handler initialized');
})();
