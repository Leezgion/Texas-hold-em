import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveRoomViewportLayout, resolveStageViewportContract } from './roomViewportLayout.js';
import { resolveTableSurfaceLayout } from './tableStageLayout.js';

test('phone portrait keeps the hero dock fixed and moves support surfaces into sheets', () => {
  const layout = resolveRoomViewportLayout({ width: 390, height: 844 });

  assert.equal(layout.viewportModel, 'phone-terminal');
  assert.equal(layout.pageScroll, 'locked');
  assert.equal(layout.heroDockPlacement, 'fixed-bottom');
  assert.equal(layout.supportSurfaceModel, 'bottom-sheets');
  assert.equal(layout.supportSurfacePolicy, 'bottom-sheets');
  assert.equal(layout.contentMaxWidth, '100%');
});

test('tablet keeps the room terminal in a split but single-screen form', () => {
  const layout = resolveRoomViewportLayout({ width: 1024, height: 1366 });

  assert.equal(layout.viewportModel, 'tablet-terminal');
  assert.equal(layout.pageScroll, 'locked');
  assert.equal(layout.roomScrollContract, 'single-screen');
  assert.equal(layout.heroDockPlacement, 'fixed-bottom');
  assert.equal(layout.supportSurfaceModel, 'slide-panels');
  assert.equal(layout.contentMaxWidth, '100%');
});

test('desktop keeps the room terminal centered with secondary rails', () => {
  const layout = resolveRoomViewportLayout({ width: 1440, height: 900 });

  assert.equal(layout.viewportModel, 'desktop-terminal');
  assert.equal(layout.pageScroll, 'locked');
  assert.equal(layout.roomScrollContract, 'single-screen');
  assert.equal(layout.heroDockPlacement, 'fixed-bottom');
  assert.equal(layout.supportSurfaceModel, 'slide-panels');
  assert.equal(layout.supportSurfacePolicy, 'slide-panels');
  assert.equal(layout.contentMaxWidth, '1440px');
});

test('ultrawide expands the same terminal without turning it into a page layout', () => {
  const layout = resolveRoomViewportLayout({ width: 1920, height: 1080 });

  assert.equal(layout.viewportModel, 'ultrawide-terminal');
  assert.equal(layout.pageScroll, 'locked');
  assert.equal(layout.roomScrollContract, 'single-screen');
  assert.equal(layout.heroDockPlacement, 'fixed-bottom');
  assert.equal(layout.supportSurfaceModel, 'rails-and-overlays');
  assert.equal(layout.supportSurfacePolicy, 'rails-and-overlays');
  assert.equal(layout.contentMaxWidth, '1600px');
});

test('tablet landscape still keeps the room terminal single-screen', () => {
  const layout = resolveRoomViewportLayout({ width: 1180, height: 820 });

  assert.equal(layout.viewportModel, 'tablet-terminal');
  assert.equal(layout.pageScroll, 'locked');
  assert.equal(layout.roomScrollContract, 'single-screen');
  assert.equal(layout.heroDockPlacement, 'fixed-bottom');
  assert.equal(layout.contentMaxWidth, '100%');
});

test('compact desktop keeps support surfaces out of the main page flow', () => {
  const layout = resolveRoomViewportLayout({ width: 1280, height: 900 });

  assert.equal(layout.viewportModel, 'desktop-terminal');
  assert.equal(layout.pageScroll, 'locked');
  assert.equal(layout.roomScrollContract, 'single-screen');
  assert.equal(layout.heroDockPlacement, 'fixed-bottom');
  assert.equal(layout.supportSurfaceModel, 'slide-panels');
  assert.equal(layout.supportSurfacePolicy, 'slide-panels');
  assert.equal(layout.contentMaxWidth, '1440px');
});

test('short-height landscape windows switch the room terminal into a compressed stage budget', () => {
  const layout = resolveRoomViewportLayout({ width: 844, height: 390 });

  assert.equal(layout.viewportModel, 'tablet-terminal');
  assert.equal(layout.heightClass, 'short-height');
  assert.equal(layout.stageDensity, 'compressed');
  assert.equal(layout.roomScrollContract, 'single-screen');
  assert.equal(layout.heroDockPlacement, 'fixed-bottom');
  assert.equal(layout.minStageBudgetPx, 180);
});

test('room shell and table stage share the same short-height stage budget contract', () => {
  const viewport = { width: 844, height: 390 };
  const roomLayout = resolveRoomViewportLayout(viewport);
  const stageContract = resolveStageViewportContract(viewport);
  const tableLayout = resolveTableSurfaceLayout({
    viewportWidth: viewport.width,
    viewportHeight: viewport.height,
    tableDiameter: 320,
  });

  assert.equal(roomLayout.heightClass, 'short-height');
  assert.equal(roomLayout.stageDensity, 'compressed');
  assert.equal(stageContract.heightClass, roomLayout.heightClass);
  assert.equal(stageContract.stageDensity, roomLayout.stageDensity);
  assert.equal(stageContract.minStageBudgetPx, roomLayout.minStageBudgetPx);
  assert.equal(tableLayout.heightClass, roomLayout.heightClass);
  assert.equal(tableLayout.stageDensity, roomLayout.stageDensity);
  assert.equal(tableLayout.stageBudget.minStageBudgetPx, roomLayout.minStageBudgetPx);
  assert.equal(tableLayout.stageMinHeightPx, roomLayout.minStageBudgetPx);
});
