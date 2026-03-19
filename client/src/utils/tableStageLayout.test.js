import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildStageChromeLayout,
  resolveCommunityCardLayout,
  resolveTableSurfaceLayout,
} from './tableStageLayout.js';

function getCommunityRowWidth({ cardWidth, gap, cardCount = 5 }) {
  return cardWidth * cardCount + gap * Math.max(0, cardCount - 1);
}

test('keeps five community cards inside the phone table safe width', () => {
  const layout = resolveCommunityCardLayout({
    viewportWidth: 390,
    tableDiameter: 208,
  });

  assert.ok(
    getCommunityRowWidth(layout) <= layout.safeWidth,
    `expected row width ${getCommunityRowWidth(layout)} to fit within ${layout.safeWidth}`
  );
  assert.equal(layout.phaseVisible, false);
});

test('keeps five community cards inside the desktop table safe width', () => {
  const layout = resolveCommunityCardLayout({
    viewportWidth: 1280,
    tableDiameter: 352,
  });

  assert.ok(
    getCommunityRowWidth(layout) <= layout.safeWidth,
    `expected row width ${getCommunityRowWidth(layout)} to fit within ${layout.safeWidth}`
  );
  assert.equal(layout.phaseVisible, true);
});

test('builds the same tournament table family for desktop and phone portrait', () => {
  const desktop = resolveTableSurfaceLayout({ viewportWidth: 1440, tableDiameter: 352 });
  const phone = resolveTableSurfaceLayout({ viewportWidth: 390, tableDiameter: 208 });

  assert.equal(desktop.family, 'tournament-capsule-9max');
  assert.equal(phone.family, 'tournament-capsule-9max');
  assert.equal(desktop.profile, 'desktop-oval');
  assert.equal(phone.profile, 'phone-oval');
});

test('pins the stage chrome orbit to nine markers with a single head marker', () => {
  const layout = buildStageChromeLayout({
    viewportWidth: 1280,
    tableDiameter: 352,
    seatGuides: [],
  });

  assert.equal(layout.family, 'tournament-capsule-9max');
  assert.equal(layout.orbit.markerCount, 9);
  assert.equal(layout.orbitMarkers.length, 9);
  assert.equal(
    layout.orbitMarkers.filter((marker) => marker.isHeadMarker).length,
    1,
    'expected exactly one head marker in the orbit'
  );
  assert.equal(layout.orbitMarkers[0].isHeadMarker, true);
  assert.equal(
    Math.min(...layout.orbitMarkers.map((marker) => marker.cy)),
    layout.orbitMarkers[0].cy,
    'expected the head marker to anchor the top of the orbit'
  );
});

test('maps seat guides and board tray into desktop stage chrome bounds', () => {
  const layout = buildStageChromeLayout({
    viewportWidth: 1280,
    tableDiameter: 352,
    seatGuides: [
      { seatIndex: 0, seatLabel: '座1', positionLabel: 'SB/BTN', position: { x: 0, y: 210 } },
      { seatIndex: 1, seatLabel: '座2', positionLabel: 'BB', position: { x: 188, y: 112 } },
      { seatIndex: 2, seatLabel: '座3', positionLabel: null, position: { x: 188, y: -112 } },
      { seatIndex: 3, seatLabel: '座4', positionLabel: null, position: { x: 0, y: -210 } },
      { seatIndex: 4, seatLabel: '座5', positionLabel: null, position: { x: -188, y: -112 } },
      { seatIndex: 5, seatLabel: '座6', positionLabel: null, position: { x: -188, y: 112 } },
    ],
  });

  assert.equal(layout.seatGuides.length, 6);
  assert.ok(layout.boardTray.width < layout.table.outerRx * 2);
  assert.ok(layout.boardTray.height < layout.table.outerRy * 2);
  layout.seatGuides.forEach((guide) => {
    assert.ok(guide.cx >= 0 && guide.cx <= layout.width, `seat ${guide.seatLabel} cx ${guide.cx} outside ${layout.width}`);
    assert.ok(guide.cy >= 0 && guide.cy <= layout.height, `seat ${guide.seatLabel} cy ${guide.cy} outside ${layout.height}`);
  });
});

test('keeps phone portrait stage chrome compact while preserving marker metadata', () => {
  const layout = buildStageChromeLayout({
    viewportWidth: 390,
    tableDiameter: 208,
    seatGuides: [
      { seatIndex: 0, seatLabel: '座1', positionLabel: 'BB', position: { x: 0, y: 132 } },
      { seatIndex: 1, seatLabel: '座2', positionLabel: 'SB/BTN', position: { x: 120, y: 70 } },
      { seatIndex: 2, seatLabel: '座3', positionLabel: null, position: { x: 120, y: -70 } },
      { seatIndex: 3, seatLabel: '座4', positionLabel: null, position: { x: 0, y: -132 } },
      { seatIndex: 4, seatLabel: '座5', positionLabel: null, position: { x: -120, y: -70 } },
      { seatIndex: 5, seatLabel: '座6', positionLabel: null, position: { x: -120, y: 70 } },
    ],
  });

  assert.equal(layout.viewMode, 'compact');
  assert.ok(layout.width < 520);
  assert.equal(layout.seatGuides[0].markerLabel, 'BB');
  assert.equal(layout.seatGuides[1].markerLabel, 'SB/BTN');
});

test('uses a desktop oval table profile for wide stages', () => {
  const layout = buildStageChromeLayout({
    viewportWidth: 1280,
    tableDiameter: 352,
    seatGuides: [],
    tableProfile: 'desktop-oval',
  });

  assert.equal(layout.profile, 'desktop-oval');
  assert.ok(layout.table.outerRx > layout.table.outerRy);
  assert.ok(layout.stageBand.height > 0);
});

test('uses a phone oval table profile for portrait stages', () => {
  const layout = buildStageChromeLayout({
    viewportWidth: 390,
    tableDiameter: 208,
    seatGuides: [],
    tableProfile: 'phone-oval',
  });

  assert.equal(layout.profile, 'phone-oval');
  assert.ok(layout.table.outerRy > layout.table.outerRx);
  assert.ok(layout.boardTray.height < layout.table.outerRy * 2);
});
