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
