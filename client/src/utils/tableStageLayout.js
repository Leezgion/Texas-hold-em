function clampNumber(value, fallback = 0) {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : fallback;
}

function resolveTableProfile({ viewportWidth = 0, tableProfile = null } = {}) {
  if (tableProfile === 'desktop-oval' || tableProfile === 'phone-oval') {
    return tableProfile;
  }

  return viewportWidth < 768 ? 'phone-oval' : 'desktop-oval';
}

export function resolveTableSurfaceLayout({
  viewportWidth = 0,
  tableDiameter = 0,
  tableProfile = null,
} = {}) {
  const profile = resolveTableProfile({ viewportWidth, tableProfile });
  const safeTableDiameter = clampNumber(tableDiameter, viewportWidth < 768 ? 208 : 320);

  if (profile === 'phone-oval') {
    return {
      profile,
      tableWidth: Math.round(safeTableDiameter * 1.02),
      tableHeight: Math.round(safeTableDiameter * 1.46),
      boardTrayInsetX: 20,
      boardTrayInsetY: 18,
      stageBandHeight: 40,
    };
  }

  return {
    profile,
    tableWidth: Math.round(safeTableDiameter * 1.72),
    tableHeight: Math.round(safeTableDiameter * 0.9),
    boardTrayInsetX: 26,
    boardTrayInsetY: 20,
    stageBandHeight: 46,
  };
}

export function resolveCommunityCardLayout({
  viewportWidth = 0,
  tableDiameter = 0,
  tableProfile = null,
} = {}) {
  const surface = resolveTableSurfaceLayout({
    viewportWidth,
    tableDiameter,
    tableProfile,
  });

  if (surface.profile === 'phone-oval') {
    const safeWidth = Math.max(surface.tableWidth - surface.boardTrayInsetX - 2, 190);
    return {
      tableProfile: surface.profile,
      trayWidth: safeWidth,
      trayHeight: 74,
      safeWidth,
      cardWidth: 34,
      cardHeight: 50,
      gap: 4,
      cardDensity: 'compact',
      phaseVisible: false,
    };
  }

  return {
    tableProfile: surface.profile,
    trayWidth: Math.min(surface.tableWidth - surface.boardTrayInsetX * 2, 332),
    trayHeight: 96,
    safeWidth: Math.min(surface.tableWidth - surface.boardTrayInsetX * 2, 336),
    cardWidth: 52,
    cardHeight: 72,
    gap: 8,
    cardDensity: 'regular',
    phaseVisible: true,
  };
}

export function buildStageChromeLayout({
  viewportWidth = 0,
  tableDiameter = 0,
  seatGuides = [],
  tableProfile = null,
} = {}) {
  const surface = resolveTableSurfaceLayout({
    viewportWidth,
    tableDiameter,
    tableProfile,
  });
  const communityLayout = resolveCommunityCardLayout({
    viewportWidth,
    tableDiameter,
    tableProfile: surface.profile,
  });
  const compact = surface.profile === 'phone-oval';
  const paddingX = compact ? 118 : 132;
  const paddingY = compact ? 108 : 112;
  const width = surface.tableWidth + paddingX * 2;
  const height = surface.tableHeight + paddingY * 2;
  const centerX = width / 2;
  const centerY = height / 2;
  const outerRx = surface.tableWidth / 2 + (compact ? 22 : 28);
  const outerRy = surface.tableHeight / 2 + (compact ? 22 : 26);
  const innerRx = outerRx - (compact ? 16 : 22);
  const innerRy = outerRy - (compact ? 18 : 20);
  const boardTrayWidth = Math.min(communityLayout.trayWidth + (compact ? 20 : 26), innerRx * 1.84);
  const boardTrayHeight = communityLayout.trayHeight + (compact ? 14 : 20);
  const guideRadius = compact ? 11 : 13;
  const stageBandWidth = Math.min(surface.tableWidth * 0.74, compact ? 182 : 316);
  const stageBandHeight = surface.stageBandHeight;
  const stageBandY = centerY - outerRy - stageBandHeight - (compact ? 18 : 24);

  return {
    profile: surface.profile,
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
      width: surface.tableWidth,
      height: surface.tableHeight,
    },
    stageBand: {
      width: stageBandWidth,
      height: stageBandHeight,
      x: centerX - stageBandWidth / 2,
      y: stageBandY,
      rx: compact ? 20 : 26,
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
      anchorZone: seat.position?.anchorZone || null,
      cx: centerX + (Number(seat.position?.x) || 0),
      cy: centerY + (Number(seat.position?.y) || 0),
    })),
  };
}
