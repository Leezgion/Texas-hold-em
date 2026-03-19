import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveRoomViewportLayout } from './roomViewportLayout.js';

test('phone portrait keeps the hero dock fixed and moves support surfaces into sheets', () => {
  const layout = resolveRoomViewportLayout({ width: 390, height: 844 });

  assert.equal(layout.viewportModel, 'phone-terminal');
  assert.equal(layout.pageScroll, 'locked');
  assert.equal(layout.heroDockPlacement, 'fixed-bottom');
  assert.equal(layout.supportSurfaceModel, 'bottom-sheets');
  assert.equal(layout.contentMaxWidth, '100%');
});

test('tablet keeps the room terminal in a split but single-screen form', () => {
  const layout = resolveRoomViewportLayout({ width: 1024, height: 1366 });

  assert.equal(layout.viewportModel, 'tablet-terminal');
  assert.equal(layout.pageScroll, 'locked');
  assert.equal(layout.heroDockPlacement, 'fixed-bottom');
  assert.equal(layout.supportSurfaceModel, 'slide-panels');
  assert.equal(layout.contentMaxWidth, '100%');
});

test('desktop keeps the room terminal centered with secondary rails', () => {
  const layout = resolveRoomViewportLayout({ width: 1440, height: 900 });

  assert.equal(layout.viewportModel, 'desktop-terminal');
  assert.equal(layout.pageScroll, 'locked');
  assert.equal(layout.heroDockPlacement, 'fixed-bottom');
  assert.equal(layout.supportSurfaceModel, 'rails-and-overlays');
  assert.equal(layout.contentMaxWidth, '1440px');
});

test('ultrawide expands the same terminal without turning it into a page layout', () => {
  const layout = resolveRoomViewportLayout({ width: 1920, height: 1080 });

  assert.equal(layout.viewportModel, 'ultrawide-terminal');
  assert.equal(layout.pageScroll, 'locked');
  assert.equal(layout.heroDockPlacement, 'fixed-bottom');
  assert.equal(layout.supportSurfaceModel, 'rails-and-overlays');
  assert.equal(layout.contentMaxWidth, '1600px');
});

test('tablet landscape still keeps the room terminal single-screen', () => {
  const layout = resolveRoomViewportLayout({ width: 1180, height: 820 });

  assert.equal(layout.viewportModel, 'tablet-terminal');
  assert.equal(layout.pageScroll, 'locked');
  assert.equal(layout.heroDockPlacement, 'fixed-bottom');
  assert.equal(layout.contentMaxWidth, '100%');
});
