export function resolveDevProxyTarget(env = process.env) {
  return env.VITE_SERVER_ORIGIN || 'http://localhost:3001';
}
