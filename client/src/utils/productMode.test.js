import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildModePreviewCards,
  deriveCreateRoomAdvancedPanelState,
  getDisplayModeTheme,
  normalizeDisplayModePreference,
  normalizeRoomMode,
  resolveRoomShellLayout,
  resolveDisplayMode,
} from './productMode.js';

test('defaults unsupported room modes back to pro', () => {
  assert.equal(normalizeRoomMode(undefined), 'pro');
  assert.equal(normalizeRoomMode('study'), 'study');
  assert.equal(normalizeRoomMode('unknown'), 'pro');
});

test('defaults unsupported display-mode preferences back to inherit', () => {
  assert.equal(normalizeDisplayModePreference(undefined), 'inherit');
  assert.equal(normalizeDisplayModePreference('club'), 'club');
  assert.equal(normalizeDisplayModePreference('unknown'), 'inherit');
});

test('resolves inherit display mode to the room mode and honors explicit overrides', () => {
  assert.equal(resolveDisplayMode('study', 'inherit'), 'study');
  assert.equal(resolveDisplayMode('club', 'pro'), 'pro');
  assert.equal(resolveDisplayMode('unknown', 'inherit'), 'pro');
});

test('returns stable shell theme tokens for each display mode', () => {
  const proTheme = getDisplayModeTheme('pro');
  const clubTheme = getDisplayModeTheme('club');

  assert.equal(proTheme.mode, 'pro');
  assert.equal(proTheme.label, 'Pro');
  assert.equal(proTheme.title, '职业对局');
  assert.equal(proTheme.shellClassName, 'mode-shell-pro');
  assert.equal(proTheme.accentClassName, 'mode-accent-pro');
  assert.equal(proTheme.layoutDensity, 'high');
  assert.equal(proTheme.motionStyle, 'sharp');

  assert.equal(clubTheme.mode, 'club');
  assert.equal(clubTheme.label, 'Club');
  assert.equal(clubTheme.title, '私局辅助');
  assert.equal(clubTheme.shellClassName, 'mode-shell-club');
  assert.equal(clubTheme.accentClassName, 'mode-accent-club');
  assert.equal(clubTheme.layoutDensity, 'medium');
  assert.equal(clubTheme.motionStyle, 'measured');
});

test('builds mode preview cards in club-pro-study order', () => {
  assert.deepEqual(
    buildModePreviewCards().map((card) => ({
      mode: card.mode,
      label: card.label,
      title: card.title,
      shellClassName: card.shellClassName,
      accentClassName: card.accentClassName,
      layoutDensity: card.layoutDensity,
    })),
    [
      {
        mode: 'club',
        label: 'Club',
        title: '私局辅助',
        shellClassName: 'mode-shell-club',
        accentClassName: 'mode-accent-club',
        layoutDensity: 'medium',
      },
      {
        mode: 'pro',
        label: 'Pro',
        title: '职业对局',
        shellClassName: 'mode-shell-pro',
        accentClassName: 'mode-accent-pro',
        layoutDensity: 'high',
      },
      {
        mode: 'study',
        label: 'Study',
        title: '训练复盘',
        shellClassName: 'mode-shell-study',
        accentClassName: 'mode-accent-study',
        layoutDensity: 'medium',
      },
    ]
  );
});

test('builds richer gateway preview metadata for tactical arena mode cards', () => {
  const [clubCard, proCard, studyCard] = buildModePreviewCards();

  assert.equal(clubCard.gatewayScene, 'Host Table');
  assert.equal(clubCard.gatewayPersona, '线下私局组织者');

  assert.equal(proCard.gatewayScene, 'Arena Table');
  assert.equal(proCard.gatewayPersona, '线上职业玩家');

  assert.equal(studyCard.gatewayScene, 'Review Desk');
  assert.equal(studyCard.gatewayPersona, '复盘与训练者');
});

test('exposes room-shell choreography tokens for each display mode', () => {
  const clubTheme = getDisplayModeTheme('club');
  const proTheme = getDisplayModeTheme('pro');
  const studyTheme = getDisplayModeTheme('study');

  assert.equal(clubTheme.motionStyle, 'measured');
  assert.equal(clubTheme.room.stageLabel, 'Table Console');
  assert.equal(clubTheme.room.intelTitle, '桌况总览');
  assert.equal(clubTheme.room.actionTitle, '本席控制');
  assert.equal(clubTheme.room.historyPreviewCount, 3);

  assert.equal(proTheme.motionStyle, 'sharp');
  assert.equal(proTheme.room.stageLabel, 'Table Stage');
  assert.equal(proTheme.room.actionTitle, 'Hero Seat');
  assert.equal(proTheme.room.historyPreviewCount, 4);

  assert.equal(studyTheme.motionStyle, 'annotated');
  assert.equal(studyTheme.room.stageLabel, 'Review Stage');
  assert.equal(studyTheme.room.eventTitle, 'Review Rail');
  assert.equal(studyTheme.room.latestHandLabel, '上一手结算');
  assert.equal(studyTheme.room.historyPreviewCount, 6);
});

test('exposes tactical arena visual tokens and responsive hints for each display mode', () => {
  const clubTheme = getDisplayModeTheme('club');
  const proTheme = getDisplayModeTheme('pro');
  const studyTheme = getDisplayModeTheme('study');

  assert.equal(proTheme.shellTone, 'broadcast-arena');
  assert.equal(proTheme.tableTone, 'velocity-felt');
  assert.equal(proTheme.seatTone, 'combat-plaque');
  assert.equal(proTheme.responsiveProfile.desktop, 'triple-rail');
  assert.equal(proTheme.responsiveProfile.phone, 'hero-dock-first');

  assert.equal(clubTheme.shellTone, 'private-lounge');
  assert.equal(clubTheme.tableTone, 'walnut-felt');
  assert.equal(clubTheme.seatTone, 'host-console');
  assert.equal(clubTheme.responsiveProfile.tablet, 'host-rail-persistent');

  assert.equal(studyTheme.shellTone, 'review-studio');
  assert.equal(studyTheme.tableTone, 'review-grid');
  assert.equal(studyTheme.seatTone, 'analysis-plaque');
  assert.equal(studyTheme.responsiveProfile.ultrawide, 'center-stage');
});

test('exposes shell chrome tokens for the responsive tactical arena layout', () => {
  const clubTheme = getDisplayModeTheme('club');
  const proTheme = getDisplayModeTheme('pro');
  const studyTheme = getDisplayModeTheme('study');

  assert.equal(clubTheme.chromeTone, 'brass-rig');
  assert.equal(clubTheme.shellLayout.phone, 'stacked');

  assert.equal(proTheme.chromeTone, 'broadcast-rig');
  assert.equal(proTheme.shellLayout.desktop, 'command-center');
  assert.equal(proTheme.shellLayout.ultrawide, 'framed-center');

  assert.equal(studyTheme.chromeTone, 'analysis-rig');
  assert.equal(studyTheme.shellLayout.tablet, 'split-review');
});

test('uses a split room shell on mid desktop widths and reserves full three-column layout for wider screens', () => {
  assert.equal(resolveRoomShellLayout(390), 'stacked');
  assert.equal(resolveRoomShellLayout(1024), 'stacked');
  assert.equal(resolveRoomShellLayout(1280), 'split-stage');
  assert.equal(resolveRoomShellLayout(1440), 'split-stage');
  assert.equal(resolveRoomShellLayout(1536), 'three-column');
});

test('exposes tactical motion tokens that differ by display mode', () => {
  const clubTheme = getDisplayModeTheme('club');
  const proTheme = getDisplayModeTheme('pro');
  const studyTheme = getDisplayModeTheme('study');

  assert.deepEqual(proTheme.motion, {
    enterMs: 180,
    emphasisMs: 260,
    ambientSeconds: 12,
    spotlightSeconds: 2.4,
    floatSeconds: 7,
    ambientOpacity: 0.9,
  });

  assert.deepEqual(clubTheme.motion, {
    enterMs: 220,
    emphasisMs: 320,
    ambientSeconds: 16,
    spotlightSeconds: 3.2,
    floatSeconds: 9,
    ambientOpacity: 0.78,
  });

  assert.deepEqual(studyTheme.motion, {
    enterMs: 240,
    emphasisMs: 340,
    ambientSeconds: 18,
    spotlightSeconds: 3.4,
    floatSeconds: 10,
    ambientOpacity: 0.82,
  });
});

test('exposes single-screen room terminal metadata for each display mode', () => {
  const clubTheme = getDisplayModeTheme('club');
  const proTheme = getDisplayModeTheme('pro');
  const studyTheme = getDisplayModeTheme('study');

  for (const theme of [clubTheme, proTheme, studyTheme]) {
    assert.equal(theme.roomTerminal.intent, 'single-screen-terminal');
    assert.equal(theme.roomTerminal.tableFamily, 'tournament-capsule-9max');
    assert.equal(theme.roomTerminal.maxVisualSeats, 9);
    assert.equal(theme.roomTerminal.desktop.geometryModel, 'unified-9max');
    assert.equal(theme.roomTerminal.desktop.surfaceModel, 'single-screen');
    assert.equal(theme.roomTerminal.desktop.surfacePolicy, 'table-and-dock');
    assert.equal(theme.roomTerminal.phone.geometryModel, 'unified-9max-portrait');
    assert.equal(theme.roomTerminal.phone.heroDock, 'fixed-bottom');
    assert.deepEqual(theme.roomTerminal.phone.sheetOrder, ['players', 'history', 'room']);
    assert.equal(theme.roomTerminal.phone.surfacePolicy, 'bottom-sheets');
    assert.equal(theme.createRoom.entryModel, 'profile-first');
    assert.equal(theme.createRoom.primaryActionLabel, '创建房间');
    assert.equal(theme.sheetLabels.players, theme.roomTerminal.sheetLabels.players);
    assert.equal(theme.sheetLabels.history, theme.roomTerminal.sheetLabels.history);
    assert.equal(theme.sheetLabels.room, theme.roomTerminal.sheetLabels.room);
  }

  assert.equal(clubTheme.sheetLabels.players, '成员');
  assert.equal(clubTheme.sheetLabels.history, '最近动态');
  assert.equal(clubTheme.sheetLabels.room, '房间设置');

  assert.equal(proTheme.sheetLabels.players, 'Roster');
  assert.equal(proTheme.sheetLabels.history, 'Hand Tape');
  assert.equal(proTheme.sheetLabels.room, 'Room');

  assert.equal(studyTheme.sheetLabels.players, '状态面板');
  assert.equal(studyTheme.sheetLabels.history, 'Timeline');
  assert.equal(studyTheme.sheetLabels.room, '复盘设置');
});

test('exposes profile-first create-room surface contract for the terminal modal', () => {
  const clubTheme = getDisplayModeTheme('club');
  const proTheme = getDisplayModeTheme('pro');
  const studyTheme = getDisplayModeTheme('study');

  for (const theme of [clubTheme, proTheme, studyTheme]) {
    assert.equal(theme.createRoom.surface, 'panel');
    assert.equal(theme.createRoom.phoneSurface, 'full-screen-sheet');
    assert.equal(theme.createRoom.tileLayout, 'horizontal');
    assert.equal(theme.createRoom.advancedSettingsMode, 'collapsed');
    assert.equal(theme.createRoom.scrollbarStyle, 'themed');
  }

  assert.equal(clubTheme.createRoom.essentialSectionTitle, '基础设置');
  assert.equal(proTheme.createRoom.primaryActionLabel, '创建房间');
  assert.equal(studyTheme.createRoom.advancedSectionTitle, '高级规则');
});

test('resets the create-room advanced panel when the modal reopens', () => {
  assert.equal(
    deriveCreateRoomAdvancedPanelState({
      wasOpen: false,
      isOpen: true,
      showAdvanced: true,
    }),
    false
  );

  assert.equal(
    deriveCreateRoomAdvancedPanelState({
      wasOpen: true,
      isOpen: true,
      showAdvanced: true,
    }),
    true
  );

  assert.equal(
    deriveCreateRoomAdvancedPanelState({
      wasOpen: true,
      isOpen: false,
      showAdvanced: true,
    }),
    true
  );
});
