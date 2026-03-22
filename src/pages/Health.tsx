/**
 * /health — Liveness / readiness probe for Docker & Kubernetes.
 * Returns a plain JSON response rendered in the page.
 * For a real container probe, a Vite plugin or nginx rewrite would serve
 * this as raw JSON; this React page is a pragmatic placeholder.
 */
const Health = () => {
  const payload = { status: 'ok', timestamp: Date.now() };
  return <pre style={{ fontFamily: 'monospace' }}>{JSON.stringify(payload)}</pre>;
};

export default Health;
