function clampNumber(value, fallback = 0) {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : fallback;
}

function roundPosition(position = {}) {
  return {
    ...position,
    x: Math.round(position.x || 0),
    y: Math.round(position.y || 0),
  };
}

function resolveSeatRingProfile({ viewportWidth = 0, profile = null } = {}) {
  if (profile === 'desktop-oval' || profile === 'phone-oval') {
    return profile;
  }

  return viewportWidth < 768 ? 'phone-oval' : 'desktop-oval';
}

function resolveTableFootprint({ tableDiameter = 0, profile = 'desktop-oval' } = {}) {
  const safeTableDiameter = clampNumber(tableDiameter, 320);

  if (profile === 'phone-oval') {
    return {
      tableWidth: Math.round(safeTableDiameter * 1.02),
      tableHeight: Math.round(safeTableDiameter * 1.46),
      stageBandHeight: 42,
      stageBandOffset: 22,
    };
  }

  return {
    tableWidth: Math.round(safeTableDiameter * 1.72),
    tableHeight: Math.round(safeTableDiameter * 0.9),
    stageBandHeight: 48,
    stageBandOffset: 28,
  };
}

const SUPPORTS_2_TO_9_OCCUPANCY = {
  2: ['hero', 'top-left'],
  3: ['hero', 'upper-left', 'upper-right'],
  4: ['hero', 'lower-left', 'lower-right', 'top-left'],
  5: ['hero', 'lower-left', 'lower-right', 'upper-left', 'upper-right'],
  6: ['hero', 'lower-left', 'lower-right', 'middle-left', 'middle-right', 'top-left'],
  7: ['hero', 'lower-left', 'lower-right', 'middle-left', 'middle-right', 'upper-left', 'upper-right'],
  8: ['hero', 'lower-left', 'lower-right', 'middle-left', 'middle-right', 'upper-left', 'upper-right', 'top-left'],
  9: ['hero', 'lower-left', 'lower-right', 'middle-left', 'middle-right', 'upper-left', 'upper-right', 'top-left', 'top-right'],
};

const CANONICAL_SLOT_MODELS = {
  'desktop-oval': [
    { slotId: 'hero', anchorRole: 'hero', anchorZone: 'table-edge', normalized: { x: 0, y: 0.78 } },
    { slotId: 'lower-left', anchorRole: 'lower-left', anchorZone: 'table-flank', normalized: { x: -1, y: 0.48 } },
    { slotId: 'lower-right', anchorRole: 'lower-right', anchorZone: 'table-flank', normalized: { x: 1, y: 0.48 } },
    { slotId: 'middle-left', anchorRole: 'middle-left', anchorZone: 'table-flank', normalized: { x: -1, y: 0 } },
    { slotId: 'middle-right', anchorRole: 'middle-right', anchorZone: 'table-flank', normalized: { x: 1, y: 0 } },
    { slotId: 'upper-left', anchorRole: 'upper-left', anchorZone: 'table-flank', normalized: { x: -1, y: -0.48 } },
    { slotId: 'upper-right', anchorRole: 'upper-right', anchorZone: 'table-flank', normalized: { x: 1, y: -0.48 } },
    { slotId: 'top-left', anchorRole: 'top-left', anchorZone: 'table-flank', normalized: { x: -1, y: -1 } },
    { slotId: 'top-right', anchorRole: 'top-right', anchorZone: 'table-flank', normalized: { x: 1, y: -1 } },
  ],
  'phone-oval': [
    { slotId: 'hero', anchorRole: 'hero', anchorZone: 'dock-edge', normalized: { x: 0, y: 0.72 } },
    { slotId: 'lower-left', anchorRole: 'lower-left', anchorZone: 'table-flank', normalized: { x: -1, y: 0.48 } },
    { slotId: 'lower-right', anchorRole: 'lower-right', anchorZone: 'table-flank', normalized: { x: 1, y: 0.48 } },
    { slotId: 'middle-left', anchorRole: 'middle-left', anchorZone: 'table-flank', normalized: { x: -1, y: 0 } },
    { slotId: 'middle-right', anchorRole: 'middle-right', anchorZone: 'table-flank', normalized: { x: 1, y: 0 } },
    { slotId: 'upper-left', anchorRole: 'upper-left', anchorZone: 'table-flank', normalized: { x: -1, y: -0.48 } },
    { slotId: 'upper-right', anchorRole: 'upper-right', anchorZone: 'table-flank', normalized: { x: 1, y: -0.48 } },
    { slotId: 'top-left', anchorRole: 'top-left', anchorZone: 'table-flank', normalized: { x: -1, y: -1 } },
    { slotId: 'top-right', anchorRole: 'top-right', anchorZone: 'table-flank', normalized: { x: 1, y: -1 } },
  ],
};

function resolveCanonicalProjection({
  tableWidth,
  tableHeight,
  cardWidth,
  cardHeight,
  horizontalGap,
  verticalGap,
} = {}) {
  return {
    xExtent: Math.round(tableWidth / 2 + cardWidth / 2 + horizontalGap),
    yExtent: Math.round(tableHeight / 2 + cardHeight + verticalGap * 1.2),
  };
}

function buildCanonicalSeatAnchors({ profile, ...layoutProfile } = {}) {
  const slotModel = CANONICAL_SLOT_MODELS[profile] || [];
  const projection = resolveCanonicalProjection(layoutProfile);

  return slotModel.map((slot) =>
    roundPosition({
      slotId: slot.slotId,
      x: projection.xExtent * slot.normalized.x,
      y: projection.yExtent * slot.normalized.y,
      anchorZone: slot.anchorZone,
      anchorRole: slot.anchorRole,
      normalized: { ...slot.normalized },
    })
  );
}

function buildSeatRingPositionsForSupportedProfile({
  playerCount = 0,
  profile = 'desktop-oval',
  ...layoutProfile
} = {}) {
  const template = buildCanonicalSeatAnchors({
    profile,
    ...layoutProfile,
  });
  const templateSlotIds = SUPPORTS_2_TO_9_OCCUPANCY[playerCount];

  if (!templateSlotIds) {
    return null;
  }

  const templateBySlotId = new Map(template.map((slot) => [slot.slotId, slot]));

  return templateSlotIds.map((slotId) => ({
    ...templateBySlotId.get(slotId),
  }));
}

function buildSeatRingPositionsFallback({
  playerCount = 0,
  tableWidth,
  tableHeight,
  cardWidth,
  cardHeight,
  horizontalGap,
  verticalGap,
} = {}) {
  const safePlayerCount = Math.max(2, Number(playerCount) || 0);
  const halfWidth = tableWidth / 2 + cardWidth / 2 + horizontalGap;
  const halfHeight = tableHeight / 2 + cardHeight / 2 + verticalGap;
  const positions = [];

  for (let index = 0; index < safePlayerCount; index += 1) {
    const angle = Math.PI / 2 + (index * 2 * Math.PI) / safePlayerCount;
    positions.push(
      roundPosition({
        x: halfWidth * Math.cos(angle),
        y: halfHeight * Math.sin(angle),
        anchorZone: index === 0 ? 'table-edge' : 'table-flank',
        anchorRole: index === 0 ? 'hero' : 'ring',
      })
    );
  }

  return positions;
}

function countRectOverlaps({ positions = [], rect = null, cardWidth = 0, cardHeight = 0 } = {}) {
  if (!rect) {
    return 0;
  }

  const { left, right, top, bottom } = rect;
  return positions.filter(({ x = 0, y = 0 }) => {
    const seatLeft = x - cardWidth / 2;
    const seatRight = x + cardWidth / 2;
    const seatTop = y - cardHeight / 2;
    const seatBottom = y + cardHeight / 2;

    return !(seatRight < left || seatLeft > right || seatBottom < top || seatTop > bottom);
  }).length;
}

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
  profile = null,
} = {}) {
  const resolvedProfile = resolveSeatRingProfile({ viewportWidth, profile });
  const resolvedTableDiameter = clampNumber(
    tableDiameter,
    resolveTableDiameter({ viewportWidth, roomShellLayout })
  );

  if (resolvedProfile === 'phone-oval') {
    const usesWidePhonePlaques = viewportWidth >= 768;
    const footprint = resolveTableFootprint({
      tableDiameter: resolvedTableDiameter,
      profile: resolvedProfile,
    });

    return {
      profile: resolvedProfile,
      tableDiameter: resolvedTableDiameter,
      tableWidth: footprint.tableWidth,
      tableHeight: footprint.tableHeight,
      stageBandHeight: footprint.stageBandHeight,
      stageBandOffset: footprint.stageBandOffset,
      cardWidth: usesWidePhonePlaques ? 94 : 70,
      cardHeight: usesWidePhonePlaques ? 138 : 128,
      horizontalGap: usesWidePhonePlaques ? 10 : 8,
      verticalGap: usesWidePhonePlaques ? 20 : 18,
    };
  }

  const footprint = resolveTableFootprint({
    tableDiameter: resolvedTableDiameter,
    profile: resolvedProfile,
  });

  return {
    profile: resolvedProfile,
    tableDiameter: resolvedTableDiameter,
    tableWidth: footprint.tableWidth,
    tableHeight: footprint.tableHeight,
    stageBandHeight: footprint.stageBandHeight,
    stageBandOffset: footprint.stageBandOffset,
    cardWidth: roomShellLayout === 'three-column' ? 136 : 132,
    cardHeight: 144,
    horizontalGap: roomShellLayout === 'three-column' ? 16 : 14,
    verticalGap: roomShellLayout === 'three-column' ? 20 : 24,
  };
}

export function buildSeatRingPositions({
  playerCount = 0,
  viewportWidth = 0,
  roomShellLayout = 'stacked',
  tableDiameter,
  profile = null,
} = {}) {
  const layoutProfile = getSeatRingLayoutProfile({
    viewportWidth,
    roomShellLayout,
    tableDiameter,
    profile,
  });
  const safePlayerCount = Math.max(2, Number(playerCount) || 0);
  let templateSource = 'fallback-generic';

  let positions;
  if (layoutProfile.profile === 'desktop-oval' || layoutProfile.profile === 'phone-oval') {
    positions = buildSeatRingPositionsForSupportedProfile({
      playerCount: safePlayerCount,
      ...layoutProfile,
    });
    if (positions) {
      templateSource = 'explicit-9max';
    }
  }

  if (!positions) {
    positions = buildSeatRingPositionsFallback({
      playerCount: safePlayerCount,
      tableWidth: layoutProfile.tableWidth,
      tableHeight: layoutProfile.tableHeight,
      cardWidth: layoutProfile.cardWidth,
      cardHeight: layoutProfile.cardHeight,
      horizontalGap: layoutProfile.horizontalGap,
      verticalGap: layoutProfile.verticalGap,
    });
  }

  const stageBand = {
    left: -(layoutProfile.tableWidth * 0.34),
    right: layoutProfile.tableWidth * 0.34,
    top:
      -(layoutProfile.tableHeight / 2) -
      layoutProfile.stageBandOffset -
      layoutProfile.stageBandHeight / 2,
    bottom:
      -(layoutProfile.tableHeight / 2) -
      layoutProfile.stageBandOffset +
      layoutProfile.stageBandHeight / 2,
  };
  const tableBody = {
    left: -layoutProfile.tableWidth / 2,
    right: layoutProfile.tableWidth / 2,
    top: -layoutProfile.tableHeight / 2,
    bottom: layoutProfile.tableHeight / 2,
  };

  positions.forEach((position) => {
    position.profile = layoutProfile.profile;
  });

  return Object.assign(positions, {
    profile: layoutProfile.profile,
    overlaps: {
      stageBand: countRectOverlaps({
        positions,
        rect: stageBand,
        cardWidth: layoutProfile.cardWidth,
        cardHeight: layoutProfile.cardHeight,
      }),
      tableBody: countRectOverlaps({
        positions,
        rect: tableBody,
        cardWidth: layoutProfile.cardWidth,
        cardHeight: layoutProfile.cardHeight,
      }),
    },
    heroAnchor: {
      zone: layoutProfile.profile === 'phone-oval' ? 'dock-edge' : 'table-edge',
    },
    templateSource,
  });
}
