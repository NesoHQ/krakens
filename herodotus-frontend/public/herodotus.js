/**
 * Herodotus Analytics - Tracking SDK
 * Lightweight analytics tracking script
 */
(function() {
  'use strict';

  const config = {
    apiUrl: 'http://localhost:8080/api/track',
    apiKey: null,
    visitorId: null,
  };

  // Generate or retrieve visitor ID
  function getVisitorId() {
    let visitorId = localStorage.getItem('hrd_visitor_id');
    if (!visitorId) {
      visitorId = 'v_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
      localStorage.setItem('hrd_visitor_id', visitorId);
    }
    return visitorId;
  }

  // Track page view
  function track(data) {
    if (!config.apiKey) {
      console.error('Herodotus: API key not set');
      return;
    }

    const payload = {
      path: data.path || window.location.pathname,
      referrer: data.referrer || document.referrer,
      user_agent: navigator.userAgent,
      visitor_id: config.visitorId,
    };

    // Use fetch with API key header
    fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.apiKey,
      },
      body: JSON.stringify(payload),
      keepalive: true,
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(err => {
          console.error('Herodotus tracking failed:', err);
        });
      }
      console.log('Herodotus: Event tracked successfully');
    })
    .catch(err => console.error('Herodotus tracking error:', err));
  }

  // Initialize
  function init(apiKey, options = {}) {
    if (!apiKey) {
      console.error('Herodotus: API key is required');
      return;
    }

    config.apiKey = apiKey;
    config.visitorId = getVisitorId();
    
    if (options.apiUrl) {
      config.apiUrl = options.apiUrl;
    }

    console.log('Herodotus initialized:', {
      apiUrl: config.apiUrl,
      visitorId: config.visitorId
    });

    // Track initial page view
    track({});

    // Track page changes for SPAs
    let lastPath = window.location.pathname;
    setInterval(() => {
      if (window.location.pathname !== lastPath) {
        lastPath = window.location.pathname;
        track({});
      }
    }, 500);
  }

  // Expose API
  window.Herodotus = {
    init: init,
    track: track,
  };
})();
