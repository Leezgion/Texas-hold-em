import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildModePreviewCards,
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
