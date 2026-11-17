function initApollo() {
  var cacheBuster = Math.random().toString(36).substring(7);
  var script = document.createElement('script');
  script.src =
    'https://assets.apollo.io/micro/website-tracker/tracker.iife.js?nocache=' +
    cacheBuster;
  script.async = true;
  script.defer = true;
  script.onload = function () {
    window.trackingFunctions.onLoad({
      appId: '6910fd7238730b000dc0500a',
    });
  };
  document.head.appendChild(script);
}

initApollo();
