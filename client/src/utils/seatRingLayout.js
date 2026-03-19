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

function buildSeatRingPositionsForSix({
  tableWidth,
  tableHeight,
  cardWidth,
  cardHeight,
  horizontalGap,
  verticalGap,
  profile,
} = {}) {
  const halfWidth = tableWidth / 2;
  const halfHeight = tableHeight / 2;

  if (profile === 'phone-oval') {
    return [
      {
        x: 0,
        y: halfHeight + cardHeight * 0.38 + verticalGap * 1.05,
        anchorZone: 'dock-edge',
        anchorRole: 'hero',
      },
      {
        x: -(halfWidth + cardWidth * 0.44 + horizontalGap),
        y: halfHeight * 0.26,
        anchorZone: 'table-flank',
        anchorRole: 'lower-left',
      },
      {
        x: -(halfWidth + cardWidth * 0.4 + horizontalGap),
        y: -(halfHeight * 0.34),
        anchorZone: 'table-flank',
        anchorRole: 'upper-left',
      },
      {
        x: 0,
        y: -(halfHeight + cardHeight * 0.78 + verticalGap * 1.15),
        anchorZone: 'stage-band-clear',
        anchorRole: 'top',
      },
      {
        x: halfWidth + cardWidth * 0.4 + horizontalGap,
        y: -(halfHeight * 0.34),
        anchorZone: 'table-flank',
        anchorRole: 'upper-right',
      },
      {
        x: halfWidth + cardWidth * 0.44 + horizontalGap,
        y: halfHeight * 0.26,
        anchorZone: 'table-flank',
        anchorRole: 'lower-right',
      },
    ].map(roundPosition);
  }

  return [
    {
      x: 0,
      y: halfHeight + cardHeight * 0.52 + verticalGap * 1.05,
      anchorZone: 'table-edge',
      anchorRole: 'hero',
    },
    {
      x: -(halfWidth + cardWidth * 0.5 + horizontalGap),
      y: halfHeight * 0.48,
      anchorZone: 'table-flank',
      anchorRole: 'lower-left',
    },
    {
      x: -(halfWidth + cardWidth * 0.5 + horizontalGap),
      y: -(halfHeight * 0.46),
      anchorZone: 'table-flank',
      anchorRole: 'upper-left',
    },
    {
      x: 0,
      y: -(halfHeight + cardHeight * 0.82 + verticalGap * 1.2),
      anchorZone: 'stage-band-clear',
      anchorRole: 'top',
    },
    {
      x: halfWidth + cardWidth * 0.5 + horizontalGap,
      y: -(halfHeight * 0.46),
      anchorZone: 'table-flank',
      anchorRole: 'upper-right',
    },
    {
      x: halfWidth + cardWidth * 0.5 + horizontalGap,
      y: halfHeight * 0.48,
      anchorZone: 'table-flank',
      anchorRole: 'lower-right',
    },
  ].map(roundPosition);
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
      cardWidth: 70,
      cardHeight: 128,
      horizontalGap: 8,
      verticalGap: 18,
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

  let positions;
  if (safePlayerCount === 6) {
    positions = buildSeatRingPositionsForSix(layoutProfile);
  } else {
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
  });
}
