import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {
  buildStageChromeLayout,
  resolveCommunityCardLayout,
  resolveRoomGeometryContract,
  resolveSeatRingRotationSeatIndex,
  resolveTableSurfaceLayout,
} from './tableStageLayout.js';
import { resolveStageViewportContract } from './roomViewportLayout.js';
import { buildSeatRingPositions, getSeatRingLayoutProfile } from './seatRingLayout.js';

function getCommunityRowWidth({ cardWidth, gap, cardCount = 5 }) {
  return cardWidth * cardCount + gap * Math.max(0, cardCount - 1);
}

function readSource(relativePath) {
  return fs.readFileSync(new URL(relativePath, import.meta.url), 'utf8');
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

  assert.equal(desktop.family, 'broadcast-tactical-9max');
  assert.equal(phone.family, 'broadcast-tactical-9max');
  assert.equal(desktop.profile, 'desktop-oval');
  assert.equal(phone.profile, 'phone-oval');
});

test('advertises the broadcast tactical table material family and clean center surface', () => {
  const layout = resolveTableSurfaceLayout({ viewportWidth: 1280, tableDiameter: 352 });

  assert.equal(layout.family, 'broadcast-tactical-9max');
  assert.equal(layout.centerSurfaceModel, 'broadcast-clean-center');
  assert.equal(layout.material.feltTone, 'deep-green-velvet');
  assert.equal(layout.material.railTone, 'black-gold');
});

test('compresses short-height landscape stage layout without changing the family', () => {
  const shortLandscape = resolveTableSurfaceLayout({
    viewportWidth: 844,
    viewportHeight: 390,
    tableDiameter: 320,
  });
  const regularLandscape = resolveTableSurfaceLayout({
    viewportWidth: 844,
    viewportHeight: 900,
    tableDiameter: 320,
  });

  assert.equal(shortLandscape.family, 'broadcast-tactical-9max');
  assert.equal(shortLandscape.heightClass, 'short-height');
  assert.equal(shortLandscape.stageDensity, 'compressed');
  assert.equal(shortLandscape.stageBudget.minStageBudgetPx, 180);
  assert.equal(shortLandscape.stageBudget.minStageBudgetPx, resolveStageViewportContract({ width: 844, height: 390 }).minStageBudgetPx);
  assert.ok(shortLandscape.stageScale < 1);
  assert.ok(shortLandscape.tableHeight < regularLandscape.tableHeight);
  assert.ok(shortLandscape.stageMinHeightPx < regularLandscape.stageMinHeightPx);
});

test('builds one shared runtime geometry contract for short-height landscape rooms', () => {
  const contract = resolveRoomGeometryContract({
    viewportWidth: 844,
    viewportHeight: 390,
    roomShellLayout: 'split-stage',
    tableDiameter: 352,
  });
  const seatGuides = Array.from({ length: 9 }, (_, seatIndex) => ({
    seatIndex,
    seatLabel: `Seat ${seatIndex + 1}`,
    positionLabel: null,
    isCurrentPlayer: seatIndex === 5,
    position: { x: 900 - seatIndex * 90, y: -900 + seatIndex * 80 },
  }));
  const chrome = buildStageChromeLayout({
    geometryContract: contract,
    seatGuides,
    roomShellLayout: 'split-stage',
  });
  const canonical = buildSeatRingPositions({
    playerCount: 9,
    ...contract.seatRingLayout,
  });
  const heroGuide = chrome.seatGuides.find((guide) => guide.isHero);

  assert.equal(contract.viewportLayout.heightClass, 'short-height');
  assert.equal(contract.viewportLayout.stageDensity, 'compressed');
  assert.equal(contract.viewportLayout.minStageBudgetPx, 180);
  assert.equal(contract.tableSurfaceLayout.heightClass, contract.viewportLayout.heightClass);
  assert.equal(contract.tableSurfaceLayout.stageBudget.minStageBudgetPx, contract.viewportLayout.minStageBudgetPx);
  assert.equal(contract.tableSurfaceLayout.stageMinHeightPx, contract.viewportLayout.minStageBudgetPx);
  assert.equal(contract.tableSurfaceLayout.profile, 'phone-oval');
  assert.equal(contract.seatRingLayout.profile, contract.tableSurfaceLayout.profile);
  assert.equal(contract.seatRingLayout.tableDiameter, contract.tableSurfaceLayout.effectiveTableDiameter);
  assert.equal(contract.seatRingLayout.roomShellLayout, 'split-stage');
  assert.equal(chrome.heightClass, contract.viewportLayout.heightClass);
  assert.equal(chrome.profile, contract.tableSurfaceLayout.profile);
  assert.ok(heroGuide);
  assert.equal(heroGuide.seatIndex, 5);
  assert.equal(heroGuide.anchorRole, 'hero');
  assert.equal(heroGuide.anchorZone, 'dock-edge');
  assert.equal(heroGuide.cx, chrome.centerX + canonical[0].x);
  assert.equal(heroGuide.cy, chrome.centerY + canonical[0].y);
});

test('exposes canonical anchor slots on the runtime geometry contract for supported room sizes', () => {
  const contract = resolveRoomGeometryContract({
    viewportWidth: 1280,
    viewportHeight: 900,
    roomShellLayout: 'split-stage',
    tableDiameter: 352,
    playerCount: 6,
  });

  assert.equal(contract.canonicalSlots.length, 6);
  assert.equal(contract.canonicalSlots[0].anchorRole, 'hero');
  assert.equal(contract.canonicalSlots[0].anchorZone, 'table-edge');
  assert.ok(contract.canonicalSlots.every((slot) => slot.anchorSlotId));
  assert.ok(contract.canonicalSlots.every((slot) => slot.position));
  assert.equal(contract.canonicalSlots[0].position.x, 0);
});

test('runtime geometry contract keeps explicit 9-max slots for late short-handed and clamped room sizes', () => {
  const cases = [
    {
      label: 'desktop eight-handed',
      viewportWidth: 1440,
      viewportHeight: 900,
      roomShellLayout: 'split-stage',
      tableDiameter: 352,
      playerCount: 8,
      expectedSlots: ['hero', 'lower-left', 'upper-left', 'top-left', 'top', 'top-right', 'upper-right', 'lower-right'],
    },
    {
      label: 'desktop clamped ten-handed',
      viewportWidth: 1440,
      viewportHeight: 900,
      roomShellLayout: 'split-stage',
      tableDiameter: 352,
      playerCount: 10,
      expectedSlots: ['hero', 'lower-left', 'upper-left', 'top-left', 'top', 'top-right', 'upper-right', 'lower-right', 'near-hero-right'],
    },
    {
      label: 'phone nine-handed',
      viewportWidth: 390,
      viewportHeight: 844,
      roomShellLayout: 'stacked',
      tableDiameter: 208,
      playerCount: 9,
      expectedSlots: ['hero', 'lower-left', 'upper-left', 'top-left', 'top', 'top-right', 'upper-right', 'lower-right', 'near-hero-right'],
    },
  ];

  for (const config of cases) {
    const contract = resolveRoomGeometryContract(config);

    assert.deepEqual(
      contract.canonicalSlots.map((slot) => slot.slotId),
      config.expectedSlots,
      `${config.label} slot semantics`
    );
    assert.ok(
      contract.canonicalSlots.every((slot) => slot.anchorSlotId?.includes(slot.slotId)),
      `${config.label} anchor slot ids`
    );
  }
});

test('falls back to hero orientation when the current player is spectating', () => {
  assert.equal(resolveSeatRingRotationSeatIndex({ seat: -1 }), 0);
  assert.equal(resolveSeatRingRotationSeatIndex({ seat: 4 }), 4);
});

test('pins the stage chrome orbit to nine markers with a single head marker', () => {
  const layout = buildStageChromeLayout({
    viewportWidth: 1280,
    tableDiameter: 352,
    seatGuides: [],
  });

  assert.equal(layout.family, 'broadcast-tactical-9max');
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

test('desktop oval stage chrome leaves a real clearance gap above the top seat', () => {
  const seatRingLayout = buildSeatRingPositions({
    playerCount: 6,
    viewportWidth: 1280,
    viewportHeight: 900,
    roomShellLayout: 'split-stage',
    tableDiameter: 352,
    profile: 'desktop-oval',
  });
  const seatGuides = seatRingLayout.map((seat, seatIndex) => ({
    seatIndex,
    seatLabel: `Seat ${seatIndex + 1}`,
    positionLabel: null,
    occupied: true,
    position: { x: seat.x, y: seat.y, profile: seat.profile },
  }));
  const layout = buildStageChromeLayout({
    viewportWidth: 1280,
    viewportHeight: 900,
    tableDiameter: 352,
    roomShellLayout: 'split-stage',
    tableProfile: 'desktop-oval',
    seatGuides,
  });
  const profile = getSeatRingLayoutProfile({
    viewportWidth: 1280,
    roomShellLayout: 'split-stage',
    tableDiameter: 352,
    profile: 'desktop-oval',
  });
  const topSeat = seatRingLayout.find((seat) => seat.slotId === 'top');

  assert.ok(topSeat);
  assert.ok(
    layout.centerY + topSeat.y + profile.cardHeight / 2 <= layout.stageBand.y - 12,
    'top seat should stay clearly above the stage band'
  );
});

test('desktop capsule stage chrome exposes horizontal shell semantics and tray clearance', () => {
  const layout = buildStageChromeLayout({
    viewportWidth: 1440,
    viewportHeight: 900,
    tableDiameter: 352,
    roomShellLayout: 'split-stage',
    tableProfile: 'desktop-oval',
    seatGuides: [],
  });

  assert.equal(layout.table.shellOrientation, 'horizontal-capsule');
  assert.ok(layout.table.shellRx > layout.table.shellRy);
  assert.ok(layout.stageBand.clearanceToTable >= 12);
  assert.ok(layout.boardTray.clearanceToStageBand >= 14);
  assert.ok(layout.boardTray.shellRx >= layout.boardTray.shellRy);
});

test('phone capsule stage chrome exposes vertical shell semantics and dock-side tray clearance', () => {
  const layout = buildStageChromeLayout({
    viewportWidth: 390,
    viewportHeight: 844,
    tableDiameter: 208,
    roomShellLayout: 'stacked',
    tableProfile: 'phone-oval',
    seatGuides: [],
  });

  assert.equal(layout.table.shellOrientation, 'vertical-capsule');
  assert.ok(layout.table.shellRy > layout.table.shellRx);
  assert.equal(layout.boardTray.dockBias, 'dock-edge');
  assert.ok(layout.stageBand.clearanceToTable >= 10);
  assert.ok(layout.boardTray.clearanceToStageBand >= 10);
});

test('TableStageChrome renders broadcast rail and felt material hooks instead of ellipse HUD rings', () => {
  const source = readSource('../components/TableStageChrome.jsx');

  assert.match(source, /data-table-rail-flow/);
  assert.match(source, /data-center-surface-model/);
  assert.match(source, /data-table-material-felt-tone/);
  assert.match(source, /data-table-material-rail-tone/);
  assert.match(source, /<rect/);
  assert.doesNotMatch(source, /<ellipse/);
});

test('TableStageChrome stops using the old shell-orbit HUD framing language', () => {
  const source = readSource('../components/TableStageChrome.jsx');

  assert.doesNotMatch(source, /shellOrientation/);
  assert.doesNotMatch(source, /orbitRingPath/);
  assert.doesNotMatch(source, /haloShell/);
  assert.doesNotMatch(source, /guide-ring/);
});

test('CommunityCards composes the board tray as a profile-aware capsule rail', () => {
  const source = readSource('../components/CommunityCards.jsx');

  assert.match(source, /tableProfile/);
  assert.match(source, /community-cards-area__tray/);
  assert.match(source, /community-cards-area--/);
});

test('TableStage threads the resolved table profile into the community board render path', () => {
  const source = readSource('../components/TableStage.jsx');

  assert.match(source, /tableProfile=\{tableSurfaceLayout\.profile\}/);
  assert.match(source, /data-table-shell-orientation/);
});

test('visible felt shell radius follows shell-orientation semantics instead of a phone-only override', () => {
  const source = readSource('../index.css');

  assert.match(source, /\.table-stage-table-shell\[data-table-shell-orientation="horizontal-capsule"\]/);
  assert.match(source, /\.table-stage-table-shell\[data-table-shell-orientation="vertical-capsule"\]/);
  assert.doesNotMatch(
    source,
    /\.table-stage-table-shell\[data-table-profile="phone-oval"\]\s*\{[^}]*border-radius/
  );
});

test('broadcast tactical table styles use the restrained grain token instead of only declaring it', () => {
  const source = readSource('../index.css');

  assert.match(source, /var\(--table-stage-grain-opacity\)/);
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

test('normalizes stage chrome guides to canonical 9-max anchors for supported counts', () => {
  const rawSeatGuides = [
    {
      seatIndex: 0,
      seatLabel: 'Seat 1',
      positionLabel: 'SB/BTN',
      position: { x: 999, y: -999, anchorZone: 'legacy' },
    },
    {
      seatIndex: 1,
      seatLabel: 'Seat 2',
      positionLabel: 'BB',
      position: { x: -999, y: 999, anchorZone: 'legacy' },
    },
    {
      seatIndex: 2,
      seatLabel: 'Seat 3',
      positionLabel: null,
      position: { x: 777, y: 777, anchorZone: 'legacy' },
    },
    {
      seatIndex: 3,
      seatLabel: 'Seat 4',
      positionLabel: null,
      position: { x: -444, y: -444, anchorZone: 'legacy' },
    },
    {
      seatIndex: 4,
      seatLabel: 'Seat 5',
      positionLabel: null,
      position: { x: 333, y: -333, anchorZone: 'legacy' },
    },
    {
      seatIndex: 5,
      seatLabel: 'Seat 6',
      positionLabel: null,
      position: { x: -222, y: 222, anchorZone: 'legacy' },
    },
  ];
  const layout = buildStageChromeLayout({
    viewportWidth: 1440,
    viewportHeight: 900,
    tableDiameter: 352,
    roomShellLayout: 'split-stage',
    seatGuides: rawSeatGuides,
    tableProfile: 'desktop-oval',
  });
  const canonicalGuides = buildSeatRingPositions({
    playerCount: rawSeatGuides.length,
    viewportWidth: 1440,
    roomShellLayout: 'split-stage',
    tableDiameter: 352,
    profile: 'desktop-oval',
  });

  assert.equal(layout.seatGuides.length, rawSeatGuides.length);
  layout.seatGuides.forEach((guide, index) => {
    const canonical = canonicalGuides[index];

    assert.equal(guide.cx, layout.centerX + canonical.x);
    assert.equal(guide.cy, layout.centerY + canonical.y);
    assert.equal(guide.anchorZone, canonical.anchorZone);
  });
  assert.notEqual(layout.seatGuides[0].cx, layout.centerX + rawSeatGuides[0].position.x);
  assert.notEqual(layout.seatGuides[0].cy, layout.centerY + rawSeatGuides[0].position.y);
});

test('keeps the hero anchor on the hero-relative slot for split-stage tables', () => {
  const rawSeatGuides = [
    { seatIndex: 0, seatLabel: 'Seat 1', positionLabel: 'UTG', isCurrentPlayer: false, position: { x: -999, y: -999 } },
    { seatIndex: 1, seatLabel: 'Seat 2', positionLabel: 'HJ', isCurrentPlayer: false, position: { x: -888, y: -888 } },
    { seatIndex: 2, seatLabel: 'Seat 3', positionLabel: 'CO', isCurrentPlayer: false, position: { x: -777, y: -777 } },
    { seatIndex: 3, seatLabel: 'Seat 4', positionLabel: 'BTN', isCurrentPlayer: true, position: { x: 111, y: 222 } },
    { seatIndex: 4, seatLabel: 'Seat 5', positionLabel: 'SB', isCurrentPlayer: false, position: { x: 333, y: 444 } },
    { seatIndex: 5, seatLabel: 'Seat 6', positionLabel: 'BB', isCurrentPlayer: false, position: { x: 555, y: 666 } },
  ];
  const layout = buildStageChromeLayout({
    viewportWidth: 1280,
    viewportHeight: 900,
    tableDiameter: 352,
    roomShellLayout: 'split-stage',
    seatGuides: rawSeatGuides,
    tableProfile: 'desktop-oval',
  });
  const canonical = buildSeatRingPositions({
    playerCount: rawSeatGuides.length,
    viewportWidth: 1280,
    roomShellLayout: 'split-stage',
    tableDiameter: layout.effectiveTableDiameter,
    profile: 'desktop-oval',
  });
  const heroGuide = layout.seatGuides.find((guide) => guide.isHero);

  assert.ok(heroGuide);
  assert.equal(heroGuide.seatIndex, 3);
  assert.equal(heroGuide.anchorRole, 'hero');
  assert.equal(heroGuide.anchorZone, 'table-edge');
  assert.equal(heroGuide.cx, layout.centerX + canonical[0].x);
  assert.equal(heroGuide.cy, layout.centerY + canonical[0].y);
});

test('keeps short-height phone-oval normalization aligned to the unified hero anchor', () => {
  const rawSeatGuides = Array.from({ length: 9 }, (_, seatIndex) => ({
    seatIndex,
    seatLabel: `Seat ${seatIndex + 1}`,
    positionLabel: null,
    isCurrentPlayer: seatIndex === 5,
    position: { x: 900 - seatIndex * 90, y: -900 + seatIndex * 80 },
  }));
  const layout = buildStageChromeLayout({
    viewportWidth: 844,
    viewportHeight: 390,
    tableDiameter: 320,
    roomShellLayout: 'stacked',
    seatGuides: rawSeatGuides,
  });
  const canonical = buildSeatRingPositions({
    playerCount: rawSeatGuides.length,
    viewportWidth: 844,
    roomShellLayout: 'stacked',
    tableDiameter: layout.effectiveTableDiameter,
    profile: 'phone-oval',
  });
  const heroGuide = layout.seatGuides.find((guide) => guide.isHero);

  assert.equal(layout.profile, 'phone-oval');
  assert.equal(layout.heightClass, 'short-height');
  assert.equal(layout.stageDensity, 'compressed');
  assert.ok(heroGuide);
  assert.equal(heroGuide.seatIndex, 5);
  assert.equal(heroGuide.anchorRole, 'hero');
  assert.equal(heroGuide.anchorZone, 'dock-edge');
  assert.equal(heroGuide.cx, layout.centerX + canonical[0].x);
  assert.equal(heroGuide.cy, layout.centerY + canonical[0].y);
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
