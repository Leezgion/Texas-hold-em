import { buildSeatRingPositions } from './seatRingLayout.js';

const TABLE_FAMILY = 'tournament-capsule-9max';

function clampNumber(value, fallback = 0) {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : fallback;
}

function resolveStageHeightClass({ viewportWidth = 0, viewportHeight = 0 } = {}) {
  const safeWidth = clampNumber(viewportWidth);
  const safeHeight = clampNumber(viewportHeight);

  if (safeHeight > 0 && (safeHeight < 520 || (safeWidth >= 768 && safeHeight < 720))) {
    return 'short-height';
  }

  return 'regular-height';
}

function resolveTableProfile({ viewportWidth = 0, viewportHeight = 0, tableProfile = null } = {}) {
  if (tableProfile === 'desktop-oval' || tableProfile === 'phone-oval') {
    return tableProfile;
  }

  if (resolveStageHeightClass({ viewportWidth, viewportHeight }) === 'short-height') {
    return 'phone-oval';
  }

  return viewportWidth < 768 ? 'phone-oval' : 'desktop-oval';
}

export function resolveTableSurfaceLayout({
  viewportWidth = 0,
  viewportHeight = 0,
  tableDiameter = 0,
  tableProfile = null,
} = {}) {
  const heightClass = resolveStageHeightClass({ viewportWidth, viewportHeight });
  const profile = resolveTableProfile({ viewportWidth, viewportHeight, tableProfile });
  const safeTableDiameter = clampNumber(tableDiameter, viewportWidth < 768 ? 208 : 320);
  const stageScale = heightClass === 'short-height' ? (profile === 'phone-oval' ? 0.58 : 0.74) : 1;
  const effectiveTableDiameter = Math.max(0, Math.round(safeTableDiameter * stageScale));
  const stageDensity = heightClass === 'short-height' ? 'compressed' : viewportWidth < 768 ? 'compact' : 'standard';

  if (profile === 'phone-oval') {
    return {
      family: TABLE_FAMILY,
      profile,
      heightClass,
      stageDensity,
      stageScale,
      effectiveTableDiameter,
      tableWidth: Math.round(effectiveTableDiameter * 1.02),
      tableHeight: Math.round(effectiveTableDiameter * 1.46),
      boardTrayInsetX: 20,
      boardTrayInsetY: 18,
      stageBandHeight: heightClass === 'short-height' ? 36 : 40,
      stageMinHeightPx: Math.round(Math.max(220, Math.min(360, effectiveTableDiameter + 72))),
    };
  }

  return {
    family: TABLE_FAMILY,
    profile,
    heightClass,
    stageDensity,
    stageScale,
    effectiveTableDiameter,
    tableWidth: Math.round(effectiveTableDiameter * 1.72),
    tableHeight: Math.round(effectiveTableDiameter * 0.9),
    boardTrayInsetX: 26,
    boardTrayInsetY: 20,
    stageBandHeight: heightClass === 'short-height' ? 40 : 46,
    stageMinHeightPx: Math.round(Math.max(240, Math.min(420, effectiveTableDiameter + 144))),
  };
}

export function resolveCommunityCardLayout({
  viewportWidth = 0,
  viewportHeight = 0,
  tableDiameter = 0,
  tableProfile = null,
} = {}) {
  const surface = resolveTableSurfaceLayout({
    viewportWidth,
    viewportHeight,
    tableDiameter,
    tableProfile,
  });

  if (surface.profile === 'phone-oval') {
    const safeWidth = Math.max(surface.tableWidth - surface.boardTrayInsetX - 2, 190);
    return {
      family: surface.family,
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
    family: surface.family,
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
  viewportHeight = 0,
  tableDiameter = 0,
  seatGuides = [],
  roomShellLayout = 'stacked',
  tableProfile = null,
} = {}) {
  const surface = resolveTableSurfaceLayout({
    viewportWidth,
    viewportHeight,
    tableDiameter,
    tableProfile,
  });
  const communityLayout = resolveCommunityCardLayout({
    viewportWidth,
    viewportHeight,
    tableDiameter,
    tableProfile: surface.profile,
  });
  const compact = surface.stageDensity === 'compressed' || surface.profile === 'phone-oval';
  const paddingX = compact ? 112 : 132;
  const paddingY = compact ? 96 : 112;
  const width = surface.tableWidth + paddingX * 2;
  const height = surface.tableHeight + paddingY * 2;
  const centerX = width / 2;
  const centerY = height / 2;
  const outerRx = surface.tableWidth / 2 + (compact ? 20 : 28);
  const outerRy = surface.tableHeight / 2 + (compact ? 20 : 26);
  const innerRx = outerRx - (compact ? 16 : 22);
  const innerRy = outerRy - (compact ? 18 : 20);
  const boardTrayWidth = Math.min(communityLayout.trayWidth + (compact ? 20 : 26), innerRx * 1.84);
  const boardTrayHeight = communityLayout.trayHeight + (compact ? 14 : 20);
  const guideRadius = compact ? 10 : 13;
  const stageBandWidth = Math.min(surface.tableWidth * 0.74, compact ? 188 : 316);
  const stageBandHeight = surface.stageBandHeight;
  const stageBandY = centerY - outerRy - stageBandHeight - (compact ? 16 : 24);
  const orbitMarkerCount = 9;
  const orbitRx = outerRx + (compact ? 16 : 18);
  const orbitRy = outerRy + (compact ? 12 : 14);
  const orbitMarkers = Array.from({ length: orbitMarkerCount }, (_, index) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / orbitMarkerCount;
    const isHeadMarker = index === 0;

    return {
      index,
      cx: centerX + Math.cos(angle) * orbitRx,
      cy: centerY + Math.sin(angle) * orbitRy,
      r: isHeadMarker ? (compact ? 3.4 : 3.8) : compact ? 2.2 : 2.6,
      isHeadMarker,
    };
  });
  const seatCount = Array.isArray(seatGuides) ? seatGuides.length : 0;
  const canonicalSeatPositions =
    seatCount > 0
      ? buildSeatRingPositions({
          playerCount: seatCount,
          viewportWidth,
          roomShellLayout,
          tableDiameter: surface.effectiveTableDiameter,
          profile: surface.profile,
        })
      : [];
  const normalizedSeatGuides = canonicalSeatPositions.map((position, index) => {
    const sourceSeat = Array.isArray(seatGuides) ? seatGuides[index] || {} : {};

    return {
      seatIndex: sourceSeat.seatIndex ?? index,
      seatLabel: sourceSeat.seatLabel,
      markerLabel: sourceSeat.positionLabel || null,
      occupied: Boolean(sourceSeat.occupied),
      isCurrentTurn: Boolean(sourceSeat.isCurrentTurn),
      isHero: Boolean(sourceSeat.isCurrentPlayer),
      anchorZone: position.anchorZone || null,
      cx: centerX + position.x,
      cy: centerY + position.y,
    };
  });
  const maxSeatOffsetX = canonicalSeatPositions.length
    ? Math.max(...canonicalSeatPositions.map((position) => Math.abs(position.x)))
    : 0;
  const maxSeatOffsetY = canonicalSeatPositions.length
    ? Math.max(...canonicalSeatPositions.map((position) => Math.abs(position.y)))
    : 0;
  const seatBoundWidth = canonicalSeatPositions.length
    ? Math.ceil(maxSeatOffsetX * 2 + (compact ? 120 : 140))
    : 0;
  const seatBoundHeight = canonicalSeatPositions.length
    ? Math.ceil(maxSeatOffsetY * 2 + (compact ? 124 : 152))
    : 0;
  const adjustedWidth = Math.max(width, seatBoundWidth);
  const adjustedHeight = Math.max(height, seatBoundHeight);
  const adjustedCenterX = adjustedWidth / 2;
  const adjustedCenterY = adjustedHeight / 2;
  const centerDeltaX = adjustedCenterX - centerX;
  const centerDeltaY = adjustedCenterY - centerY;
  const adjustedOrbitMarkers = orbitMarkers.map((marker) => ({
    ...marker,
    cx: marker.cx + centerDeltaX,
    cy: marker.cy + centerDeltaY,
  }));
  const adjustedStageBand = {
    width: stageBandWidth,
    height: stageBandHeight,
    x: adjustedCenterX - stageBandWidth / 2,
    y: stageBandY + centerDeltaY,
    rx: compact ? 20 : 26,
  };
  const adjustedSeatGuides = normalizedSeatGuides.map((guide, index) => ({
    ...guide,
    cx: adjustedCenterX + canonicalSeatPositions[index].x,
    cy: adjustedCenterY + canonicalSeatPositions[index].y,
  }));

  return {
    family: surface.family,
    profile: surface.profile,
    heightClass: surface.heightClass,
    stageDensity: surface.stageDensity,
    stageScale: surface.stageScale,
    viewMode: compact ? 'compact' : 'wide',
    width: adjustedWidth,
    height: adjustedHeight,
    centerX: adjustedCenterX,
    centerY: adjustedCenterY,
    table: {
      outerRx,
      outerRy,
      innerRx,
      innerRy,
      width: surface.tableWidth,
      height: surface.tableHeight,
    },
    stageBand: adjustedStageBand,
    orbit: {
      rx: orbitRx,
      ry: orbitRy,
      markerCount: orbitMarkerCount,
    },
    orbitMarkers: adjustedOrbitMarkers,
    effectiveTableDiameter: surface.effectiveTableDiameter,
    boardTray: {
      width: boardTrayWidth,
      height: boardTrayHeight,
      x: adjustedCenterX - boardTrayWidth / 2,
      y: adjustedCenterY - boardTrayHeight / 2,
      rx: compact ? 18 : 24,
    },
    guideRadius,
    seatGuides: adjustedSeatGuides,
  };
}
