export function resolveCommunityCardLayout({ viewportWidth = 0, tableDiameter = 0 } = {}) {
  const safeTableDiameter = Number(tableDiameter) || 208;

  if (viewportWidth < 480) {
    return {
      trayWidth: safeTableDiameter - 12,
      trayHeight: 60,
      safeWidth: safeTableDiameter - 12,
      cardWidth: 32,
      cardHeight: 48,
      gap: 4,
      cardDensity: 'compact',
      phaseVisible: false,
    };
  }

  if (viewportWidth < 768) {
    return {
      trayWidth: safeTableDiameter - 20,
      trayHeight: 68,
      safeWidth: safeTableDiameter - 20,
      cardWidth: 40,
      cardHeight: 58,
      gap: 6,
      cardDensity: 'compact',
      phaseVisible: true,
    };
  }

  return {
    trayWidth: Math.min(safeTableDiameter - 28, 308),
    trayHeight: 92,
    safeWidth: Math.min(safeTableDiameter - 40, 312),
    cardWidth: 52,
    cardHeight: 72,
    gap: 8,
    cardDensity: 'regular',
    phaseVisible: true,
  };
}

export function buildStageChromeLayout({ viewportWidth = 0, tableDiameter = 0, seatGuides = [] } = {}) {
  const safeTableDiameter = Number(tableDiameter) || 208;
  const communityLayout = resolveCommunityCardLayout({ viewportWidth, tableDiameter: safeTableDiameter });
  const compact = viewportWidth < 768;
  const padding = compact ? 96 : 132;
  const width = safeTableDiameter + padding * 2;
  const height = safeTableDiameter + padding * 2;
  const centerX = width / 2;
  const centerY = height / 2;
  const outerRx = safeTableDiameter / 2 + (compact ? 18 : 28);
  const outerRy = safeTableDiameter / 2 - (compact ? 6 : 10);
  const innerRx = outerRx - (compact ? 16 : 22);
  const innerRy = outerRy - (compact ? 12 : 16);
  const boardTrayWidth = Math.min(communityLayout.trayWidth + (compact ? 18 : 26), innerRx * 1.7);
  const boardTrayHeight = communityLayout.trayHeight + (compact ? 14 : 18);
  const guideRadius = compact ? 11 : 13;

  return {
    viewMode: compact ? 'compact' : 'wide',
    width,
    height,
    centerX,
    centerY,
    table: {
      outerRx,
      outerRy,
      innerRx,
      innerRy,
    },
    boardTray: {
      width: boardTrayWidth,
      height: boardTrayHeight,
      x: centerX - boardTrayWidth / 2,
      y: centerY - boardTrayHeight / 2,
      rx: compact ? 18 : 24,
    },
    guideRadius,
    seatGuides: (Array.isArray(seatGuides) ? seatGuides : []).map((seat) => ({
      seatIndex: seat.seatIndex,
      seatLabel: seat.seatLabel,
      markerLabel: seat.positionLabel || null,
      occupied: Boolean(seat.occupied),
      isCurrentTurn: Boolean(seat.isCurrentTurn),
      isHero: Boolean(seat.isCurrentPlayer),
      cx: centerX + (Number(seat.position?.x) || 0),
      cy: centerY + (Number(seat.position?.y) || 0),
    })),
  };
}
