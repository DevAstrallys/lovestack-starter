/**
 * Centralized app configuration.
 * When migrating to Capacitor, change AUTH_REDIRECT_URL to your deep-link scheme (e.g. myapp://)
 */

/** 
 * Auth redirect URL for email confirmations, magic links, password resets.
 * Capacitor: change to your custom scheme, e.g. 'myapp://auth/callback'
 */
export const AUTH_REDIRECT_URL = `${typeof window !== 'undefined' ? window.location.origin : ''}/`;

/**
 * Password reset redirect URL.
 * Capacitor: change to 'myapp://reset-password'
 */
export const AUTH_RESET_PASSWORD_URL = `${typeof window !== 'undefined' ? window.location.origin : ''}/reset-password`;
