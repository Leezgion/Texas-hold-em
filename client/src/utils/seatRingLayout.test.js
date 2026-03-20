import assert from 'node:assert/strict';
import test from 'node:test';

import { buildSeatRingPositions, getSeatRingLayoutProfile } from './seatRingLayout.js';

function countTableRectOverlaps({
  positions,
  tableWidth,
  tableHeight,
  cardWidth,
  cardHeight,
}) {
  const tableLeft = -tableWidth / 2;
  const tableRight = tableWidth / 2;
  const tableTop = -tableHeight / 2;
  const tableBottom = tableHeight / 2;

  return positions.filter(({ x, y }) => {
    const left = x - cardWidth / 2;
    const right = x + cardWidth / 2;
    const top = y - cardHeight / 2;
    const bottom = y + cardHeight / 2;

    return !(right < tableLeft || left > tableRight || bottom < tableTop || top > tableBottom);
  }).length;
}

function assertUsesExplicitAnchorPath(layout, playerCount) {
  assert.equal(layout.length, playerCount);
  assert.equal(layout.templateSource, 'explicit-9max');
}

function indexBySlotId(positions) {
  const entries = positions.map((seat) => {
    assert.ok(seat.slotId, `missing slotId for ${seat.anchorRole || 'unknown-seat'}`);
    assert.ok(seat.normalized, `missing normalized projection for ${seat.slotId}`);

    return [seat.slotId, seat];
  });

  return Object.fromEntries(entries);
}

function getSeatCardCollisionPairs({
  positions,
  cardWidth,
  cardHeight,
}) {
  const collisions = [];

  for (let leftIndex = 0; leftIndex < positions.length; leftIndex += 1) {
    const leftSeat = positions[leftIndex];
    const leftRect = {
      left: leftSeat.x - cardWidth / 2,
      right: leftSeat.x + cardWidth / 2,
      top: leftSeat.y - cardHeight / 2,
      bottom: leftSeat.y + cardHeight / 2,
    };

    for (let rightIndex = leftIndex + 1; rightIndex < positions.length; rightIndex += 1) {
      const rightSeat = positions[rightIndex];
      const rightRect = {
        left: rightSeat.x - cardWidth / 2,
        right: rightSeat.x + cardWidth / 2,
        top: rightSeat.y - cardHeight / 2,
        bottom: rightSeat.y + cardHeight / 2,
      };

      const overlaps = !(
        leftRect.right < rightRect.left ||
        leftRect.left > rightRect.right ||
        leftRect.bottom < rightRect.top ||
        leftRect.top > rightRect.bottom
      );

      if (overlaps) {
        collisions.push([leftSeat.anchorRole, rightSeat.anchorRole]);
      }
    }
  }

  return collisions;
}

test('keeps six-player split-stage seats outside the table bounds on desktop', () => {
  const profile = getSeatRingLayoutProfile({
    viewportWidth: 1280,
    roomShellLayout: 'split-stage',
    tableDiameter: 352,
  });

  const positions = buildSeatRingPositions({
    playerCount: 6,
    viewportWidth: 1280,
    roomShellLayout: 'split-stage',
    tableDiameter: 352,
  });

  assert.equal(
    countTableRectOverlaps({
      positions,
      tableWidth: 352,
      tableHeight: 352,
      cardWidth: profile.cardWidth,
      cardHeight: profile.cardHeight,
    }),
    0
  );
});

test('keeps six-player split-stage seats outside the table bounds with live-turn plaque footprint', () => {
  const positions = buildSeatRingPositions({
    playerCount: 6,
    viewportWidth: 1280,
    roomShellLayout: 'split-stage',
    tableDiameter: 352,
  });

  assert.equal(
    countTableRectOverlaps({
      positions,
      tableWidth: 352,
      tableHeight: 352,
      // Browser evidence shows the live-turn plaque grows to roughly
      // a 132 x 144 footprint once badges and the turn marker render.
      cardWidth: 132,
      cardHeight: 144,
    }),
    0
  );
});

test('keeps six-player phone portrait seats outside the table bounds', () => {
  const positions = buildSeatRingPositions({
    playerCount: 6,
    viewportWidth: 390,
    roomShellLayout: 'stacked',
    tableDiameter: 208,
  });

  assert.equal(
    countTableRectOverlaps({
      positions,
      tableWidth: 208,
      tableHeight: 208,
      // Browser evidence shows compact phone seat cards still consume
      // roughly a 70 x 128 footprint once real text and badges render.
      cardWidth: 70,
      cardHeight: 128,
    }),
    0
  );
});

test('desktop profile uses an oval table and keeps the top seat clear of the stage band', () => {
  const layout = buildSeatRingPositions({
    playerCount: 6,
    viewportWidth: 1280,
    viewportHeight: 900,
    roomShellLayout: 'split-stage',
    tableDiameter: 352,
    profile: 'desktop-oval',
  });

  assert.equal(layout.profile, 'desktop-oval');
  assert.equal(layout.overlaps.stageBand, 0);
  assert.equal(layout.overlaps.tableBody, 0);
  assert.equal(layout.heroAnchor.zone, 'table-edge');
});

test('phone portrait profile uses a vertical oval and keeps hero tied to the dock edge', () => {
  const layout = buildSeatRingPositions({
    playerCount: 6,
    viewportWidth: 390,
    viewportHeight: 844,
    roomShellLayout: 'stacked',
    tableDiameter: 208,
    profile: 'phone-oval',
  });

  assert.equal(layout.profile, 'phone-oval');
  assert.equal(layout.heroAnchor.zone, 'dock-edge');
  assert.equal(layout.overlaps.stageBand, 0);
  assert.equal(layout.overlaps.tableBody, 0);
});

test('phone portrait profile keeps short-handed hero seats anchored to the dock edge', () => {
  const layout = buildSeatRingPositions({
    playerCount: 4,
    viewportWidth: 390,
    viewportHeight: 844,
    roomShellLayout: 'stacked',
    tableDiameter: 208,
    profile: 'phone-oval',
  });

  assert.equal(layout.profile, 'phone-oval');
  assert.equal(layout.heroAnchor.zone, 'dock-edge');
  assert.equal(layout[0].anchorZone, 'dock-edge');
  assert.equal(layout[0].anchorRole, 'hero');
  assert.equal(layout.overlaps.stageBand, 0);
  assert.equal(layout.overlaps.tableBody, 0);
});

test('short-height wide phone-oval rooms keep two-player seats outside the table with the real plaque footprint', () => {
  const effectiveTableDiameter = 186;
  const layout = buildSeatRingPositions({
    playerCount: 2,
    viewportWidth: 844,
    roomShellLayout: 'stacked',
    tableDiameter: effectiveTableDiameter,
    profile: 'phone-oval',
  });

  assert.equal(layout.profile, 'phone-oval');
  assert.equal(layout.heroAnchor.zone, 'dock-edge');
  assert.equal(
    countTableRectOverlaps({
      positions: layout,
      tableWidth: Math.round(effectiveTableDiameter * 1.02),
      tableHeight: Math.round(effectiveTableDiameter * 1.46),
      // Browser evidence on 844x390 showed phone-oval plaques stretch
      // to roughly a 93 x 138 footprint, not the narrow true-phone size.
      cardWidth: 94,
      cardHeight: 138,
    }),
    0
  );
});

test('keeps supported 2-9 player rooms on the explicit anchor templates', () => {
  const cases = [
    {
      profile: 'desktop-oval',
      viewportWidth: 1440,
      roomShellLayout: 'split-stage',
      tableDiameter: 352,
    },
    {
      profile: 'phone-oval',
      viewportWidth: 390,
      roomShellLayout: 'stacked',
      tableDiameter: 208,
    },
  ];

  for (const config of cases) {
    for (const playerCount of [2, 3, 4, 5, 6, 7, 8, 9]) {
      const layout = buildSeatRingPositions({
        playerCount,
        ...config,
      });

      assertUsesExplicitAnchorPath(layout, playerCount);

      if (config.profile === 'desktop-oval' && playerCount >= 7) {
        assert.equal(layout.overlaps.tableBody, 0, `table overlap for ${playerCount} players`);
        assert.equal(layout.overlaps.stageBand, 0, `stage overlap for ${playerCount} players`);
      }

      if (config.profile === 'phone-oval' && playerCount >= 7) {
        assert.equal(layout.heroAnchor.zone, 'dock-edge', `hero anchor for ${playerCount} players`);
        assert.equal(layout[0].anchorZone, 'dock-edge', `hero seat zone for ${playerCount} players`);
        assert.equal(layout[0].anchorRole, 'hero', `hero seat role for ${playerCount} players`);
      }
    }
  }
});

test('keeps supported desktop 6-9 player rooms collision-free and outside the table bounds', () => {
  const profile = getSeatRingLayoutProfile({
    viewportWidth: 1440,
    roomShellLayout: 'split-stage',
    tableDiameter: 352,
    profile: 'desktop-oval',
  });

  for (const playerCount of [6, 7, 8, 9]) {
    const layout = buildSeatRingPositions({
      playerCount,
      viewportWidth: 1440,
      roomShellLayout: 'split-stage',
      tableDiameter: 352,
      profile: 'desktop-oval',
    });

    assertUsesExplicitAnchorPath(layout, playerCount);
    assert.equal(
      getSeatCardCollisionPairs({
        positions: layout,
        cardWidth: profile.cardWidth,
        cardHeight: profile.cardHeight,
      }).length,
      0,
      `pairwise collisions for ${playerCount} desktop players`
    );

    assert.equal(layout.overlaps.tableBody, 0, `table overlap for ${playerCount} players`);
    assert.equal(layout.overlaps.stageBand, 0, `stage overlap for ${playerCount} players`);
  }
});

test('keeps supported phone 7-9 player rooms collision-free and anchored to the dock edge', () => {
  const profile = getSeatRingLayoutProfile({
    viewportWidth: 390,
    roomShellLayout: 'stacked',
    tableDiameter: 208,
    profile: 'phone-oval',
  });

  for (const playerCount of [7, 8, 9]) {
    const layout = buildSeatRingPositions({
      playerCount,
      viewportWidth: 390,
      roomShellLayout: 'stacked',
      tableDiameter: 208,
      profile: 'phone-oval',
    });

    assertUsesExplicitAnchorPath(layout, playerCount);
    assert.equal(
      getSeatCardCollisionPairs({
        positions: layout,
        cardWidth: profile.cardWidth,
        cardHeight: profile.cardHeight,
      }).length,
      0,
      `pairwise collisions for ${playerCount} phone players`
    );
    assert.equal(layout.heroAnchor.zone, 'dock-edge', `hero anchor for ${playerCount} players`);
    assert.equal(layout[0].anchorZone, 'dock-edge', `hero seat zone for ${playerCount} players`);
    assert.equal(layout[0].anchorRole, 'hero', `hero seat role for ${playerCount} players`);
    assert.equal(layout.overlaps.tableBody, 0, `table overlap for ${playerCount} players`);
    assert.equal(layout.overlaps.stageBand, 0, `stage overlap for ${playerCount} players`);
  }
});

test('desktop 9-max canonical anchors stay mirrored around the center line', () => {
  const layout = buildSeatRingPositions({
    playerCount: 9,
    viewportWidth: 1440,
    roomShellLayout: 'split-stage',
    tableDiameter: 352,
    profile: 'desktop-oval',
  });

  assert.equal(layout[1].x, -layout[2].x);
  assert.equal(layout[1].y, layout[2].y);
  assert.equal(layout[3].x, -layout[4].x);
  assert.equal(layout[3].y, layout[4].y);
  assert.equal(layout[5].x, -layout[6].x);
  assert.equal(layout[5].y, layout[6].y);
  assert.equal(layout[7].x, -layout[8].x);
  assert.equal(layout[7].y, layout[8].y);
});

test('phone 9-max canonical anchors stay mirrored around the center line', () => {
  const layout = buildSeatRingPositions({
    playerCount: 9,
    viewportWidth: 390,
    roomShellLayout: 'stacked',
    tableDiameter: 208,
    profile: 'phone-oval',
  });

  assert.equal(layout[1].x, -layout[2].x);
  assert.equal(layout[1].y, layout[2].y);
  assert.equal(layout[3].x, -layout[4].x);
  assert.equal(layout[3].y, layout[4].y);
  assert.equal(layout[5].x, -layout[6].x);
  assert.equal(layout[5].y, layout[6].y);
  assert.equal(layout[7].x, -layout[8].x);
  assert.equal(layout[7].y, layout[8].y);
});

test('short-handed canonical occupancy uses the documented opposite top seat semantics', () => {
  const cases = [
    {
      label: 'desktop heads-up',
      playerCount: 2,
      viewportWidth: 1440,
      roomShellLayout: 'split-stage',
      tableDiameter: 352,
      profile: 'desktop-oval',
      expectedSlots: ['hero', 'top'],
      expectedHeroZone: 'table-edge',
    },
    {
      label: 'desktop four-handed',
      playerCount: 4,
      viewportWidth: 1440,
      roomShellLayout: 'split-stage',
      tableDiameter: 352,
      profile: 'desktop-oval',
      expectedSlots: ['hero', 'lower-left', 'top', 'lower-right'],
      expectedHeroZone: 'table-edge',
    },
    {
      label: 'desktop six-handed',
      playerCount: 6,
      viewportWidth: 1440,
      roomShellLayout: 'split-stage',
      tableDiameter: 352,
      profile: 'desktop-oval',
      expectedSlots: ['hero', 'lower-left', 'upper-left', 'top', 'upper-right', 'lower-right'],
      expectedHeroZone: 'table-edge',
    },
    {
      label: 'phone heads-up',
      playerCount: 2,
      viewportWidth: 390,
      roomShellLayout: 'stacked',
      tableDiameter: 208,
      profile: 'phone-oval',
      expectedSlots: ['hero', 'top'],
      expectedHeroZone: 'dock-edge',
    },
    {
      label: 'phone four-handed',
      playerCount: 4,
      viewportWidth: 390,
      roomShellLayout: 'stacked',
      tableDiameter: 208,
      profile: 'phone-oval',
      expectedSlots: ['hero', 'lower-left', 'top', 'lower-right'],
      expectedHeroZone: 'dock-edge',
    },
    {
      label: 'phone six-handed',
      playerCount: 6,
      viewportWidth: 390,
      roomShellLayout: 'stacked',
      tableDiameter: 208,
      profile: 'phone-oval',
      expectedSlots: ['hero', 'lower-left', 'upper-left', 'top', 'upper-right', 'lower-right'],
      expectedHeroZone: 'dock-edge',
    },
  ];

  for (const config of cases) {
    const layout = buildSeatRingPositions({
      playerCount: config.playerCount,
      viewportWidth: config.viewportWidth,
      roomShellLayout: config.roomShellLayout,
      tableDiameter: config.tableDiameter,
      profile: config.profile,
    });

    assert.deepEqual(
      layout.map((seat) => seat.slotId),
      config.expectedSlots,
      `${config.label} slot semantics`
    );
    assert.equal(layout[0].anchorZone, config.expectedHeroZone, `${config.label} hero zone`);

    const topSeat = layout.find((seat) => seat.slotId === 'top');
    assert.ok(topSeat, `${config.label} top seat`);
    assert.equal(topSeat.x, 0, `${config.label} top seat should stay centered`);
    assert.equal(topSeat.anchorRole, 'top', `${config.label} top seat role`);
    assert.equal(topSeat.anchorZone, 'stage-band-clear', `${config.label} top seat zone`);
    assert.equal(layout.overlaps.tableBody, 0, `${config.label} table overlap`);
    assert.equal(layout.overlaps.stageBand, 0, `${config.label} stage overlap`);
  }
});

test('desktop canonical slots keep normalized coordinates stable across active footprints', () => {
  const splitStage = buildSeatRingPositions({
    playerCount: 9,
    viewportWidth: 1440,
    roomShellLayout: 'split-stage',
    tableDiameter: 352,
    profile: 'desktop-oval',
  });
  const threeColumn = buildSeatRingPositions({
    playerCount: 9,
    viewportWidth: 1600,
    roomShellLayout: 'three-column',
    tableDiameter: 320,
    profile: 'desktop-oval',
  });

  const splitBySlot = indexBySlotId(splitStage);
  const threeBySlot = indexBySlotId(threeColumn);

  assert.deepEqual(
    Object.keys(splitBySlot).sort(),
    Object.keys(threeBySlot).sort()
  );
  assert.equal(Object.keys(splitBySlot).length, 9);

  for (const slotId of Object.keys(splitBySlot)) {
    assert.deepEqual(
      splitBySlot[slotId].normalized,
      threeBySlot[slotId].normalized,
      `desktop normalized projection for ${slotId}`
    );
  }
});

test('phone canonical slots keep normalized coordinates stable across active footprints', () => {
  const portrait = buildSeatRingPositions({
    playerCount: 9,
    viewportWidth: 390,
    roomShellLayout: 'stacked',
    tableDiameter: 208,
    profile: 'phone-oval',
  });
  const shortHeight = buildSeatRingPositions({
    playerCount: 9,
    viewportWidth: 844,
    roomShellLayout: 'stacked',
    tableDiameter: 186,
    profile: 'phone-oval',
  });

  const portraitBySlot = indexBySlotId(portrait);
  const shortBySlot = indexBySlotId(shortHeight);

  assert.deepEqual(
    Object.keys(portraitBySlot).sort(),
    Object.keys(shortBySlot).sort()
  );
  assert.equal(Object.keys(portraitBySlot).length, 9);

  for (const slotId of Object.keys(portraitBySlot)) {
    assert.deepEqual(
      portraitBySlot[slotId].normalized,
      shortBySlot[slotId].normalized,
      `phone normalized projection for ${slotId}`
    );
  }
});

test('supported 2-9 player rooms keep the canonical table body and stage band clear', () => {
  const cases = [
    {
      profile: 'desktop-oval',
      viewportWidth: 1440,
      roomShellLayout: 'split-stage',
      tableDiameter: 352,
      cardWidth: 132,
      cardHeight: 144,
    },
    {
      profile: 'phone-oval',
      viewportWidth: 390,
      roomShellLayout: 'stacked',
      tableDiameter: 208,
      cardWidth: 70,
      cardHeight: 128,
    },
  ];

  for (const config of cases) {
    for (const playerCount of [2, 4, 6, 9]) {
      const layout = buildSeatRingPositions({
        playerCount,
        viewportWidth: config.viewportWidth,
        roomShellLayout: config.roomShellLayout,
        tableDiameter: config.tableDiameter,
        profile: config.profile,
      });
      const runtimeFootprint = getSeatRingLayoutProfile({
        viewportWidth: config.viewportWidth,
        roomShellLayout: config.roomShellLayout,
        tableDiameter: config.tableDiameter,
        profile: config.profile,
      });

      assert.equal(layout.overlaps.tableBody, 0, `${config.profile} table overlap for ${playerCount} players`);
      assert.equal(layout.overlaps.stageBand, 0, `${config.profile} stage overlap for ${playerCount} players`);
      assert.equal(
        countTableRectOverlaps({
          positions: layout,
          tableWidth: runtimeFootprint.tableWidth,
          tableHeight: runtimeFootprint.tableHeight,
          cardWidth: config.cardWidth,
          cardHeight: config.cardHeight,
        }),
        0,
        `${config.profile} body collision for ${playerCount} players`
      );
    }
  }
});
