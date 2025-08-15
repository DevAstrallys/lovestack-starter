import type { BunPlugin } from 'bun';

// Bun configuration to optimize build performance
export default {
  install: {
    // Increase timeout for slow network connections
    timeout: '300s',
    // Use faster registry
    registry: 'https://registry.npmjs.org/',
    // Enable parallel downloads
    parallel: true,
    // Retry on failure
    retry: 3,
  },
  // Optimize build performance
  build: {
    target: 'bun',
    // Enable parallel processing
    parallel: true,
  },
  // Development server optimizations
  dev: {
    // Faster hot reload
    hot: true,
  },
};