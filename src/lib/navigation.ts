/**
 * Navigation abstraction layer.
 * Currently uses browser APIs. When migrating to Capacitor,
 * swap implementations to use @capacitor/browser and @capacitor/app plugins.
 */

/**
 * Open an external URL (or internal route in a new tab).
 * Capacitor: replace with `import { Browser } from '@capacitor/browser'; Browser.open({ url })`
 */
export function openExternalLink(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Open an internal route in a new tab/window.
 * Capacitor: replace with in-app navigation or Browser plugin.
 */
export function openInternalRoute(path: string): void {
  const fullUrl = `${getBaseUrl()}${path}`;
  window.open(fullUrl, '_blank');
}

/**
 * Close the current window/tab gracefully.
 * Capacitor: replace with `import { App } from '@capacitor/app'; App.exitApp()` or navigate back.
 */
export function closeCurrentView(fallbackNavigate?: (path: string) => void): void {
  if (fallbackNavigate) {
    fallbackNavigate('/');
    return;
  }
  // window.close() only works on windows opened by script
  try {
    window.close();
  } catch {
    // fallback: go home
    window.location.href = '/';
  }
}

/**
 * Navigate to an internal route (replaces window.location.href = ...).
 * Capacitor: this is fine as-is since Capacitor uses the webview router.
 * Prefer using React Router's navigate() when possible.
 */
export function navigateTo(path: string): void {
  window.location.href = path;
}

/**
 * Get the base URL of the application.
 * Capacitor: replace with the configured deep-link scheme or published URL.
 */
export function getBaseUrl(): string {
  return window.location.origin;
}
