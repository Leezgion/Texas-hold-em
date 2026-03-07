export function resolveServerOrigin(locationLike = window.location) {
  const { protocol = 'http:', hostname = 'localhost', port = '', origin } = locationLike;

  if (port === '5173') {
    return `${protocol}//${hostname}:3001`;
  }

  return origin || `${protocol}//${hostname}${port ? `:${port}` : ''}`;
}
