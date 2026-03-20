import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveRoomViewportLayout, resolveStageViewportContract } from './roomViewportLayout.js';
import { resolveTableSurfaceLayout } from './tableStageLayout.js';

test('phone portrait keeps the hero dock fixed and moves support surfaces into sheets', () => {
  const layout = resolveRoomViewportLayout({ width: 390, height: 844 });

  assert.equal(layout.viewportModel, 'phone-terminal');
  assert.equal(layout.pageScroll, 'locked');
  assert.equal(layout.heroDockPlacement, 'fixed-bottom');
  assert.equal(layout.dockPresentation, 'overlay-terminal');
  assert.equal(layout.headerDensity, 'compact');
  assert.equal(layout.headerActionModel, 'room-sheet-first');
  assert.equal(layout.dockReservePx, 224);
  assert.equal(layout.supportSurfaceModel, 'bottom-sheets');
  assert.deepEqual(layout.supportSurfacePolicy, {
    phone: 'sheet',
    tablet: 'panel',
    desktop: 'panel',
    ultrawide: 'rail',
  });
  assert.equal(layout.supportSurfacePolicyKey, 'phone');
  assert.equal(layout.supportSurfacePolicyValue, 'sheet');
  assert.equal(layout.contentMaxWidth, '100%');
});

test('tablet keeps the room terminal in a split but single-screen form', () => {
  const layout = resolveRoomViewportLayout({ width: 1024, height: 1366 });

  assert.equal(layout.viewportModel, 'tablet-terminal');
  assert.equal(layout.pageScroll, 'locked');
  assert.equal(layout.roomScrollContract, 'single-screen');
  assert.equal(layout.heroDockPlacement, 'fixed-bottom');
  assert.equal(layout.dockPresentation, 'overlay-terminal');
  assert.equal(layout.headerDensity, 'regular');
  assert.equal(layout.headerActionModel, 'toolbar');
  assert.equal(layout.dockReservePx, 208);
  assert.equal(layout.supportSurfaceModel, 'slide-panels');
  assert.equal(layout.contentMaxWidth, '100%');
});

test('desktop keeps the room terminal centered with secondary rails', () => {
  const layout = resolveRoomViewportLayout({ width: 1440, height: 900 });

  assert.equal(layout.viewportModel, 'desktop-terminal');
  assert.equal(layout.pageScroll, 'locked');
  assert.equal(layout.roomScrollContract, 'single-screen');
  assert.equal(layout.heroDockPlacement, 'fixed-bottom');
  assert.equal(layout.dockPresentation, 'overlay-terminal');
  assert.equal(layout.headerDensity, 'regular');
  assert.equal(layout.headerActionModel, 'toolbar');
  assert.equal(layout.dockReservePx, 196);
  assert.equal(layout.supportSurfaceModel, 'slide-panels');
  assert.deepEqual(layout.supportSurfacePolicy, {
    phone: 'sheet',
    tablet: 'panel',
    desktop: 'panel',
    ultrawide: 'rail',
  });
  assert.equal(layout.supportSurfacePolicyKey, 'desktop');
  assert.equal(layout.supportSurfacePolicyValue, 'panel');
  assert.equal(layout.contentMaxWidth, '1440px');
});

test('ultrawide expands the same terminal without turning it into a page layout', () => {
  const layout = resolveRoomViewportLayout({ width: 1920, height: 1080 });

  assert.equal(layout.viewportModel, 'ultrawide-terminal');
  assert.equal(layout.pageScroll, 'locked');
  assert.equal(layout.roomScrollContract, 'single-screen');
  assert.equal(layout.heroDockPlacement, 'fixed-bottom');
  assert.equal(layout.dockPresentation, 'overlay-terminal');
  assert.equal(layout.headerDensity, 'regular');
  assert.equal(layout.headerActionModel, 'toolbar');
  assert.equal(layout.dockReservePx, 208);
  assert.equal(layout.supportSurfaceModel, 'rails-and-overlays');
  assert.deepEqual(layout.supportSurfacePolicy, {
    phone: 'sheet',
    tablet: 'panel',
    desktop: 'panel',
    ultrawide: 'rail',
  });
  assert.equal(layout.supportSurfacePolicyKey, 'ultrawide');
  assert.equal(layout.supportSurfacePolicyValue, 'rail');
  assert.equal(layout.contentMaxWidth, '1600px');
});

test('short-height ultrawide keeps toolbar actions while compressing the stage budget', () => {
  const layout = resolveRoomViewportLayout({ width: 1720, height: 680 });

  assert.equal(layout.viewportModel, 'ultrawide-terminal');
  assert.equal(layout.heightClass, 'short-height');
  assert.equal(layout.stageDensity, 'compressed');
  assert.equal(layout.headerDensity, 'compact');
  assert.equal(layout.headerActionModel, 'toolbar');
  assert.equal(layout.supportSurfaceModel, 'rails-and-overlays');
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
  assert.equal(layout.supportSurfacePolicyKey, 'desktop');
  assert.equal(layout.supportSurfacePolicyValue, 'panel');
  assert.equal(layout.contentMaxWidth, '1440px');
});

test('phone and compact desktop expose explicit support-surface policy metadata', () => {
  const phone = resolveRoomViewportLayout({ width: 390, height: 844 });
  const compactDesktop = resolveRoomViewportLayout({ width: 1280, height: 900 });

  assert.deepEqual(phone.supportSurfacePolicy, {
    phone: 'sheet',
    tablet: 'panel',
    desktop: 'panel',
    ultrawide: 'rail',
  });
  assert.equal(phone.supportSurfacePolicyKey, 'phone');
  assert.equal(phone.supportSurfacePolicy[phone.supportSurfacePolicyKey], 'sheet');

  assert.deepEqual(compactDesktop.supportSurfacePolicy, {
    phone: 'sheet',
    tablet: 'panel',
    desktop: 'panel',
    ultrawide: 'rail',
  });
  assert.equal(compactDesktop.supportSurfacePolicyKey, 'desktop');
  assert.equal(compactDesktop.supportSurfacePolicy[compactDesktop.supportSurfacePolicyKey], 'panel');
});

test('short-height landscape windows switch the room terminal into a compressed stage budget', () => {
  const layout = resolveRoomViewportLayout({ width: 844, height: 390 });

  assert.equal(layout.viewportModel, 'tablet-terminal');
  assert.equal(layout.heightClass, 'short-height');
  assert.equal(layout.stageDensity, 'compressed');
  assert.equal(layout.roomScrollContract, 'single-screen');
  assert.equal(layout.heroDockPlacement, 'fixed-bottom');
  assert.equal(layout.dockPresentation, 'overlay-terminal');
  assert.equal(layout.headerDensity, 'compact');
  assert.equal(layout.headerActionModel, 'room-sheet-first');
  assert.equal(layout.dockReservePx, 192);
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
