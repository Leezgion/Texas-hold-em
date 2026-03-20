import { buildSeatRingPositions } from './seatRingLayout.js';
import { resolveRoomViewportLayout, resolveStageViewportContract } from './roomViewportLayout.js';

const TABLE_FAMILY = 'broadcast-tactical-9max';
const TABLE_CENTER_SURFACE_MODEL = 'broadcast-clean-center';
const TABLE_MATERIAL = Object.freeze({
  feltTone: 'deep-green-velvet',
  railTone: 'black-gold',
});

function clampNumber(value, fallback = 0) {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : fallback;
}

export function resolveSeatRingRotationSeatIndex(currentPlayer = null) {
  const seatIndex = Number(currentPlayer?.seat);

  return Number.isInteger(seatIndex) && seatIndex >= 0 ? seatIndex : 0;
}

function resolveTableProfile({ viewportWidth = 0, viewportHeight = 0, tableProfile = null } = {}) {
  if (tableProfile === 'desktop-oval' || tableProfile === 'phone-oval') {
    return tableProfile;
  }

  if (resolveStageViewportContract({ width: viewportWidth, height: viewportHeight }).heightClass === 'short-height') {
    return 'phone-oval';
  }

  return viewportWidth < 768 ? 'phone-oval' : 'desktop-oval';
}

export function resolveTableSurfaceLayout({
  viewportWidth = 0,
  viewportHeight = 0,
  tableDiameter = 0,
  tableProfile = null,
  stageViewportContract = null,
} = {}) {
  const resolvedStageViewportContract =
    stageViewportContract || resolveStageViewportContract({ width: viewportWidth, height: viewportHeight });
  const heightClass = resolvedStageViewportContract.heightClass;
  const profile = resolveTableProfile({ viewportWidth, viewportHeight, tableProfile });
  const safeTableDiameter = clampNumber(tableDiameter, viewportWidth < 768 ? 208 : 320);
  const stageScale = heightClass === 'short-height' ? (profile === 'phone-oval' ? 0.58 : 0.74) : 1;
  const effectiveTableDiameter = Math.max(0, Math.round(safeTableDiameter * stageScale));
  const stageDensity = resolvedStageViewportContract.stageDensity;
  const shellOrientation = profile === 'phone-oval' ? 'vertical-capsule' : 'horizontal-capsule';

  if (profile === 'phone-oval') {
    return {
      family: TABLE_FAMILY,
      centerSurfaceModel: TABLE_CENTER_SURFACE_MODEL,
      material: TABLE_MATERIAL,
      profile,
      heightClass,
      stageDensity,
      stageScale,
      effectiveTableDiameter,
      shellOrientation,
      tableWidth: Math.round(effectiveTableDiameter * 1.02),
      tableHeight: Math.round(effectiveTableDiameter * 1.46),
      boardTrayInsetX: 20,
      boardTrayInsetY: 18,
      stageBandHeight: heightClass === 'short-height' ? 36 : 40,
      stageBudget: resolvedStageViewportContract,
      stageMinHeightPx: resolvedStageViewportContract.minStageBudgetPx,
    };
  }

  return {
    family: TABLE_FAMILY,
    centerSurfaceModel: TABLE_CENTER_SURFACE_MODEL,
    material: TABLE_MATERIAL,
    profile,
    heightClass,
    stageDensity,
    stageScale,
    effectiveTableDiameter,
    shellOrientation,
    tableWidth: Math.round(effectiveTableDiameter * 1.72),
    tableHeight: Math.round(effectiveTableDiameter * 0.9),
    boardTrayInsetX: 26,
    boardTrayInsetY: 20,
    stageBandHeight: heightClass === 'short-height' ? 40 : 46,
    stageBudget: resolvedStageViewportContract,
    stageMinHeightPx: resolvedStageViewportContract.minStageBudgetPx,
  };
}

export function resolveCommunityCardLayout({
  viewportWidth = 0,
  viewportHeight = 0,
  tableDiameter = 0,
  tableProfile = null,
  tableSurfaceLayout = null,
} = {}) {
  const surface =
    tableSurfaceLayout ||
    resolveTableSurfaceLayout({
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

export function resolveRoomGeometryContract({
  viewportLayout = null,
  viewportWidth = 0,
  viewportHeight = 0,
  roomShellLayout = 'stacked',
  tableDiameter = 0,
  tableProfile = null,
  playerCount = 0,
} = {}) {
  const resolvedViewportLayout =
    viewportLayout || resolveRoomViewportLayout({ width: viewportWidth, height: viewportHeight });
  const tableSurfaceLayout = resolveTableSurfaceLayout({
    viewportWidth,
    viewportHeight,
    tableDiameter,
    tableProfile,
    stageViewportContract: resolvedViewportLayout,
  });
  const communityCardLayout = resolveCommunityCardLayout({
    viewportWidth,
    viewportHeight,
    tableDiameter,
    tableProfile: tableSurfaceLayout.profile,
    tableSurfaceLayout,
  });
  const seatRingLayout = {
    viewportWidth,
    viewportHeight,
    roomShellLayout,
    tableDiameter: tableSurfaceLayout.effectiveTableDiameter,
    profile: tableSurfaceLayout.profile,
  };
  const safePlayerCount = Math.max(0, Number(playerCount) || 0);
  const canonicalPositions =
    safePlayerCount >= 2
      ? buildSeatRingPositions({
          playerCount: safePlayerCount,
          ...seatRingLayout,
        })
      : [];
  const canonicalSlots = canonicalPositions.map((position, seatIndex) => ({
    seatIndex,
    slotId: position.slotId || null,
    anchorSlotId: `${tableSurfaceLayout.profile}:${safePlayerCount}:${position.slotId || position.anchorRole || 'ring'}:${seatIndex}`,
    anchorRole: position.anchorRole || null,
    anchorZone: position.anchorZone || null,
    position: {
      x: position.x,
      y: position.y,
      profile: tableSurfaceLayout.profile,
      slotId: position.slotId || null,
      anchorRole: position.anchorRole || null,
      anchorZone: position.anchorZone || null,
    },
  }));

  return {
    viewportLayout: resolvedViewportLayout,
    tableSurfaceLayout,
    communityCardLayout,
    seatRingLayout,
    canonicalSlots,
    roomShellLayout,
  };
}

export function buildStageChromeLayout({
  geometryContract = null,
  viewportWidth = 0,
  viewportHeight = 0,
  tableDiameter = 0,
  seatGuides = [],
  roomShellLayout = 'stacked',
  tableProfile = null,
} = {}) {
  const surface =
    geometryContract?.tableSurfaceLayout ||
    resolveTableSurfaceLayout({
      viewportWidth,
      viewportHeight,
      tableDiameter,
      tableProfile,
      stageViewportContract: geometryContract?.viewportLayout || null,
    });
  const communityLayout =
    geometryContract?.communityCardLayout ||
    resolveCommunityCardLayout({
      viewportWidth,
      viewportHeight,
      tableDiameter,
      tableProfile: surface.profile,
      tableSurfaceLayout: surface,
    });
  const seatRingLayout =
    geometryContract?.seatRingLayout || {
      viewportWidth,
      viewportHeight,
      roomShellLayout,
      tableDiameter: surface.effectiveTableDiameter,
      profile: surface.profile,
    };
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
  const stageBandY = centerY - outerRy - stageBandHeight - (compact ? 14 : 16);
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
  const safeSeatGuides = Array.isArray(seatGuides) ? seatGuides : [];
  const seatCount = safeSeatGuides.length;
  const heroSeatGuide = safeSeatGuides.find((seat) => Boolean(seat?.isHero || seat?.isCurrentPlayer)) || null;
  const heroSeatIndex = Number.isInteger(Number(heroSeatGuide?.seatIndex)) ? Number(heroSeatGuide.seatIndex) : 0;
  const canonicalSeatPositions =
    seatCount > 0
      ? buildSeatRingPositions({
          playerCount: seatCount,
          ...seatRingLayout,
        })
      : [];
  const normalizedSeatGuides = safeSeatGuides.map((sourceSeat, inputIndex) => {
    const seatIndex = Number.isInteger(Number(sourceSeat?.seatIndex)) ? Number(sourceSeat.seatIndex) : inputIndex;
    const relativeSeat = seatCount > 0 ? ((seatIndex - heroSeatIndex + seatCount) % seatCount) : inputIndex;
    const canonicalPosition = canonicalSeatPositions[relativeSeat] || null;

    return {
      seatIndex,
      seatLabel: sourceSeat.seatLabel,
      markerLabel: sourceSeat.positionLabel || null,
      occupied: Boolean(sourceSeat.occupied),
      isCurrentTurn: Boolean(sourceSeat.isCurrentTurn),
      isHero: Boolean(sourceSeat.isHero || sourceSeat.isCurrentPlayer),
      slotId: canonicalPosition?.slotId || null,
      anchorSlotId:
        canonicalPosition?.slotId || canonicalPosition?.anchorRole
          ? `${surface.profile}:${seatCount}:${canonicalPosition?.slotId || canonicalPosition?.anchorRole}:${relativeSeat}`
          : null,
      anchorRole: canonicalPosition?.anchorRole || null,
      anchorZone: canonicalPosition?.anchorZone || null,
      cx: canonicalPosition ? centerX + canonicalPosition.x : centerX,
      cy: canonicalPosition ? centerY + canonicalPosition.y : centerY,
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
  const shellCornerRadius = Math.round(
    Math.min(
      surface.shellOrientation === 'vertical-capsule' ? surface.tableWidth : surface.tableHeight,
      surface.shellOrientation === 'vertical-capsule' ? surface.tableHeight : surface.tableWidth
    ) / 2
  );
  const stageBandClearance = Math.max(
    0,
    Math.round((adjustedCenterY - outerRy) - (adjustedStageBand.y + adjustedStageBand.height))
  );
  const boardTrayClearance = Math.max(
    0,
    Math.round((adjustedCenterY - boardTrayHeight / 2) - (adjustedStageBand.y + adjustedStageBand.height))
  );
  const adjustedSeatGuides = normalizedSeatGuides.map((guide, index) => ({
    ...guide,
    cx: guide.cx + centerDeltaX,
    cy: guide.cy + centerDeltaY,
  }));

  return {
    family: surface.family,
    centerSurfaceModel: surface.centerSurfaceModel,
    material: surface.material,
    profile: surface.profile,
    heightClass: surface.heightClass,
    stageDensity: surface.stageDensity,
    stageScale: surface.stageScale,
    shellOrientation: surface.shellOrientation,
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
      shellOrientation: surface.shellOrientation,
      shellRx: outerRx,
      shellRy: outerRy,
      shellCornerRadius,
    },
    stageBand: {
      ...adjustedStageBand,
      clearanceToTable: stageBandClearance,
    },
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
      shellOrientation: 'horizontal-capsule',
      shellRx: boardTrayWidth / 2,
      shellRy: boardTrayHeight / 2,
      shellCornerRadius: Math.round(Math.min(boardTrayWidth, boardTrayHeight) / 2),
      clearanceToStageBand: boardTrayClearance,
      dockBias: surface.profile === 'phone-oval' ? 'dock-edge' : 'table-core',
    },
    guideRadius,
    seatGuides: adjustedSeatGuides,
  };
}
