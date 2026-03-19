export function resolveServerOrigin(locationLike = window.location) {
  const { protocol = 'http:', hostname = 'localhost', port = '', origin } = locationLike;

  if (port === '5173') {
    return origin || `${protocol}//${hostname}:5173`;
  }

  return origin || `${protocol}//${hostname}${port ? `:${port}` : ''}`;
}
