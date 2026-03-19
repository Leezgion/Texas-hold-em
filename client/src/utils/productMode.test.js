import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildModePreviewCards,
  getDisplayModeTheme,
  normalizeDisplayModePreference,
  normalizeRoomMode,
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
