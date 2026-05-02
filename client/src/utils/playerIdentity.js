import { isDeviceId } from './deviceId.js';

function normalizeRawName(input) {
  if (typeof input !== 'string') {
    return '';
  }

  return input.trim();
}

export function sanitizeDisplayName(rawName, { fallback = '玩家', isHost = false } = {}) {
  const normalizedName = normalizeRawName(rawName);

  if (!normalizedName) {
    return isHost ? '房主' : fallback;
  }

  if (normalizedName.startsWith('房主-') && isDeviceId(normalizedName.slice(3))) {
    return '房主';
  }

  if (isDeviceId(normalizedName)) {
    return isHost ? '房主' : fallback;
  }

  return normalizedName;
}

export function getPlayerDisplayName(player = null, { fallback = '玩家', selfLabel = null } = {}) {
  if (selfLabel) {
    return selfLabel;
  }

  return sanitizeDisplayName(player?.nickname || player?.id || '', {
    fallback,
    isHost: Boolean(player?.isHost),
  });
}

export function truncateDisplayName(name = '', maxLength = 14) {
  const normalizedName = normalizeRawName(name);

  if (!normalizedName) {
    return '';
  }

  return normalizedName.length > maxLength ? `${normalizedName.slice(0, Math.max(1, maxLength - 3))}...` : normalizedName;
}
