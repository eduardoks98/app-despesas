module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run start:web',
      startServerReadyPattern: 'ready',
      startServerReadyTimeout: 60000,
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/dashboard',
        'http://localhost:3000/transactions',
        'http://localhost:3000/categories',
        'http://localhost:3000/reports',
        'http://localhost:3000/analytics',
        'http://localhost:3000/upgrade',
      ],
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
        preset: 'desktop',
        formFactor: 'desktop',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0,
        },
        screenEmulation: {
          mobile: false,
          width: 1350,
          height: 940,
          deviceScaleFactor: 1,
          disabled: false,
        },
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.8 }],
        'categories:seo': ['warn', { minScore: 0.8 }],
        'categories:pwa': ['warn', { minScore: 0.8 }],
        
        // Core Web Vitals
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
        'speed-index': ['warn', { maxNumericValue: 3000 }],
        
        // Performance metrics
        'interactive': ['warn', { maxNumericValue: 3500 }],
        'max-potential-fid': ['warn', { maxNumericValue: 130 }],
        'server-response-time': ['warn', { maxNumericValue: 600 }],
        
        // Resource optimization
        'unused-javascript': ['warn', { maxNumericValue: 40000 }],
        'unused-css-rules': ['warn', { maxNumericValue: 20000 }],
        'render-blocking-resources': ['warn', { maxNumericValue: 100 }],
        'unminified-css': ['warn', { maxNumericValue: 10000 }],
        'unminified-javascript': ['warn', { maxNumericValue: 10000 }],
        
        // Image optimization
        'modern-image-formats': ['warn', { maxNumericValue: 85000 }],
        'offscreen-images': ['warn', { maxNumericValue: 75000 }],
        'uses-optimized-images': ['warn', { maxNumericValue: 85000 }],
        'uses-responsive-images': ['warn', { maxNumericValue: 85000 }],
        'uses-webp-images': ['warn', { maxNumericValue: 85000 }],
        
        // Accessibility
        'color-contrast': 'error',
        'image-alt': 'error',
        'label': 'error',
        'link-name': 'error',
        'button-name': 'error',
        
        // Best practices
        'uses-https': 'error',
        'no-vulnerable-libraries': 'error',
        'is-on-https': 'error',
        'geolocation-on-start': 'error',
        'notification-on-start': 'error',
        
        // SEO
        'document-title': 'error',
        'meta-description': 'warn',
        'http-status-code': 'error',
        'link-text': 'warn',
        
        // PWA
        'service-worker': 'warn',
        'installable-manifest': 'warn',
        'splash-screen': 'warn',
        'themed-omnibox': 'warn',
        'content-width': 'warn',
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
    server: {
      port: 9001,
      storage: {
        storageMethod: 'sql',
        sqlDialect: 'sqlite',
        sqlDatabasePath: './lighthouse-ci.db',
      },
    },
  },
};