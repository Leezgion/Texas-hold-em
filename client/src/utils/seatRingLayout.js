export function resolveTableDiameter({ viewportWidth = 0, roomShellLayout = 'stacked' } = {}) {
  if (viewportWidth < 480) {
    return 208;
  }

  if (viewportWidth < 768) {
    return 256;
  }

  return roomShellLayout === 'split-stage' ? 352 : 320;
}

export function getSeatRingLayoutProfile({
  viewportWidth = 0,
  roomShellLayout = 'stacked',
  tableDiameter,
} = {}) {
  const resolvedTableDiameter = Number(tableDiameter) || resolveTableDiameter({ viewportWidth, roomShellLayout });

  if (viewportWidth < 480) {
    return {
      tableDiameter: resolvedTableDiameter,
      cardWidth: 70,
      cardHeight: 128,
      horizontalGap: 6,
      verticalGap: 16,
    };
  }

  if (viewportWidth < 768) {
    return {
      tableDiameter: resolvedTableDiameter,
      cardWidth: 90,
      cardHeight: 72,
      horizontalGap: 10,
      verticalGap: 18,
    };
  }

  return {
    tableDiameter: resolvedTableDiameter,
    cardWidth: roomShellLayout === 'three-column' ? 136 : 132,
    // Tactical Arena seat plaques render taller than the visual card body
    // once badges, status rows, and the live-turn marker are present.
    cardHeight: 144,
    horizontalGap: roomShellLayout === 'three-column' ? 14 : 10,
    verticalGap: roomShellLayout === 'three-column' ? 18 : 22,
  };
}

function roundPosition(x = 0, y = 0) {
  return {
    x: Math.round(x),
    y: Math.round(y),
  };
}

export function buildSeatRingPositions({
  playerCount = 0,
  viewportWidth = 0,
  roomShellLayout = 'stacked',
  tableDiameter,
} = {}) {
  const safePlayerCount = Math.max(2, Number(playerCount) || 0);
  const profile = getSeatRingLayoutProfile({
    viewportWidth,
    roomShellLayout,
    tableDiameter,
  });
  const tableRadius = profile.tableDiameter / 2;
  const horizontalSafe = tableRadius + profile.cardWidth / 2 + profile.horizontalGap;
  const verticalSafe = tableRadius + profile.cardHeight / 2 + profile.verticalGap;

  switch (safePlayerCount) {
    case 2:
      return [
        roundPosition(0, verticalSafe),
        roundPosition(0, -verticalSafe),
      ];
    case 3:
      return [
        roundPosition(0, verticalSafe),
        roundPosition(-(horizontalSafe * 0.8), -(verticalSafe * 0.58)),
        roundPosition(horizontalSafe * 0.8, -(verticalSafe * 0.58)),
      ];
    case 4:
      return [
        roundPosition(0, verticalSafe),
        roundPosition(-horizontalSafe, 0),
        roundPosition(0, -verticalSafe),
        roundPosition(horizontalSafe, 0),
      ];
    case 5:
      return [
        roundPosition(0, verticalSafe),
        roundPosition(-(horizontalSafe * 0.96), verticalSafe * 0.34),
        roundPosition(-(horizontalSafe * 0.66), -(verticalSafe * 0.84)),
        roundPosition(horizontalSafe * 0.66, -(verticalSafe * 0.84)),
        roundPosition(horizontalSafe * 0.96, verticalSafe * 0.34),
      ];
    case 6:
      return [
        roundPosition(0, verticalSafe),
        roundPosition(-horizontalSafe, verticalSafe * 0.5),
        roundPosition(-horizontalSafe, -(verticalSafe * 0.5)),
        roundPosition(0, -verticalSafe),
        roundPosition(horizontalSafe, -(verticalSafe * 0.5)),
        roundPosition(horizontalSafe, verticalSafe * 0.5),
      ];
    default: {
      const positions = [];
      const ellipseX = horizontalSafe;
      const ellipseY = verticalSafe;

      for (let index = 0; index < safePlayerCount; index += 1) {
        const angle = Math.PI / 2 + (index * 2 * Math.PI) / safePlayerCount;
        positions.push(roundPosition(ellipseX * Math.cos(angle), ellipseY * Math.sin(angle)));
      }

      return positions;
    }
  }
}
